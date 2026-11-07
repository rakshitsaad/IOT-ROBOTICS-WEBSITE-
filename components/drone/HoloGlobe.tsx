"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { DRONE_CAMERA, DRONE_COLORS, GLOW } from "./config";

/**
 * The hologram globe the drone projects: a sphere of dots with latitude and longitude rings, a few glowing city
 * points joined by arcs (with pulses running along them), turning slowly; and a cone of light from the drone's
 * top panel up to it. `amount` (0–1) reveals it from the bottom up, like a projection building.
 */

export interface GlobeApi {
  /** centre: globe centre; apex: where the light cone starts (the drone's top); radius in world units. */
  place: (centre: THREE.Vector3, apex: THREE.Vector3, radius: number, amount: number) => void;
}

const UP = new THREE.Vector3(0, 1, 0);

export function HoloGlobe({ api }: { api: Ref<GlobeApi> }) {
  const gl = useThree((s) => s.gl);
  const globe = useMemo(() => createGlobe(), []);
  useEffect(() => () => globe.dispose(), [globe]);

  useFrame(({ clock, size }, dt) => {
    globe.tick(clock.elapsedTime, Math.min(dt, 0.05));
    globe.setPixelScale((size.height * gl.getPixelRatio()) / (2 * Math.tan(((DRONE_CAMERA.fov / 2) * Math.PI) / 180)));
  });

  useImperativeHandle(api, () => ({ place: globe.place }), [globe]);
  return <primitive object={globe.root} />;
}

/** Shared by dots, rings and arcs: reveal from the bottom, dim the far side. */
const COMMON_VERTEX = /* glsl */ `
  uniform float uReveal;
  varying float vAlpha;
  float reveal(vec3 local) {
    // local.y in -1..1 (unit sphere); the edge of the projection climbs as uReveal goes 0 → 1.
    float edge = -1.15 + 2.5 * uReveal;
    return 1.0 - smoothstep(edge - 0.25, edge, local.y);
  }
  float facing(vec4 world) {
    vec3 n = normalize(world.xyz - (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
    vec3 v = normalize(cameraPosition - world.xyz);
    return mix(0.22, 1.0, smoothstep(-0.25, 0.55, dot(n, v)));
  }
`;

function createGlobe() {
  const root = new THREE.Group();
  root.visible = false;
  const spin = new THREE.Group();
  spin.rotation.x = 0.38; // tilted axis
  root.add(spin);
  const turn = new THREE.Group();
  spin.add(turn);

  const red = new THREE.Color(DRONE_COLORS.light).multiplyScalar(GLOW.globe);
  const white = new THREE.Color(DRONE_COLORS.white).multiplyScalar(GLOW.globe * 0.9);
  const uniforms = { uReveal: { value: 0 }, uAmount: { value: 0 }, uTime: { value: 0 }, uPx: { value: 900 } };

  /* Dots: a Fibonacci sphere. */
  const N = 620;
  const dots = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    dots.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
  }
  const dotGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(dots, 3));
  const pointMat = (size: number, color: THREE.Color, twinkle: number) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { ...uniforms, uSize: { value: size }, uColor: { value: color }, uTwinkle: { value: twinkle } },
      vertexShader: /* glsl */ `
        ${COMMON_VERTEX}
        uniform float uSize, uPx, uTime, uTwinkle;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vec4 mv = viewMatrix * world;
          gl_Position = projectionMatrix * mv;
          float tw = 1.0 + uTwinkle * sin(uTime * 3.0 + position.x * 40.0);
          gl_PointSize = max(1.0, uSize * tw * uPx / -mv.z);
          vAlpha = reveal(position) * facing(world);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uAmount;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          gl_FragColor = vec4(uColor, smoothstep(1.0, 0.2, d) * vAlpha * uAmount);
        }`,
    });
  const dotMat = pointMat(0.016, red, 0);
  turn.add(new THREE.Points(dotGeo, dotMat));

  /* Rings: latitudes and longitudes, as one LineSegments. */
  const ring: number[] = [];
  const seg = 72;
  for (const lat of [-60, -30, 0, 30, 60]) {
    const y = Math.sin((lat * Math.PI) / 180);
    const r = Math.cos((lat * Math.PI) / 180);
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      ring.push(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r);
    }
  }
  for (let k = 0; k < 6; k++) {
    const lon = (k / 6) * Math.PI;
    for (let i = 0; i < seg; i++) {
      const b0 = (i / seg) * Math.PI * 2;
      const b1 = ((i + 1) / seg) * Math.PI * 2;
      ring.push(
        Math.cos(b0) * Math.cos(lon), Math.sin(b0), Math.cos(b0) * Math.sin(lon),
        Math.cos(b1) * Math.cos(lon), Math.sin(b1), Math.cos(b1) * Math.sin(lon),
      );
    }
  }
  const ringGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(ring, 3));
  const lineMat = (color: THREE.Color, strength: number, flow: boolean) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { ...uniforms, uColor: { value: color }, uStrength: { value: strength } },
      vertexShader: /* glsl */ `
        ${COMMON_VERTEX}
        attribute float aT;
        varying float vT;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * world;
          vAlpha = reveal(normalize(position)) * facing(world);
          vT = ${flow ? "aT" : "0.0"};
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uAmount, uStrength, uTime;
        varying float vAlpha, vT;
        void main() {
          float pulse = ${flow ? "0.35 + 0.65 * smoothstep(0.75, 1.0, fract(vT * 2.0 - uTime * 0.6))" : "1.0"};
          gl_FragColor = vec4(uColor, vAlpha * uAmount * uStrength * pulse);
        }`,
    });
  const ringMat = lineMat(red, 0.32, false);
  turn.add(new THREE.LineSegments(ringGeo, ringMat));

  /* Cities and arcs (seeded, so the globe is the same every time). */
  let s = 11;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const cities: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const lat = (rand() * 1.4 - 0.7) * (Math.PI / 2);
    const lon = rand() * Math.PI * 2;
    cities.push(new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)));
  }
  const cityGeo = new THREE.BufferGeometry().setFromPoints(cities.map((c) => c.clone().multiplyScalar(1.01)));
  const cityMat = pointMat(0.07, white, 0.25);
  turn.add(new THREE.Points(cityGeo, cityMat));

  const arc: number[] = [];
  const arcT: number[] = [];
  const pairs = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [3, 7]];
  const STEPS = 40;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const [i, j] of pairs) {
    const angle = cities[i].angleTo(cities[j]);
    for (let k = 0; k < STEPS; k++) {
      for (const t of [k / STEPS, (k + 1) / STEPS]) {
        // Great circle, lifted off the surface in the middle.
        const p = t === k / STEPS ? a : b;
        p.copy(cities[i]).multiplyScalar(Math.sin((1 - t) * angle) / Math.sin(angle))
          .addScaledVector(cities[j], Math.sin(t * angle) / Math.sin(angle))
          .multiplyScalar(1 + 0.22 * Math.sin(Math.PI * t) * Math.min(1, angle));
        arc.push(p.x, p.y, p.z);
        arcT.push(t);
      }
    }
  }
  const arcGeo = new THREE.BufferGeometry();
  arcGeo.setAttribute("position", new THREE.Float32BufferAttribute(arc, 3));
  arcGeo.setAttribute("aT", new THREE.Float32BufferAttribute(arcT, 1));
  const arcMat = lineMat(white, 0.9, true);
  turn.add(new THREE.LineSegments(arcGeo, arcMat));

  /* The light cone: apex at the drone, widening up to the globe, fading as it rises, with lines climbing it. */
  const coneGeo = new THREE.CylinderGeometry(1, 0.03, 1, 48, 1, true);
  coneGeo.translate(0, 0.5, 0); // apex at the origin, top (radius 1) at y = 1; uv.y: 0 at the apex, 1 at the top
  const coneMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uAmount: uniforms.uAmount, uTime: uniforms.uTime, uColor: { value: red.clone().multiplyScalar(0.7) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vRim;
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vRim = 1.0 - abs(dot(normalize(mat3(modelMatrix) * normal), normalize(cameraPosition - world.xyz)));
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uAmount, uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vRim;
      void main() {
        float fall = pow(1.0 - vUv.y, 1.4);
        float lines = smoothstep(0.85, 1.0, fract(vUv.y * 12.0 - uTime * 1.1));
        gl_FragColor = vec4(uColor, ((0.06 + 0.45 * pow(vRim, 3.0)) * fall + 0.2 * lines * fall) * uAmount);
      }`,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.frustumCulled = false;
  root.add(cone);

  const dir = new THREE.Vector3();

  return {
    root,
    tick(time: number, dt: number) {
      uniforms.uTime.value = time;
      turn.rotation.y += dt * 0.22;
    },
    place(centre: THREE.Vector3, apex: THREE.Vector3, radius: number, amount: number) {
      root.visible = amount > 0.002;
      uniforms.uAmount.value = Math.min(1, amount * 1.4);
      uniforms.uReveal.value = amount;
      if (!root.visible) return;
      spin.position.copy(centre);
      spin.scale.setScalar(radius * (0.85 + 0.15 * amount));
      // The cone: from the drone's top to the underside of the globe.
      const top = dir.copy(centre).addScaledVector(UP, -radius * 0.55);
      const height = Math.max(0.01, top.y - apex.y);
      cone.position.copy(apex);
      cone.scale.set(radius * 0.72, height, radius * 0.72);
    },
    setPixelScale(px: number) {
      uniforms.uPx.value = px;
    },
    dispose() {
      [dotGeo, ringGeo, cityGeo, arcGeo, coneGeo].forEach((g) => g.dispose());
      [dotMat, ringMat, cityMat, arcMat, coneMat].forEach((m) => m.dispose());
    },
  };
}

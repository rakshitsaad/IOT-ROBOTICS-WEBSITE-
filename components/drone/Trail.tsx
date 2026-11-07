"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { DRONE_CAMERA, DRONE_COLORS, GLOW } from "./config";

/**
 * The particle trail: ONE Points object with a ring buffer of `max` particles (1500, half on phones). A particle
 * is written once when it is emitted (start, velocity, birth time, seed); the vertex shader does the rest, so the
 * CPU never touches live particles. Each one drifts down, slows, shrinks and fades over LIFE seconds.
 * Colours: deep red, with about a quarter warm white. Additive, and pushed past 1.0 so they bloom.
 */

const LIFE = 1.4;

export interface TrailApi {
  /** Emit `n` particles at `at` (world), moving with `vel` plus a random spread. */
  emit: (at: THREE.Vector3, vel: THREE.Vector3, n: number, spread: number) => void;
  /** Particles alive right now (approximate, for /lab/drone). */
  alive: () => number;
}

export function Trail({ max, api }: { max: number; api: Ref<TrailApi> }) {
  const gl = useThree((s) => s.gl);
  const system = useMemo(() => createTrail(max), [max]);

  useEffect(() => () => system.dispose(), [system]);

  useFrame(({ clock, size }) => {
    // Point size in px per world unit at distance 1 (drawing-buffer px).
    system.tick(clock.elapsedTime, (size.height * gl.getPixelRatio()) / (2 * Math.tan(((DRONE_CAMERA.fov / 2) * Math.PI) / 180)));
  });

  useImperativeHandle(api, () => ({ emit: system.emit, alive: system.alive }), [system]);

  return <primitive object={system.points} />;
}

function createTrail(max: number) {
  const geometry = new THREE.BufferGeometry();
  const start = new Float32Array(max * 3);
  const vel = new Float32Array(max * 3);
  const birth = new Float32Array(max).fill(-1000);
  const seed = new Float32Array(max);
  const aStart = new THREE.BufferAttribute(start, 3).setUsage(THREE.DynamicDrawUsage);
  const aVel = new THREE.BufferAttribute(vel, 3).setUsage(THREE.DynamicDrawUsage);
  const aBirth = new THREE.BufferAttribute(birth, 1).setUsage(THREE.DynamicDrawUsage);
  const aSeed = new THREE.BufferAttribute(seed, 1).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", aStart);
  geometry.setAttribute("aVel", aVel);
  geometry.setAttribute("aBirth", aBirth);
  geometry.setAttribute("aSeed", aSeed);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uLife: { value: LIFE },
      uSize: { value: 0.05 },
      uPx: { value: 1000 },
      uRed: { value: new THREE.Color(DRONE_COLORS.light).multiplyScalar(GLOW.trail) },
      uWhite: { value: new THREE.Color(DRONE_COLORS.white).multiplyScalar(GLOW.trail * 0.8) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uLife, uSize, uPx;
      attribute vec3 aVel;
      attribute float aBirth, aSeed;
      varying float vAlpha, vSeed;
      void main() {
        float age = uTime - aBirth;
        float t = age / uLife;
        if (t < 0.0 || t > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vAlpha = 0.0; return; }
        // Slows down (drag), and drifts down a little faster as it ages.
        float k = 2.6;
        vec3 p = position + aVel * (1.0 - exp(-k * age)) / k + vec3(0.0, -0.12 * age - 0.28 * age * age, 0.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float s = uSize * (0.5 + fract(aSeed * 7.31)) * (1.0 - 0.8 * t);
        gl_PointSize = max(1.0, s * uPx / -mv.z);
        vAlpha = (1.0 - t) * smoothstep(0.0, 0.05, t);
        vSeed = aSeed;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uRed, uWhite;
      varying float vAlpha, vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        a *= a;
        vec3 c = vSeed > 0.74 ? uWhite : uRed;
        gl_FragColor = vec4(c, a * vAlpha);
      }`,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;

  let head = 0;
  let dirty = false;
  const rand = () => Math.random() * 2 - 1;

  return {
    points,
    material,
    tick(time: number, px: number) {
      material.uniforms.uTime.value = time;
      material.uniforms.uPx.value = px;
      if (!dirty) return;
      aStart.needsUpdate = aVel.needsUpdate = aBirth.needsUpdate = aSeed.needsUpdate = true;
      dirty = false;
    },
    emit(at: THREE.Vector3, v: THREE.Vector3, n: number, spread: number) {
      const now = material.uniforms.uTime.value;
      for (let k = 0; k < n; k++) {
        const i = head;
        head = (head + 1) % max;
        start[i * 3] = at.x + rand() * 0.03;
        start[i * 3 + 1] = at.y + rand() * 0.03;
        start[i * 3 + 2] = at.z + rand() * 0.03;
        vel[i * 3] = v.x + rand() * spread;
        vel[i * 3 + 1] = v.y + rand() * spread;
        vel[i * 3 + 2] = v.z + rand() * spread;
        // Spread births over the frame so a burst doesn't move in lockstep.
        birth[i] = now - Math.random() * 0.016;
        seed[i] = Math.random();
      }
      if (n > 0) dirty = true;
    },
    alive() {
      const now = material.uniforms.uTime.value;
      let c = 0;
      for (let i = 0; i < max; i++) if (now - birth[i] < LIFE) c++;
      return c;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

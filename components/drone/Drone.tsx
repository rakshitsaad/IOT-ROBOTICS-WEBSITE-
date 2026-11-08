"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { IRIS_STOPS } from "@/lib/tokens";
import { DRONE_COLORS, DRONE_SIZE, GLOW } from "./config";

/**
 * The club's quadcopter, built from primitives in code (no model file), in the same spirit as ClubBot (§11).
 * Local frame: y up, nose towards -z. About 1.6 units across, rotor tip to rotor tip on the diagonal.
 *
 * - a rounded light grey body with a dark glossy top panel and a thin front LED strip in the iris sheen;
 * - four arms in an X, each ending in a motor pod with an emissive ring under the rotor;
 * - two-blade propellers spinning fast, drawn with a faint motion-blur disc;
 * - a camera gimbal under the nose with a glowing lens dot.
 *
 * Emissive parts are pushed above 1.0 (GLOW) and not tone mapped, so a bloom threshold of ~1 picks only them.
 */

const { armReach, rotor, body } = DRONE_SIZE;
const DIAG = Math.SQRT1_2;

/** Rotor centres in drone space (front-left, front-right, back-right, back-left). */
export const ROTORS: [number, number, number][] = [
  [-armReach * DIAG, 0.075, -armReach * DIAG],
  [armReach * DIAG, 0.075, -armReach * DIAG],
  [armReach * DIAG, 0.075, armReach * DIAG],
  [-armReach * DIAG, 0.075, armReach * DIAG],
];
/** The gimbal's lens (scan beam apex) and the top panel (globe light cone apex), drone space. */
export const LENS: [number, number, number] = [0, -0.16, -0.2];
export const TOP: [number, number, number] = [0, 0.1, 0];

export interface DroneParts {
  root: THREE.Group;
  /** Drone-space points on its surfaces (the dissolve starts from these). */
  sample: (n: number) => Float32Array;
}

export function Drone({
  parts,
  spin = true,
  power,
}: {
  parts?: Ref<DroneParts | null>;
  spin?: boolean;
  /** 0–1, read every frame: rotor speed and ring brightness (the sidekick powers down when it naps). Default 1. */
  power?: { current: number };
}) {
  const root = useRef<THREE.Group>(null);
  const rotors = useRef<(THREE.Group | null)[]>([]);
  const assets = useMemo(() => buildAssets(), []);
  const { geo, mat } = assets;

  useImperativeHandle<DroneParts | null, DroneParts | null>(
    parts,
    () => (root.current ? { root: root.current, sample: (n: number) => samplePoints(root.current!, n) } : null),
    [],
  );

  useEffect(() => () => disposeAssets(assets), [assets]);

  // Rotors: very fast, opposite directions on the diagonals (the blur disc does the reading; the blades strobe).
  useFrame((_, dt) => {
    if (!spin) return;
    const p = power ? power.current : 1;
    if (power) assets.setGlow(p);
    const step = Math.min(dt, 0.05) * 62 * p;
    rotors.current.forEach((r, i) => {
      if (r) r.rotation.y += i % 2 ? -step : step;
    });
  });

  return (
    <group ref={root}>
      {/* Body + top panel + front LED strip */}
      <mesh geometry={geo.body} material={mat.body} />
      <mesh geometry={geo.panel} material={mat.panel} position-y={body.h / 2 + 0.006} />
      <mesh geometry={geo.nose} material={mat.panel} position={[0, -0.005, -body.d / 2 + 0.004]} />
      <mesh geometry={geo.led} material={mat.led} position={[0, -0.005, -body.d / 2 - 0.006]} />
      <mesh geometry={geo.tail} material={mat.panel} position={[0, 0.01, body.d / 2 - 0.02]} />

      {/* Arms, pods, rings, rotors */}
      {ROTORS.map(([x, , z], i) => {
        const angle = Math.atan2(x, z);
        return (
          <group key={i}>
            <mesh geometry={geo.arm} material={mat.arm} position={[x * 0.55, -0.005, z * 0.55]} rotation-y={angle} />
            <group position={[x, 0, z]}>
              <mesh geometry={geo.pod} material={mat.pod} />
              <mesh geometry={geo.bell} material={mat.arm} position-y={0.06} />
              <mesh geometry={geo.ring} material={mat.ring} position-y={-0.058} rotation-x={Math.PI / 2} />
              <mesh geometry={geo.leg} material={mat.pod} position-y={-0.1} />
              <group
                ref={(el) => {
                  rotors.current[i] = el;
                }}
                position-y={0.085}
              >
                <mesh geometry={geo.hub} material={mat.arm} />
                {/* One bar through the hub = a two-blade prop. */}
                <mesh geometry={geo.blade} material={mat.blade} />
                <mesh geometry={geo.disc} material={mat.disc} rotation-x={-Math.PI / 2} position-y={0.006} />
              </group>
            </group>
          </group>
        );
      })}

      {/* Camera gimbal under the nose */}
      <group position={[0, -0.1, -0.2]}>
        <mesh geometry={geo.yoke} material={mat.arm} position-y={0.03} />
        <mesh geometry={geo.camera} material={mat.panel} scale={[1, 0.86, 1]} position-y={-0.03} />
        <mesh geometry={geo.lens} material={mat.panel} position={[0, -0.03, -0.062]} rotation-x={Math.PI / 2} />
        <mesh geometry={geo.lensDot} material={mat.lens} position={[0, -0.03, -0.074]} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------- assets */

type Assets = ReturnType<typeof buildAssets>;

function hdr(color: string, k: number) {
  return new THREE.Color(color).multiplyScalar(k);
}

function buildAssets() {
  const geo = {
    body: new RoundedBoxGeometry(body.w, body.h, body.d, 4, body.r),
    panel: new RoundedBoxGeometry(body.w * 0.68, 0.026, body.d * 0.66, 3, 0.012),
    nose: new RoundedBoxGeometry(body.w * 0.62, 0.07, 0.03, 2, 0.012),
    led: new RoundedBoxGeometry(body.w * 0.5, 0.014, 0.01, 1, 0.005),
    tail: new RoundedBoxGeometry(body.w * 0.4, 0.05, 0.06, 2, 0.02),
    arm: new RoundedBoxGeometry(0.05, 0.04, armReach * 0.72, 2, 0.018),
    pod: new THREE.CylinderGeometry(0.058, 0.064, 0.11, 24),
    bell: new THREE.CylinderGeometry(0.045, 0.05, 0.03, 24),
    ring: new THREE.TorusGeometry(0.072, 0.012, 10, 40),
    leg: new THREE.CylinderGeometry(0.012, 0.016, 0.07, 10),
    hub: new THREE.CylinderGeometry(0.02, 0.02, 0.022, 14),
    blade: bladeGeometry(),
    disc: new THREE.CircleGeometry(rotor, 40),
    yoke: new THREE.CylinderGeometry(0.03, 0.035, 0.05, 14),
    camera: new THREE.SphereGeometry(0.068, 24, 16),
    lens: new THREE.CylinderGeometry(0.034, 0.038, 0.03, 20),
    lensDot: new THREE.SphereGeometry(0.017, 12, 8),
  };

  const led = createSheenTexture();
  const mat = {
    // Matte light grey shell, dark glossy panels, dark metallic arms and pods.
    body: new THREE.MeshStandardMaterial({ color: DRONE_COLORS.body, roughness: 0.55, metalness: 0.15 }),
    panel: new THREE.MeshPhysicalMaterial({
      color: DRONE_COLORS.panel,
      roughness: 0.18,
      metalness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    arm: new THREE.MeshStandardMaterial({ color: DRONE_COLORS.arm, roughness: 0.38, metalness: 0.65 }),
    pod: new THREE.MeshStandardMaterial({ color: DRONE_COLORS.pod, roughness: 0.4, metalness: 0.55 }),
    blade: new THREE.MeshStandardMaterial({
      color: DRONE_COLORS.blade,
      roughness: 0.5,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
    disc: blurDiscMaterial(),
    ring: new THREE.MeshBasicMaterial({ color: hdr(DRONE_COLORS.light, GLOW.ring), toneMapped: false }),
    lens: new THREE.MeshBasicMaterial({ color: hdr(DRONE_COLORS.light, GLOW.lens), toneMapped: false }),
    led: new THREE.MeshBasicMaterial({ map: led, color: new THREE.Color(1, 1, 1).multiplyScalar(GLOW.led), toneMapped: false }),
  };
  const ringBase = mat.ring.color.clone();
  const lensBase = mat.lens.color.clone();
  let glow = 1;
  return {
    geo,
    mat,
    textures: [led],
    /** Scale the rings and lens (0–1 → 25–100% of their glow). */
    setGlow(p: number) {
      if (p === glow) return;
      glow = p;
      const k = 0.25 + 0.75 * p;
      mat.ring.color.copy(ringBase).multiplyScalar(k);
      mat.lens.color.copy(lensBase).multiplyScalar(k);
    },
  };
}

function disposeAssets({ geo, mat, textures }: Assets) {
  Object.values(geo).forEach((g) => g.dispose());
  Object.values(mat).forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

/** A slim blade, tapered and lifted at the tip, along x. */
function bladeGeometry() {
  const g = new THREE.BoxGeometry(rotor * 1.9, 0.006, 0.042, 8, 1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const t = Math.abs(x) / rotor; // 0 at the hub, ~0.95 at the tip
    p.setZ(i, p.getZ(i) * (1 - 0.45 * t));
    p.setY(i, p.getY(i) + 0.008 * t * t);
  }
  g.computeVertexNormals();
  return g;
}

/** The spinning-prop look: a faint disc, clear at the hub, a little denser towards the tips, with a soft rim. */
function blurDiscMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(DRONE_COLORS.white) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float body = smoothstep(0.12, 0.45, r) * (1.0 - smoothstep(0.86, 1.0, r)) * 0.055;
        float rim = smoothstep(0.82, 0.93, r) * (1.0 - smoothstep(0.93, 1.0, r)) * 0.11;
        gl_FragColor = vec4(uColor, body + rim);
      }`,
  });
}

/** The front LED strip: the iris sheen (maroon → red → maroon) along its length. */
function createSheenTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 4;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 128, 0);
  IRIS_STOPS.forEach((color, i) => grad.addColorStop(i / (IRIS_STOPS.length - 1), color));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Random points on the drone's visible surfaces (not the blur discs), in drone space. Seeded: same every time. */
function samplePoints(root: THREE.Group, n: number): Float32Array {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const pool: number[] = [];
  const v = new THREE.Vector3();
  const m = new THREE.Matrix4();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || (mesh.material as THREE.Material).type === "ShaderMaterial") return;
    m.multiplyMatrices(inv, mesh.matrixWorld);
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      pool.push(v.x, v.y, v.z);
    }
  });
  const out = new Float32Array(n * 3);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const count = pool.length / 3;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(rand() * count) * 3;
    out[i * 3] = pool[k];
    out[i * 3 + 1] = pool[k + 1];
    out[i * 3 + 2] = pool[k + 2];
  }
  return out;
}

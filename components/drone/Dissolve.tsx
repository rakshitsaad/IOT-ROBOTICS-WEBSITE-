"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { DRONE_CAMERA, DRONE_COLORS, GLOW } from "./config";

/**
 * The dissolve: the drone breaks into glowing points that stream off towards the next section (down the page and
 * towards the camera) as streaks. Every particle's position is a pure function of the amount `d` (0–1), so
 * scrolling back reassembles it exactly. The rig passes the drone's surface samples (drone space) and its world
 * matrix, frozen at the moment the dissolve starts.
 */

export interface DissolveApi {
  /** `samples`: drone-space points (xyz…); `matrix`: the drone's world matrix to start from; `d`: 0–1. */
  update: (samples: Float32Array, matrix: THREE.Matrix4, d: number) => void;
}

/** Where the streaks go: down, a little right, and towards the camera. */
const HEADING = new THREE.Vector3(0.18, -1, 0.42).normalize();
const TRAVEL = 13;

export function Dissolve({ count, api }: { count: number; api: Ref<DissolveApi> }) {
  const gl = useThree((s) => s.gl);
  const fx = useMemo(() => createDissolve(count), [count]);
  useEffect(() => () => fx.dispose(), [fx]);
  useFrame(({ size }) => {
    fx.setPixelScale((size.height * gl.getPixelRatio()) / (2 * Math.tan(((DRONE_CAMERA.fov / 2) * Math.PI) / 180)));
  });
  useImperativeHandle(api, () => ({ update: fx.update }), [fx]);
  return (
    <>
      <primitive object={fx.lines} />
      <primitive object={fx.heads} />
    </>
  );
}

function createDissolve(n: number) {
  // Per particle, fixed: a delay (peels from the nose back, with noise), a heading jitter, a shimmer, a colour.
  let s = 3;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const delay = new Float32Array(n);
  const dir = new Float32Array(n * 3);
  const shimmer = new Float32Array(n * 3);
  const white = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    delay[i] = rand();
    v.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).multiplyScalar(0.35).add(HEADING).normalize();
    dir.set([v.x, v.y, v.z], i * 3);
    shimmer.set([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1], i * 3);
    white[i] = rand() > 0.7 ? 1 : 0;
  }

  const red = new THREE.Color(DRONE_COLORS.light).multiplyScalar(GLOW.streak);
  const warm = new THREE.Color(DRONE_COLORS.white).multiplyScalar(GLOW.streak * 0.8);

  // Streaks: two vertices per particle (head, tail), each with colour + alpha.
  const linePos = new Float32Array(n * 6);
  const lineCol = new Float32Array(n * 8);
  const lineGeo = new THREE.BufferGeometry();
  const aLinePos = new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage);
  const aLineCol = new THREE.BufferAttribute(lineCol, 4).setUsage(THREE.DynamicDrawUsage);
  lineGeo.setAttribute("position", aLinePos);
  lineGeo.setAttribute("aColor", aLineCol);
  const lineMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aColor;
      varying vec4 vColor;
      void main() { vColor = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec4 vColor;
      void main() { gl_FragColor = vColor; }`,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.frustumCulled = false;
  lines.visible = false;
  lines.renderOrder = 4;

  // Heads: points, so each streak has a bright tip.
  const headPos = new Float32Array(n * 3);
  const headCol = new Float32Array(n * 4);
  const headGeo = new THREE.BufferGeometry();
  const aHeadPos = new THREE.BufferAttribute(headPos, 3).setUsage(THREE.DynamicDrawUsage);
  const aHeadCol = new THREE.BufferAttribute(headCol, 4).setUsage(THREE.DynamicDrawUsage);
  headGeo.setAttribute("position", aHeadPos);
  headGeo.setAttribute("aColor", aHeadCol);
  const headMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uPx: { value: 900 }, uSize: { value: 0.03 } },
    vertexShader: /* glsl */ `
      uniform float uPx, uSize;
      attribute vec4 aColor;
      varying vec4 vColor;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.0, uSize * uPx / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      varying vec4 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        gl_FragColor = vec4(vColor.rgb, vColor.a * smoothstep(1.0, 0.1, d));
      }`,
  });
  const heads = new THREE.Points(headGeo, headMat);
  heads.frustumCulled = false;
  heads.visible = false;
  heads.renderOrder = 4;

  const p = new THREE.Vector3();
  const head = new THREE.Vector3();
  const tail = new THREE.Vector3();

  return {
    lines,
    heads,
    setPixelScale(px: number) {
      headMat.uniforms.uPx.value = px;
    },
    update(samples: Float32Array, matrix: THREE.Matrix4, d: number) {
      const on = d > 0.0005;
      lines.visible = heads.visible = on;
      if (!on) return;
      const appear = THREE.MathUtils.smoothstep(d, 0, 0.04);
      const count = Math.min(n, samples.length / 3);
      for (let i = 0; i < count; i++) {
        p.fromArray(samples, i * 3).applyMatrix4(matrix);
        // Nose (−z) peels first, with noise; each particle travels for half of the dissolve.
        const nose = THREE.MathUtils.clamp(0.5 + samples[i * 3 + 2] * 0.8, 0, 1);
        const start = 0.05 + 0.4 * (0.6 * nose + 0.4 * delay[i]);
        const t = THREE.MathUtils.clamp((d - start) / 0.5, 0, 1);
        const travel = t * t * TRAVEL;
        const streak = 0.04 + 1.6 * t; // faster → longer
        const jitter = 0.035 * appear * (1 - t);
        const dx = dir[i * 3];
        const dy = dir[i * 3 + 1];
        const dz = dir[i * 3 + 2];
        head.set(
          p.x + dx * travel + shimmer[i * 3] * jitter,
          p.y + dy * travel + shimmer[i * 3 + 1] * jitter,
          p.z + dz * travel + shimmer[i * 3 + 2] * jitter,
        );
        const back = Math.max(0, travel - streak);
        tail.set(p.x + dx * back, p.y + dy * back, p.z + dz * back);
        const alpha = appear * (1 - THREE.MathUtils.smoothstep(t, 0.75, 1));
        const c = white[i] ? warm : red;

        head.toArray(linePos, i * 6);
        tail.toArray(linePos, i * 6 + 3);
        lineCol.set([c.r, c.g, c.b, alpha * (t > 0 ? 0.9 : 0)], i * 8);
        lineCol.set([c.r, c.g, c.b, 0], i * 8 + 4);
        head.toArray(headPos, i * 3);
        headCol.set([c.r, c.g, c.b, alpha], i * 4);
      }
      aLinePos.needsUpdate = aLineCol.needsUpdate = aHeadPos.needsUpdate = aHeadCol.needsUpdate = true;
    },
    dispose() {
      lineGeo.dispose();
      headGeo.dispose();
      lineMat.dispose();
      headMat.dispose();
    },
  };
}

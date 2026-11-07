"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { DRONE_COLORS, GLOW } from "./config";

/**
 * The scan beam: an open cone from the gimbal's lens down to the card being scanned. Additive, brightest at the
 * apex and fading towards the card, with brighter silhouette edges and thin scanlines running down it.
 * The rig places it every frame with `place()`; `amount` (0–1) fades it in and out.
 */

export interface BeamApi {
  place: (apex: THREE.Vector3, target: THREE.Vector3, radius: number, amount: number) => void;
}

const DOWN = new THREE.Vector3(0, -1, 0);

export function ScanBeam({ api }: { api: Ref<BeamApi> }) {
  const beam = useMemo(() => createBeam(), []);
  useEffect(() => () => beam.dispose(), [beam]);

  useFrame(({ clock }) => beam.tick(clock.elapsedTime));

  useImperativeHandle(api, () => ({ place: beam.place }), [beam]);
  return <primitive object={beam.mesh} />;
}

function createBeam() {
  // Apex at the origin, base (radius 1) at y = -1. uv.y: 1 at the apex, 0 at the base.
  const geometry = new THREE.CylinderGeometry(0.025, 1, 1, 48, 1, true);
  geometry.translate(0, -0.5, 0);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uAmount: { value: 0 },
      uColor: { value: new THREE.Color(DRONE_COLORS.light).multiplyScalar(GLOW.beam) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vRim;
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vec3 v = normalize(cameraPosition - world.xyz);
        vRim = 1.0 - abs(dot(n, v));
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAmount;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vRim;
      void main() {
        float fall = pow(vUv.y, 1.3);                                   // fades towards the card
        float lines = smoothstep(0.86, 1.0, fract(vUv.y * 16.0 + uTime * 1.4)); // scanlines moving down
        float a = (0.07 + 0.5 * pow(vRim, 3.0)) * (0.25 + 0.75 * fall) + 0.28 * lines * (0.3 + 0.7 * fall);
        gl_FragColor = vec4(uColor, a * uAmount);
      }`,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  mesh.visible = false;

  const dir = new THREE.Vector3();
  return {
    mesh,
    tick(time: number) {
      material.uniforms.uTime.value = time;
    },
    place(apex: THREE.Vector3, target: THREE.Vector3, radius: number, amount: number) {
      material.uniforms.uAmount.value = amount;
      mesh.visible = amount > 0.002;
      if (!mesh.visible) return;
      dir.subVectors(target, apex);
      const length = dir.length();
      mesh.position.copy(apex);
      mesh.quaternion.setFromUnitVectors(DOWN, dir.normalize());
      mesh.scale.set(radius, length, radius);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

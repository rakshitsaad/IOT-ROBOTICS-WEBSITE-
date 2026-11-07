"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useRef } from "react";
import { ACCENTS } from "@/lib/tokens";
import { ClubBot } from "./ClubBot";
import { botDebug } from "./config";

/**
 * Lights + environment + robot. The environment is built from Lightformers
 * rendered once into a small cube map, so nothing is fetched from a CDN.
 */
export function BotScene({
  logoUrl,
  bootOnMount,
  onReady,
}: {
  logoUrl?: string;
  bootOnMount?: boolean;
  onReady?: () => void;
}) {
  return (
    <>
      <ambientLight intensity={0.18} />
      {/* Key: upper left, in front */}
      <directionalLight position={[-3.5, 5, 4]} intensity={2.3} />
      {/* Soft fill from the right so the graphite never goes flat black */}
      <directionalLight position={[3.5, 1.5, 3]} intensity={0.35} />
      {/* Violet rim from behind */}
      <directionalLight position={[2.2, 3, -4.5]} intensity={5} color={ACCENTS.violet} />
      <directionalLight position={[-2.6, 2, -4]} intensity={1.6} color={ACCENTS.violet} />

      {/* Soft studio environment, low intensity (reflections on screen and bezel) */}
      <Environment resolution={64} frames={1} environmentIntensity={0.4}>
        <Lightformer form="rect" intensity={2.2} position={[-3, 3.5, 3]} scale={[4, 2.5, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[3.5, 1.2, 2.5]} scale={[3, 3, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={1.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="ring" intensity={2.4} color={ACCENTS.violet} position={[0, 2, -5]} scale={3} target={[0, 1, 0]} />
      </Environment>

      <ClubBot logoUrl={logoUrl} bootOnMount={bootOnMount} />
      <FrameProbe onReady={onReady} />
    </>
  );
}

/** Reports "ready" after the first rendered frames, and keeps botDebug fresh. */
function FrameProbe({ onReady }: { onReady?: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const state = useRef({ frames: 0, ready: false, lastStat: 0 });

  useFrame(({ clock }) => {
    const s = state.current;
    s.frames++;
    if (!s.ready && s.frames > 2) {
      s.ready = true;
      onReady?.();
    }
    const t = clock.elapsedTime;
    if (t - s.lastStat > 0.5) {
      s.lastStat = t;
      botDebug.calls = gl.info.render.calls;
      botDebug.triangles = countTriangles(scene);
    }
    // Priority -1: runs before ContactShadows' own render passes, so
    // gl.info still holds the previous frame's main render.
  }, -1);

  return null;
}

/** Triangles in the visible meshes of the scene (the model, not shadow passes). */
function countTriangles(root: THREE.Object3D) {
  let total = 0;
  root.traverseVisible((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const g = mesh.geometry;
    const count = g.index ? g.index.count : (g.attributes.position?.count ?? 0);
    total += count / 3;
  });
  return Math.round(total);
}

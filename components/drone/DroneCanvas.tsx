"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { COLORS } from "@/lib/tokens";
import { DRONE_CAMERA } from "./config";
import { DroneRig } from "./DroneRig";

/**
 * The drone's WebGL canvas: transparent, over the dashboard, never taking pointer events. Loaded only through
 * next/dynamic (ssr: false) from DroneStage, so three.js and postprocessing ship only when the section is near.
 *
 * Bloom picks only the emissive parts: they are pushed past 1.0 and the threshold is 1. Tone mapping runs as the
 * last effect so the look matches with bloom off (low-memory devices render without the composer).
 */

export interface DroneCanvasProps {
  frameloop: "always" | "never";
  bloom: boolean;
  maxParticles: number;
  dissolveCount: number;
  onFail?: () => void;
}

export default function DroneCanvas({ frameloop, bloom, maxParticles, dissolveCount, onFail }: DroneCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ fov: DRONE_CAMERA.fov, position: [0, 0, DRONE_CAMERA.z], near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: !bloom, stencil: false, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", () => onFail?.(), { once: true });
      }}
    >
      <ambientLight intensity={0.35} />
      {/* Key upper left, soft fill right, and a deep red rim from behind (as on the robot). */}
      <directionalLight position={[-4, 5, 6]} intensity={2.2} />
      <directionalLight position={[4, 1, 4]} intensity={0.45} />
      <directionalLight position={[2.5, 3, -5]} intensity={3} color={COLORS.red} />
      <Environment resolution={64} frames={1} environmentIntensity={0.45}>
        <Lightformer form="rect" intensity={2} position={[-3, 4, 4]} scale={[5, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[4, 1, 3]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer form="ring" intensity={1.2} color={COLORS.red} position={[0, 1, -5]} scale={3} target={[0, 0, 0]} />
      </Environment>

      <DroneRig maxParticles={maxParticles} dissolveCount={dissolveCount} />

      {bloom && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1.15} radius={0.72} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

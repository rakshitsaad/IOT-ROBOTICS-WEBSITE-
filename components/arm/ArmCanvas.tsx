"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useRef } from "react";
import { ARM_CAMERA } from "@/lib/arm";
import { COLORS } from "@/lib/tokens";
import type { ArmQuality } from "./arm-model";
import { IndustrialArm } from "./IndustrialArm";

/**
 * The arm's WebGL canvas. Loaded only through next/dynamic (ssr: false) from ArmStage, so three.js ships only where
 * the arm renders. Transparent, and it never takes pointer events: the arm reads window input instead.
 */
export interface ArmCanvasProps {
  quality: ArmQuality;
  /** Reduced motion: one still pose, rendered on demand. */
  still: boolean;
  frameloop: "always" | "demand" | "never";
  onReady: () => void;
  onFail: () => void;
}

export default function ArmCanvas({ quality, still, frameloop, onReady, onFail }: ArmCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      shadows={quality === "high" ? "percentage" : false}
      camera={{ position: ARM_CAMERA.position, fov: ARM_CAMERA.fov, near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: true, stencil: false, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", () => onFail(), { once: true });
      }}
    >
      {/* Studio light: a soft key (in IndustrialArm, with the shadow), a fill, and a deep red rim from behind that
          draws the silhouette against the black page without turning the arm red. */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[3.5, 1.5, 3]} intensity={0.7} color="#dfe4ea" />
      <directionalLight position={[2.5, 3, -4]} intensity={1.5} color={COLORS.red} />
      <directionalLight position={[-3, 2, -3.5]} intensity={0.5} color={COLORS.red} />
      {/* Reflections for the metal, from Lightformers rendered once (nothing fetched). */}
      <Environment resolution={128} frames={1} environmentIntensity={0.95}>
        <Lightformer form="rect" intensity={2.4} position={[-3, 4, 3]} scale={[5, 2.5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} position={[4, 1, 2.5]} scale={[3, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer form="ring" intensity={1.2} color={COLORS.red} position={[1, 2, -6]} scale={4} target={[0, 0, 0]} />
      </Environment>
      <IndustrialArm quality={quality} still={still} />
      <ReadyProbe frames={still ? 1 : 3} onReady={onReady} />
    </Canvas>
  );
}

/** Reports "ready" once the first frames have rendered (the stage then fades the canvas in). */
function ReadyProbe({ frames, onReady }: { frames: number; onReady: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (++n.current === frames) onReady();
  });
  return null;
}

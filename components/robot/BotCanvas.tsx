"use client";

import { Canvas } from "@react-three/fiber";
import { BotScene } from "./BotScene";
import { BOT_CAMERA } from "./config";

/**
 * The WebGL canvas. Loaded only through next/dynamic (ssr: false) from
 * BotStage, so three.js never ships to visitors who get the poster.
 */
export interface BotCanvasProps {
  /** "always" while the stage is on screen, "never" while it is not. */
  frameloop: "always" | "never";
  logoUrl?: string;
  bootOnMount?: boolean;
  onReady?: () => void;
  /** WebGL failed at runtime (context lost / could not be created). */
  onFail?: () => void;
}

export default function BotCanvas({ frameloop, logoUrl, bootOnMount, onReady, onFail }: BotCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.75]}
      camera={{ ...BOT_CAMERA, near: 0.1, far: 40 }}
      gl={{ alpha: true, antialias: true, stencil: false, powerPreference: "high-performance" }}
      // The canvas never takes pointer events: the robot reads window pointermove.
      style={{ pointerEvents: "none" }}
      aria-hidden
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", () => onFail?.(), { once: true });
      }}
    >
      <BotScene logoUrl={logoUrl} bootOnMount={bootOnMount} onReady={onReady} />
    </Canvas>
  );
}

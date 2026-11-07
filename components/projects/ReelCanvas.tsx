"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { REEL, optimizedImage } from "@/lib/projects";
import { COLORS } from "@/lib/tokens";
import { REEL_FRAGMENT, REEL_VERTEX } from "./reel-shaders";
import { damp, reel, reelGeometry, slotArc, type ReelSlot } from "./reel-state";

/**
 * The reel's WebGL canvas (DESIGN.md §16). Loaded only through next/dynamic
 * (ssr: false) from ProjectsStage, so three.js ships only to md+ screens with
 * motion. It renders on demand: the stage calls reel.invalidate() while
 * anything moves, and the scene keeps itself going while hovers or texture
 * fades are easing.
 *
 * Textures load lazily, nearest the centre first, three at a time, as
 * same-origin resized copies (/_next/image), so remote hosts need no CORS.
 */

export interface ReelCanvasProps {
  slots: ReelSlot[];
  /** "never" while the tab is hidden. */
  frameloop: "demand" | "never";
  /** The first textures are in (or a timeout passed): the stage plays the intro. */
  onReady(): void;
  /** WebGL failed (no context, or it was lost). */
  onFail(): void;
}

export default function ReelCanvas({ slots, frameloop, onReady, onFail }: ReelCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, stencil: false, powerPreference: "high-performance" }}
      // The stage takes the pointer (drag, wheel, the hit buttons); the canvas never does.
      style={{ pointerEvents: "none" }}
      aria-hidden
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", () => onFail(), { once: true });
      }}
    >
      <ReelScene slots={slots} onReady={onReady} />
    </Canvas>
  );
}

interface TextureEntry {
  texture: THREE.Texture | null;
  state: "idle" | "loading" | "done";
}

const geometry = new THREE.PlaneGeometry(1, 1, 32, 1);
const base = new THREE.Color(COLORS.bg2);

function makeMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: REEL_VERTEX,
    fragmentShader: REEL_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uSize: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: 0 },
      uCurve: { value: 0.001 },
      uFlat: { value: 0 },
      uMorph: { value: 0 },
      uRect: { value: new THREE.Vector3() },
      uMap: { value: null },
      uImage: { value: new THREE.Vector2(4, 3) },
      uHasMap: { value: 0 },
      uAlpha: { value: 0 },
      uBright: { value: 0 },
      uSplit: { value: 0 },
      uRadius: { value: REEL.corner },
      uBase: { value: base },
    },
  });
}

function ReelScene({ slots, onReady }: { slots: ReelSlot[]; onReady(): void }) {
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const textures = useRef(new Map<string, TextureEntry>());
  /** Per-slot eased values: hover (0–1) and texture fade-in (0–1). */
  const anim = useRef<{ hover: number; tex: number }[]>([]);
  const readyCalled = useRef(false);

  const materials = useMemo(() => slots.map(() => makeMaterial()), [slots]);
  useEffect(() => {
    anim.current = [];
    return () => materials.forEach((m) => m.dispose());
  }, [materials]);

  // Let the stage request frames.
  useEffect(() => {
    reel.invalidate = () => invalidate();
    invalidate();
    return () => {
      reel.invalidate = () => {};
    };
  }, [invalidate]);

  // Camera: the z = 0 plane maps 1:1 onto the stage (px), centred, at a distance set by the width.
  const distance = REEL.camera * size.width;
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(size.height / 2 / distance));

  // Lazy textures: nearest the centre first, three at a time.
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const map = textures.current;
    const covers = [...new Set(slots.map((s) => s.cover))];
    for (const url of covers) if (!map.has(url)) map.set(url, { texture: null, state: "idle" });

    const distance = (url: string) => {
      const g = reelGeometry();
      let best = Infinity;
      slots.forEach((s, i) => {
        if (s.cover === url) best = Math.min(best, Math.abs(slotArc(i, g)));
      });
      return best;
    };

    let firstBatch = Math.min(3, covers.length);
    const markReady = () => {
      if (readyCalled.current) return;
      readyCalled.current = true;
      onReady();
    };
    const timeout = window.setTimeout(markReady, 2500);
    if (covers.length === 0) markReady();

    const next = () => {
      if (cancelled) return;
      const waiting = covers.filter((u) => map.get(u)?.state === "idle");
      if (waiting.length === 0) return;
      waiting.sort((a, b) => distance(a) - distance(b));
      const url = waiting[0];
      const entry = map.get(url)!;
      entry.state = "loading";
      loader.load(
        optimizedImage(url, 1080),
        (texture) => {
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.anisotropy = 4;
          entry.texture = texture;
          entry.state = "done";
          done();
        },
        undefined,
        () => {
          entry.state = "done";
          done();
        },
      );
    };
    const done = () => {
      if (cancelled) return;
      firstBatch -= 1;
      if (firstBatch <= 0) markReady();
      invalidate();
      next();
    };
    // Already-loaded textures (a filter change) count towards the first batch.
    const already = covers.filter((u) => map.get(u)?.state === "done").length;
    firstBatch -= already;
    if (firstBatch <= 0) markReady();
    for (let i = 0; i < 3; i++) next();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      // In-flight loads finish into the map and are reused; "loading" ones restart next time.
      for (const e of map.values()) if (e.state === "loading") e.state = "idle";
    };
  }, [slots, onReady, invalidate]);

  // Free GPU textures when the canvas goes away.
  useEffect(() => {
    const map = textures.current;
    return () => {
      for (const e of map.values()) e.texture?.dispose();
      map.clear();
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = reelGeometry();
    const m = reel.morph;
    let busy = false;

    slots.forEach((slot, i) => {
      const mesh = meshes.current[i];
      const mat = materials[i];
      if (!mesh || !mat) return;
      const a = (anim.current[i] ??= { hover: 0, tex: 0 });
      const u = mat.uniforms;
      const s = slotArc(i, g);
      const isMorph = i === m.slot;

      // Fade in from the centre on the intro; the global fade on filter changes; the fly-out.
      const intro = Math.min(Math.max((reel.intro - Math.abs(s) / (reel.width * 2.5)) / 0.6, 0), 1);
      const alpha = reel.alpha * intro * (isMorph ? 1 : 1 - reel.fly);
      const visible = alpha > 0.001 && (isMorph || Math.abs(s) < g.visible + g.panelW);
      mesh.visible = visible;
      if (!visible) return;

      const entry = textures.current.get(slot.cover);
      const texture = entry?.texture ?? null;
      if (u.uMap.value !== texture) {
        u.uMap.value = texture;
        if (texture) {
          const img = texture.image as { width: number; height: number };
          (u.uImage.value as THREE.Vector2).set(img.width, img.height);
        }
      }
      a.tex = damp(a.tex, texture ? 1 : 0, 6, dt);
      if (texture && a.tex < 0.999) busy = true;
      else if (texture) a.tex = 1;

      const hoverTarget = reel.hovered === i && !reel.dragging && m.t === 0 ? 1 : 0;
      a.hover = damp(a.hover, hoverTarget, 10, dt);
      if (Math.abs(a.hover - hoverTarget) > 0.002) busy = true;
      else a.hover = hoverTarget;

      const t = isMorph ? m.t : 0;
      (u.uSize.value as THREE.Vector2).set(g.panelW + (m.w - g.panelW) * t, g.panelH + (m.h - g.panelH) * t);
      (u.uRect.value as THREE.Vector3).set(m.x, m.y, 0);
      u.uCenter.value = s;
      u.uCurve.value = g.k;
      u.uMorph.value = t;
      u.uFlat.value = REEL.hover.flat * a.hover;
      u.uBright.value = REEL.hover.bright * a.hover;
      u.uHasMap.value = a.tex;
      u.uAlpha.value = alpha;
      u.uSplit.value = reel.split * (1 - t);
      // The morphing panel draws on top of the ones flying out.
      mesh.renderOrder = isMorph ? 1 : 0;
    });

    if (busy) invalidate();
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, distance]} fov={fov} near={1} far={distance * 4} />
      {slots.map((slot, i) => (
        <mesh
          key={slot.key}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={geometry}
          material={materials[i]}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

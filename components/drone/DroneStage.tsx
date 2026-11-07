"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import { MISSION } from "@/lib/mission";
import { FINE_POINTER, useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { droneActions, droneState, useDroneStore, type DroneMode } from "./store";

const DroneCanvas = dynamic(() => import("./DroneCanvas"), { ssr: false });

const MOBILE = "(max-width: 767.98px)";
const noop = () => () => {};
const hasWebGLOnce = () => (webgl ??= hasWebGL());
let webgl: boolean | undefined;
/** Bloom unless the device reports deviceMemory ≤ 4 (QA: ?drone=bloom / ?drone=nobloom). */
function bloomAllowed() {
  const force = new URLSearchParams(window.location.search).get("drone");
  if (force === "bloom" || force === "nobloom") return force === "bloom";
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return !(typeof memory === "number" && memory <= 4);
}

/**
 * The drone's layer: a transparent canvas filling `root` (the element that also holds the dashboard cards), never
 * taking pointer events, plus an invisible button that follows the drone so a click flips it.
 *
 * - The canvas (and three.js) loads only when the section is within a screen of the viewport, and unmounts when it
 *   is further away; it renders only while on screen and the tab is visible.
 * - Reduced motion or no WebGL: no canvas, the static poster (/drone-poster.png) instead.
 * - Bloom is off on devices reporting deviceMemory ≤ 4; phones get half the particles.
 * - QA: ?drone=nobloom / ?drone=bloom force bloom off / on.
 */
export function DroneStage({
  root,
  mode,
  className,
  posterClassName,
}: {
  root: RefObject<HTMLElement | null>;
  mode: DroneMode;
  className?: string;
  posterClassName?: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const hit = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const mobile = useMediaQuery(MOBILE);
  const fine = useMediaQuery(FINE_POINTER);
  const webglOk = useSyncExternalStore(noop, hasWebGLOnce, () => null);
  const bloom = useSyncExternalStore(noop, bloomAllowed, () => false);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  // Right after the canvas mounts, render briefly even off screen: the rig's warm-up frames compile every effect.
  const [warming, setWarming] = useState(false);
  // "pending" until hydrated (server and first client render agree), then 3D or the poster.
  const support = webglOk === null ? "pending" : reduced || !webglOk || failed ? "poster" : "webgl";

  useEffect(() => {
    droneState.mobile = mobile;
    droneState.finePointer = fine;
  }, [mobile, fine]);

  // Mode + root for the rig; reset when leaving.
  useEffect(() => {
    droneState.mode = mode;
    droneState.root = root.current;
    return () => {
      droneState.root = null;
      droneState.dissolve = 0;
      droneState.interest = { card: null, until: 0 };
      if (mode === "manual") droneActions.home();
      droneState.mode = "scroll";
      useDroneStore.getState().setScanning(null);
      useDroneStore.getState().setGlobe(false);
    };
  }, [mode, root]);

  // Near (mount) and visible (render).
  useEffect(() => {
    const el = stage.current;
    if (!el || support !== "webgl") return;
    // Mount in idle time once the section is within a screen (three.js setup is a long task); unmount when far.
    let idle = 0;
    const nearIO = new IntersectionObserver(
      ([e]) => {
        cancelIdle(idle);
        if (e.isIntersecting) idle = requestIdle(() => setNear(true));
        else setNear(false);
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    let inView = false;
    const update = () => setVisible(inView && document.visibilityState === "visible");
    const viewIO = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      update();
    });
    nearIO.observe(el);
    viewIO.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelIdle(idle);
      nearIO.disconnect();
      viewIO.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [support]);

  useEffect(() => {
    if (!near) return;
    const start = window.setTimeout(() => setWarming(true), 0);
    const stop = window.setTimeout(() => setWarming(false), 800);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [near]);

  // Pointer, in stage px (the canvas never takes pointer events, so listen on the window).
  useEffect(() => {
    if (support !== "webgl") return;
    const move = (e: PointerEvent) => {
      const el = root.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = droneState.pointer;
      p.x = e.clientX - r.left;
      p.y = e.clientY - r.top;
      p.inside = e.pointerType === "mouse" || e.pointerType === "pen" ? p.x >= 0 && p.y >= 0 && p.x <= r.width && p.y <= r.height : false;
      p.moved = performance.now();
    };
    const leave = () => {
      droneState.pointer.inside = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [support, root]);

  // The click target follows the drone (stage px written by the rig).
  useEffect(() => {
    if (support !== "webgl" || !near) return;
    const tick = () => {
      const b = hit.current;
      if (!b) return;
      const s = droneState.screen;
      const off = droneState.dissolve > 0.05 || s.r <= 0;
      b.style.visibility = off ? "hidden" : "visible";
      b.style.transform = `translate(${s.x - s.r}px, ${s.y - s.r * 0.7}px)`;
      b.style.width = `${s.r * 2}px`;
      b.style.height = `${s.r * 1.4}px`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [support, near]);

  const maxParticles = mobile ? MISSION.particles / 2 : MISSION.particles;

  return (
    <div ref={stage} className={cn("pointer-events-none absolute inset-0", className)}>
      {support === "webgl" && near && (
        <>
          <DroneCanvas
            frameloop={visible || warming ? "always" : "never"}
            bloom={bloom}
            maxParticles={maxParticles}
            dissolveCount={mobile ? 420 : 900}
            onFail={() => setFailed(true)}
          />
          <button
            ref={hit}
            type="button"
            data-cursor="link"
            aria-label="Flip the drone"
            onClick={() => droneActions.flip()}
            className="pointer-events-auto absolute top-0 left-0 rounded-full outline-offset-4 [visibility:hidden]"
          />
        </>
      )}
      {support === "poster" && (
        <div className={cn("absolute", posterClassName)}>
          <Image src="/drone-poster.png" alt="" fill sizes="(min-width: 768px) 30vw, 60vw" className="object-contain" />
        </div>
      )}
    </div>
  );
}

/** requestIdleCallback where there is one (Safari: a short timeout). */
const requestIdle = (fn: () => void): number =>
  typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 1200 }) : window.setTimeout(fn, 200);
const cancelIdle = (id: number) =>
  typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : window.clearTimeout(id);

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

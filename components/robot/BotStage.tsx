"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Component,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { BOT_CAMERA, BOT_HEIGHT, BOT_POSTER, BOT_VIEW_HEIGHT, botDebug } from "./config";
import { BOT_TRANSFORM_DEFAULT, botScreen, botTransform, useBotStore, type BotTransform } from "./store";

const BotCanvas = dynamic(() => import("./BotCanvas"), { ssr: false, loading: () => null });

/**
 * Hosts the robot. Render ONE per page.
 *
 * - fixed (default): a full-viewport, pointer-events:none layer. Move the
 *   robot around it with botTransform.
 * - fixed={false}: fills the nearest positioned parent (home hero, /lab/robot).
 *
 * Shows /robot-poster.png while three.js loads, and instead of WebGL when
 * reduced motion is on, WebGL is missing, or navigator.deviceMemory ≤ 4
 * (the poster blinks slowly). Stops rendering while the stage or the robot
 * is off screen or the tab is hidden. An invisible button over the robot
 * reports hover and clicks to useBotStore. QA overrides: ?bot=force (skip
 * the memory check), ?bot=poster.
 */
export interface BotStageProps {
  fixed?: boolean;
  className?: string;
  logoUrl?: string;
  /** Play the boot-up sequence when the 3D robot appears (default true). */
  bootOnMount?: boolean;
  /**
   * Placement written to botTransform when the stage mounts (reset on
   * unmount). It also positions the server-rendered poster, so nothing jumps
   * on hydration.
   */
  transform?: Partial<BotTransform>;
  /** Invisible hit area over the robot: hover and click/tap reach useBotStore (default true). */
  interactive?: boolean;
  /** Accessible name of the hit area. */
  label?: string;
  /** Preload the poster image (default: same as `fixed`). Turn on for an above-the-fold stage. */
  preloadPoster?: boolean;
  /** The home page's sidekick drone flies in this canvas (3D only; no drone with the poster). */
  sidekick?: boolean;
}

export function BotStage({
  fixed = true,
  className,
  logoUrl,
  bootOnMount = true,
  transform,
  interactive = true,
  label = "Say hi to the robot",
  preloadPoster = fixed,
  sidekick = false,
}: BotStageProps) {
  const support = useBotSupport();
  const stage = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const blink = useRef<HTMLImageElement>(null);
  const blinkReady = useRef(false);
  const hit = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

  const use3D = support === "webgl" && !failed;
  const posterOnly = support.startsWith("poster:") || failed;
  const showPoster = !use3D || !ready;

  // Placement: applied before the first frame, reset when the stage goes away.
  const { x, y, z, rotX, rotY, scale } = { ...BOT_TRANSFORM_DEFAULT, ...transform };
  useLayoutEffect(() => {
    gsap.killTweensOf(botTransform);
    Object.assign(botTransform, { x, y, z, rotX, rotY, scale });
    return () => {
      gsap.killTweensOf(botTransform);
      Object.assign(botTransform, BOT_TRANSFORM_DEFAULT);
    };
  }, [x, y, z, rotX, rotY, scale]);
  const initialPoster = posterCss({ x, y, z, rotX, rotY, scale });
  // The poster box is ~45vh wide on a full-viewport stage; scale up with the robot so it stays sharp.
  const posterSizes = `${Math.ceil(45 * Math.max(1, scale))}vh`;

  // Stage size, for the in-view check.
  const size = useRef({ w: 1, h: 1 });
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      size.current = { w: el.clientWidth || 1, h: el.clientHeight || 1 };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rendering on/off: stage intersecting + tab visible + robot inside the stage.
  useEffect(() => {
    const el = stage.current;
    if (!el || !use3D) return;
    let intersecting = true;
    let robotInView = true;
    const update = () => {
      const next = intersecting && robotInView && document.visibilityState === "visible";
      botDebug.rendering = next;
      setOnScreen(next);
    };
    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);

    // Cheap check on the GSAP ticker: has botTransform moved the robot out of the stage?
    const tick = () => {
      const inView = robotInStage(size.current.w, size.current.h);
      if (inView !== robotInView) {
        robotInView = inView;
        update();
      }
    };
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      gsap.ticker.remove(tick);
      botDebug.rendering = false;
    };
  }, [use3D]);

  // Poster follows botTransform (same camera maths as the 3D stage).
  useEffect(() => {
    const el = poster.current;
    if (!el || !showPoster) return;
    let last = "";
    const tick = () => {
      const css = posterCss(botTransform);
      if (css !== last) {
        el.style.transform = css;
        last = css;
      }
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [showPoster]);

  // Poster mode: blink now and then (slowly under reduced motion).
  useEffect(() => {
    const el = blink.current;
    if (!el || !posterOnly) return;
    const [min, max] = prefersReducedMotion() ? [5, 9] : [2.5, 5];
    let timer = 0;
    let open = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (blinkReady.current) {
          el.style.visibility = "visible";
          open = window.setTimeout(() => {
            el.style.visibility = "hidden";
          }, 140);
        }
        schedule();
      }, (min + Math.random() * (max - min)) * 1000);
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(open);
    };
  }, [posterOnly]);

  // Hit area follows the robot's projected box (written by ClubBot each frame).
  const showHit = use3D && ready && interactive;
  useEffect(() => {
    const el = hit.current;
    if (!el || !showHit) return;
    let last = "";
    const tick = () => {
      if (!botScreen.valid) {
        if (last !== "hidden") el.style.visibility = "hidden";
        last = "hidden";
        return;
      }
      const inset = botScreen.w * 0.06;
      const bx = Math.round(botScreen.x + inset);
      const by = Math.round(botScreen.y);
      const bw = Math.round(botScreen.w - 2 * inset);
      const bh = Math.round(botScreen.h);
      const key = `${bx},${by},${bw},${bh}`;
      if (key === last) return;
      last = key;
      el.style.visibility = "visible";
      el.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
      el.style.width = `${bw}px`;
      el.style.height = `${bh}px`;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      useBotStore.getState().setHovered(false);
    };
  }, [showHit]);

  return (
    <div
      ref={stage}
      data-bot-stage={support}
      data-bot-ready={ready || undefined}
      className={cn(
        "pointer-events-none overflow-hidden",
        fixed ? "fixed inset-0 z-30" : "absolute inset-0",
        className,
      )}
    >
      {use3D && (
        <CanvasBoundary onError={() => setFailed(true)}>
          <BotCanvas
            frameloop={onScreen ? "always" : "never"}
            logoUrl={logoUrl}
            bootOnMount={bootOnMount}
            sidekick={sidekick}
            onReady={() => setReady(true)}
            onFail={() => setFailed(true)}
          />
        </CanvasBoundary>
      )}

      {/* Poster: in the server HTML, faded out once the 3D robot has rendered. */}
      <div
        ref={poster}
        aria-hidden
        className={cn(
          "absolute top-1/2 left-1/2 origin-bottom transition-opacity duration-[600ms] ease-power3",
          showPoster ? "opacity-100" : "opacity-0",
        )}
        style={{
          height: `${(BOT_HEIGHT / BOT_VIEW_HEIGHT) * 100}%`,
          aspectRatio: `${BOT_POSTER.width} / ${BOT_POSTER.height}`,
          translate: "-50% -50%",
          transform: initialPoster,
        }}
      >
        <Image
          src={BOT_POSTER.src}
          width={BOT_POSTER.width}
          height={BOT_POSTER.height}
          alt=""
          preload={preloadPoster}
          className="h-full w-full object-contain"
          sizes={posterSizes}
        />
        {posterOnly && (
          <Image
            ref={blink}
            src={BOT_POSTER.blinkSrc}
            width={BOT_POSTER.width}
            height={BOT_POSTER.height}
            alt=""
            className="invisible absolute inset-0 h-full w-full object-contain"
            sizes={posterSizes}
            onLoad={() => {
              blinkReady.current = true;
            }}
            onError={() => {
              blinkReady.current = false;
            }}
          />
        )}
      </div>

      {showHit && (
        <button
          ref={hit}
          type="button"
          aria-label={label}
          className="pointer-events-auto invisible absolute top-0 left-0 rounded-card outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text/50"
          onPointerEnter={(e) => {
            if (e.pointerType !== "touch") useBotStore.getState().setHovered(true);
          }}
          onPointerLeave={() => useBotStore.getState().setHovered(false)}
          onClick={() => useBotStore.getState().poke()}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------- projection */

const CAM_Z = BOT_CAMERA.position[2];
const CAM_Y = BOT_CAMERA.position[1];
const POSTER_ASPECT = BOT_POSTER.width / BOT_POSTER.height;

/**
 * CSS transform that moves the poster like botTransform moves the 3D robot
 * (pinhole projection, ignores rotX / rotY). In % of the poster's own box,
 * so it needs no measurements and renders the same on the server.
 */
function posterCss(t: BotTransform) {
  const k = CAM_Z / Math.max(0.1, CAM_Z - t.z); // perspective factor
  const dx = ((t.x * k) / (BOT_HEIGHT * POSTER_ASPECT)) * 100;
  const dy = (((CAM_Y - t.y) * k - CAM_Y) / BOT_HEIGHT) * 100;
  return `translate(${dx.toFixed(3)}%, ${dy.toFixed(3)}%) scale(${(t.scale * k).toFixed(4)})`;
}

/** Is any of the robot still inside a stage w × h px? */
function robotInStage(w: number, h: number) {
  const { x, y, z, scale } = botTransform;
  const k = CAM_Z / Math.max(0.1, CAM_Z - z);
  const ppu = h / BOT_VIEW_HEIGHT; // px per world unit at z = 0
  const s = scale * k;
  const baseY = h / 2 + (CAM_Y - y) * k * ppu;
  const topY = baseY - BOT_HEIGHT * s * ppu;
  const cx = w / 2 + x * k * ppu;
  const half = 0.85 * s * ppu; // base radius
  const m = 0.05 * h;
  return baseY > -m && topY < h + m && cx + half > -m && cx - half < w + m;
}

/* ------------------------------------------------------------- support */

export type BotSupport =
  | "pending"
  | "webgl"
  | "poster:reduced-motion"
  | "poster:no-webgl"
  | "poster:low-memory"
  | "poster:forced";

let webgl: boolean | null = null;
/** Can this browser create a WebGL context? (Cached; the /about arm uses it too.) */
export function hasWebGL() {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webgl = !!ctx;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

function detectSupport(): BotSupport {
  const override = new URLSearchParams(window.location.search).get("bot");
  if (override === "poster") return "poster:forced";
  if (prefersReducedMotion()) return "poster:reduced-motion";
  if (!hasWebGL()) return "poster:no-webgl";
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (override !== "force" && typeof memory === "number" && memory <= 4) return "poster:low-memory";
  return "webgl";
}

function subscribeSupport(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** "pending" on the server and first hydration render, then the device's mode. */
export function useBotSupport(): BotSupport {
  return useSyncExternalStore(subscribeSupport, detectSupport, () => "pending");
}

/* ------------------------------------------------------- error boundary */

/** Renders nothing once its canvas throws, and reports it (shared with the /about arm). */
export class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

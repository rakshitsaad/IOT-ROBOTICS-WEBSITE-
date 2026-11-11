"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties, type Ref } from "react";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import {
  FINGER_DRAW_ORDER,
  FINGER_ORDER,
  FINGERS,
  STATIC_POSE,
  THUMB,
  glowAt,
  poseAt,
  type FingerName,
  type HandPose,
} from "./robot-hand-rig";

/**
 * The /about robot hand (DESIGN.md §15): a flat illustration drawn in the site's tokens (warm white plates with a grey
 * shaded side, a dark 2.5px outline, a red wrist cuff, maroon fingertip pads), rigged so every segment is its own <g>
 * whose origin is its joint. A parent's rotation carries its children (knuckle → middle → tip), so nothing detaches.
 *
 * `ref.setPose(progress)` poses the whole hand for a scroll progress (0–1, robot-hand-rig.ts) by writing SVG transforms
 * directly: no React state, no layout. `ref.reset()` puts it back in the static pose.
 *
 * The server HTML draws the static "reaching" pose, which is what reduced motion keeps. With motion the hand is hidden
 * (`data-state="static"`) until the scroll controller first poses it, so it never flashes in the wrong place. While it
 * is on screen and the page is still, a fingertip "servo" twitches 1–2px every couple of seconds.
 */

export interface RobotHandHandle {
  setPose(progress: number): void;
  reset(): void;
}

/** Twitches: how often (ms, plus up to `jitterSpread`), how far (degrees at the tip joint, ≈ 1–2px), and the quiet time first. */
const JITTER = { every: 2100, spread: 900, amp: [1.6, 2.6] as [number, number], quietMs: 700 };

type Jitter = { a: number; signs: Record<FingerName | "thumb", number> };

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Every rigged element's transform for a pose (plus the glow's scale and the tip twitch). */
function transforms(pose: HandPose, glow: number, jitter: Jitter | null): Record<string, string> {
  const t: Record<string, string> = {
    root: `translate(${f2(pose.x)} ${f2(pose.y)}) rotate(${f2(pose.rot)}) scale(${f2(pose.scale)})`,
    palm: `rotate(${f2(pose.wrist)})`,
    "thumb-0": `translate(${THUMB.base[0]} ${THUMB.base[1]}) rotate(${f2(pose.thumb[0])})`,
    "thumb-1": `translate(0 ${-THUMB.len[0]}) rotate(${f2(pose.thumb[1] + (jitter ? jitter.a * jitter.signs.thumb : 0))})`,
    glow: `translate(0 ${-FINGERS.index.len[2]}) scale(${f2(glow)})`,
  };
  for (const name of FINGER_ORDER) {
    const spec = FINGERS[name];
    const [spread, c1, c2, c3] = pose.fingers[name];
    const tw = jitter ? jitter.a * jitter.signs[name] : 0;
    t[`${name}-0`] = `translate(${spec.knuckle[0]} ${spec.knuckle[1]}) rotate(${f2(spread + c1)})`;
    t[`${name}-1`] = `translate(0 ${-spec.len[0]}) rotate(${f2(c2)})`;
    t[`${name}-2`] = `translate(0 ${-spec.len[1]}) rotate(${f2(c3 + tw)})`;
  }
  return t;
}

const INITIAL = transforms(STATIC_POSE, 0, null);

/** Colours, all from the site's tokens. */
const PALETTE = {
  "--rh-plate": "var(--text)",
  "--rh-shade": "color-mix(in oklab, var(--text) 70%, var(--muted))",
  "--rh-plate-2": "color-mix(in oklab, var(--text) 88%, var(--muted))",
  "--rh-line": "var(--bg)",
  "--rh-cuff": "var(--red)",
  "--rh-cuff-shade": "var(--red-deep)",
  "--rh-pad": "var(--maroon)",
} as CSSProperties;

/**
 * The outline every plate shares (2.5 screen px whatever the scale) and the thinner panel seams. Colours go in `style`,
 * because `var()` isn't reliable in SVG presentation attributes.
 */
const outline = (fill: string, width = 2.5) => ({
  style: { fill, stroke: "var(--rh-line)", strokeWidth: width, strokeLinejoin: "round" } as CSSProperties,
  vectorEffect: "non-scaling-stroke" as const,
});
const LINE_PLATE = outline("url(#rh-plate)");
const SEAM = outline("none", 1.5);

export function RobotHand({ ref, className }: { ref?: Ref<RobotHandHandle>; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const els = useRef<Record<string, SVGGElement>>({});
  const state = useRef({ progress: -1, changedAt: 0, jitter: null as Jitter | null, visible: false });

  const apply = () => {
    const s = state.current;
    const p = s.progress < 0 ? null : s.progress;
    const t = p === null ? INITIAL : transforms(poseAt(p), glowAt(p), s.jitter);
    for (const key in t) els.current[key]?.setAttribute("transform", t[key]);
  };

  useLayoutEffect(() => {
    const map: Record<string, SVGGElement> = {};
    svg.current?.querySelectorAll<SVGGElement>("[data-j]").forEach((el) => (map[el.dataset.j!] = el));
    els.current = map;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setPose(progress: number) {
        const s = state.current;
        s.progress = progress;
        s.changedAt = performance.now();
        apply();
        if (svg.current && svg.current.dataset.state !== "live") svg.current.dataset.state = "live";
      },
      reset() {
        state.current.progress = -1;
        state.current.jitter = null;
        apply();
        if (svg.current) svg.current.dataset.state = "static";
      },
    }),
    [],
  );

  // The idle servo twitch: only with motion, on screen, while posed by the scroll and the page has been still a moment.
  useEffect(() => {
    const el = svg.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([entry]) => (state.current.visible = entry.isIntersecting));
    io.observe(el);
    let timer = 0;
    let tl: gsap.core.Timeline | null = null;
    const schedule = () => {
      timer = window.setTimeout(twitch, JITTER.every + Math.random() * JITTER.spread);
    };
    const twitch = () => {
      const s = state.current;
      if (el.dataset.state === "live" && s.visible && !document.hidden && performance.now() - s.changedAt > JITTER.quietMs) {
        const sign = () => (Math.random() < 0.5 ? -1 : 1);
        const amp = JITTER.amp[0] + Math.random() * (JITTER.amp[1] - JITTER.amp[0]);
        const jitter: Jitter = {
          a: 0,
          signs: { index: sign(), middle: sign(), ring: sign(), little: sign(), thumb: sign() * 0.6 },
        };
        s.jitter = jitter;
        tl?.kill();
        // Stepped, like a servo settling: out, back past zero, home.
        tl = gsap
          .timeline({ onUpdate: apply, onComplete: () => void (s.jitter = null) })
          .to(jitter, { a: amp, duration: 0.08, ease: "steps(2)" })
          .to(jitter, { a: -amp * 0.5, duration: 0.1, ease: "steps(2)" })
          .to(jitter, { a: 0, duration: 0.14, ease: "steps(3)" });
      }
      schedule();
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      tl?.kill();
      io.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svg}
      data-robot-hand
      data-state="static"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      style={PALETTE}
      className={cn("block size-full motion-safe:data-[state=static]:invisible", className)}
    >
      <defs>
        {/* Cel shading: the plate's colour with a grey band down its +x side, in each shape's own frame. */}
        <linearGradient id="rh-plate" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--rh-plate)" }} />
          <stop offset="0.64" style={{ stopColor: "var(--rh-plate)" }} />
          <stop offset="0.64" style={{ stopColor: "var(--rh-shade)" }} />
          <stop offset="1" style={{ stopColor: "var(--rh-shade)" }} />
        </linearGradient>
        <linearGradient id="rh-arm" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--rh-plate-2)" }} />
          <stop offset="0.7" style={{ stopColor: "var(--rh-plate-2)" }} />
          <stop offset="0.7" style={{ stopColor: "var(--rh-shade)" }} />
          <stop offset="1" style={{ stopColor: "var(--rh-shade)" }} />
        </linearGradient>
        <linearGradient id="rh-cuff" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--rh-cuff)" }} />
          <stop offset="0.7" style={{ stopColor: "var(--rh-cuff)" }} />
          <stop offset="0.7" style={{ stopColor: "var(--rh-cuff-shade)" }} />
          <stop offset="1" style={{ stopColor: "var(--rh-cuff-shade)" }} />
        </linearGradient>
        <radialGradient id="rh-glow">
          <stop offset="0" style={{ stopColor: "var(--red)", stopOpacity: 0.9 }} />
          <stop offset="0.45" style={{ stopColor: "var(--red)", stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: "var(--red)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      <g data-j="root" transform={INITIAL.root}>
        {/* Forearm: a long plated tube that always runs off the card. */}
        <rect x={-80} y={96} width={160} height={1500} rx={34} {...outline("url(#rh-arm)")} />
        <rect x={-54} y={160} width={84} height={420} rx={28} {...SEAM} />
        <path d="M -80 620 H 80" {...SEAM} />

        {/* The wrist cuff, in segments. */}
        <rect x={-92} y={22} width={184} height={96} rx={24} {...outline("url(#rh-cuff)")} />
        <path d="M -92 54 H 92 M -92 86 H 92" {...SEAM} />

        {/* The wrist pivot. */}
        <circle r={54} {...LINE_PLATE} />
        <circle r={30} {...outline("var(--rh-plate-2)", 1.5)} />

        <g data-j="palm" transform={INITIAL.palm}>
          {/* The palm: a back plate and a knuckle plate. */}
          <path
            d="M -64 -16 C -82 -42 -92 -120 -94 -178 Q -95 -216 -60 -218 L 62 -224 Q 99 -225 99 -188 C 101 -132 104 -82 82 -36 Q 66 -8 30 -10 L -40 -10 Q -58 -9 -64 -16 Z"
            {...LINE_PLATE}
          />
          <path d="M -92 -150 C -40 -160 40 -164 100 -158" {...SEAM} />
          <rect x={-52} y={-128} width={92} height={86} rx={22} {...SEAM} />

          {FINGER_DRAW_ORDER.map((name) => (
            <Finger key={name} name={name} />
          ))}

          {/* The thumb, in front: base and tip. */}
          <g data-j="thumb-0" transform={INITIAL["thumb-0"]}>
            <Segment w={THUMB.w[0]} len={THUMB.len[0]} />
            <g data-j="thumb-1" transform={INITIAL["thumb-1"]}>
              <Segment w={THUMB.w[1]} len={THUMB.len[1]} tip />
              <Pin w={THUMB.w[1]} />
            </g>
            <Pin w={THUMB.w[0]} />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** One finger: three nested segments, each rotating about its own joint. The index tip carries the glow. */
function Finger({ name }: { name: FingerName }) {
  const { w, len } = FINGERS[name];
  return (
    <g data-j={`${name}-0`} transform={INITIAL[`${name}-0`]}>
      <Segment w={w} len={len[0]} />
      <g data-j={`${name}-1`} transform={INITIAL[`${name}-1`]}>
        <Segment w={w} len={len[1]} />
        <g data-j={`${name}-2`} transform={INITIAL[`${name}-2`]}>
          {name === "index" && (
            <g data-j="glow" transform={INITIAL.glow}>
              <circle r={w * 1.5} style={{ fill: "url(#rh-glow)" }} />
            </g>
          )}
          <Segment w={w} len={len[2]} tip />
          <Pin w={w} />
        </g>
        <Pin w={w} />
      </g>
      <Pin w={w} />
    </g>
  );
}

/**
 * A segment from its joint (0, 0) to the next one (0, −len): a capsule whose rounded ends are centred on the two
 * joints, so neighbours share the same round end at every angle and never open a gap. A tip gets its pad.
 */
function Segment({ w, len, tip = false }: { w: number; len: number; tip?: boolean }) {
  const r = w / 2;
  const h = r * 0.6;
  return (
    <>
      <rect x={-r} y={-len - r} width={w} height={len + w} rx={r} {...LINE_PLATE} />
      {tip && (
        <path
          d={`M ${-r} ${-len + h} L ${-r} ${-len} A ${r} ${r} 0 0 1 ${r} ${-len} L ${r} ${-len + h} Z`}
          {...outline("var(--rh-pad)")}
        />
      )}
    </>
  );
}

/** The pivot pin on a joint. */
function Pin({ w }: { w: number }) {
  return <circle r={w * 0.12} {...outline("var(--rh-plate-2)", 1.5)} />;
}

"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { useUIStore } from "@/lib/store";

/**
 * Senior Core's controller (DESIGN.md §13). Its children are the spreads
 * ([data-sc-spread]), rendered stacked; what it builds depends on the media:
 *
 * - md+ with motion: horizontal. The viewport gets data-mode="h" (CSS lays the
 *   spreads in a row), is pinned, and the track moves by
 *   -(scrollWidth - viewport width), scrubbed and snapped to each spread.
 *   Arrow keys, the spreads' prev/next arrows, dragging and horizontal wheel
 *   gestures all move the page scroll, so everything stays on one timeline.
 *   Reveals and blob drift inside each spread use containerAnimation.
 * - Phones with motion: stacked, with the same reveals on vertical triggers.
 * - Reduced motion: stacked, nothing animates; the arrows jump instantly.
 *
 * gsap.matchMedia() rebuilds this when the width or the motion setting changes.
 */

export const SENIOR_CORE_MOTION = {
  /** Seconds the track takes to catch up with the scroll. */
  scrub: 1,
  /** …and while dragging, so the track follows the pointer. */
  dragScrub: 0.12,
  /** Snap tween length (s). */
  snap: { min: 0.2, max: 0.6 },
  /** A spread reveals when its left edge reaches this point of the viewport (horizontal)… */
  revealAt: "left 62%",
  /** …or its top does (stacked). */
  revealAtStacked: "top 72%",
  /** Delay between letters (s). */
  letterStagger: 0.04,
  /** px a pointer must move before it counts as a drag; px/s that counts as a flick. */
  dragThreshold: 6,
  flick: 400,
  /** Blob drift: fraction of the viewport width (horizontal) or px (stacked) per unit of speed. */
  blobTravel: 0.14,
  blobTravelStacked: 70,
} as const;

type Dir = "prev" | "next";
interface Nav {
  /** Move to spread `index`; `dir` (from an arrow) moves focus to the same arrow on the target spread. */
  go: (index: number, dir?: Dir) => void;
}
const NavContext = createContext<Nav>({ go: () => {} });
export const useSeniorCoreNav = () => useContext(NavContext);

const M = SENIOR_CORE_MOTION;

export function SeniorCoreTrack({ labels, children }: { labels: string[]; children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  /** Scrolls to spread i (clamped) in the current mode and returns the index it went to. */
  const navigate = useRef<(i: number) => number>((i) => i);

  const announce = useCallback(
    (i: number) => {
      if (live.current) live.current.textContent = `${i + 1} of ${labels.length}: ${labels[i] ?? ""}`;
    },
    [labels],
  );

  const go = useCallback(
    (index: number, dir?: Dir) => {
      const i = navigate.current(index);
      announce(i);
      if (!dir) return;
      const spread = track.current?.children[i];
      const target =
        spread?.querySelector<HTMLElement>(`[data-sc-${dir}]:not(:disabled)`) ??
        spread?.querySelector<HTMLElement>("[data-sc-prev]:not(:disabled), [data-sc-next]:not(:disabled)");
      target?.focus({ preventScroll: true });
    },
    [announce],
  );

  useGSAP(
    () => {
      const vp = viewport.current;
      const tr = track.current;
      if (!vp || !tr) return;
      const spreads = Array.from(tr.children) as HTMLElement[];
      const N = spreads.length;
      const clampI = (i: number) => Math.max(0, Math.min(N - 1, i));
      const lenis = () => useUIStore.getState().lenis;

      const stackedNav = (i: number) => {
        const k = clampI(i);
        const y = spreads[k].getBoundingClientRect().top + window.scrollY;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const l = lenis();
        if (l && !reduce) l.scrollTo(y, { duration: DURATION.slow });
        else window.scrollTo({ top: y, behavior: reduce ? "instant" : "smooth" });
        return k;
      };
      navigate.current = stackedNav;

      const mm = gsap.matchMedia();
      mm.add(
        { desktop: "(min-width: 768px)", reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };
          if (reduce) return; // final states, stacked; arrows jump instantly
          if (!desktop) {
            spreads.forEach((spread, i) => {
              if (i > 0) reveal(spread, { trigger: spread, start: M.revealAtStacked, once: true });
              spread.querySelectorAll<HTMLElement>("[data-sc-blob]").forEach((blob) => {
                const s = Number(blob.dataset.scBlob) || 0;
                gsap.fromTo(
                  blob,
                  { y: s * M.blobTravelStacked },
                  {
                    y: -s * M.blobTravelStacked,
                    ease: "none",
                    scrollTrigger: { trigger: spread, start: "top bottom", end: "bottom top", scrub: true },
                  },
                );
              });
            });
            return;
          }
          return horizontal(vp, tr, spreads);
        },
      );

      function horizontal(vp: HTMLDivElement, tr: HTMLDivElement, spreads: HTMLElement[]) {
        vp.dataset.mode = "h";
        vp.dataset.cursor = "drag";

        const distance = () => Math.max(0, tr.scrollWidth - vp.clientWidth);
        const tween = gsap.to(tr, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: vp,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: M.scrub,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // No inertia: the arrows and drag jump the scroll instantly, which would read as a huge
            // flick and throw the snap several spreads ahead.
            snap: { snapTo: 1 / (N - 1), duration: M.snap, delay: 0.08, ease: "power2.inOut", inertia: false },
          },
        });
        const st = tween.scrollTrigger!;
        // Undocumented but public on the instance: changes the scrub smoothing at runtime.
        const scrubber = st as unknown as { scrubDuration?: (s: number) => void };

        const span = () => Math.max(1, st.end - st.start);
        const progressAt = () => ((window.scrollY - st.start) / span()) * (N - 1);
        const indexNow = () => clampI(Math.round(progressAt()));
        const inRange = () => window.scrollY >= st.start - 2 && window.scrollY <= st.end + 2;
        const jump = (y: number) => {
          const l = lenis();
          if (l) l.scrollTo(y, { immediate: true });
          else window.scrollTo(0, y);
        };
        // The scroll jumps; the scrub (1s, expo) is what animates the track.
        navigate.current = (i) => {
          const k = clampI(i);
          jump(st.start + (k / (N - 1)) * span());
          return k;
        };

        spreads.forEach((spread, i) => {
          if (i > 0) reveal(spread, { trigger: spread, containerAnimation: tween, start: M.revealAt, once: true });
          spread.querySelectorAll<HTMLElement>("[data-sc-blob]").forEach((blob) => {
            const s = Number(blob.dataset.scBlob) || 0;
            gsap.fromTo(
              blob,
              { x: () => s * M.blobTravel * vp.clientWidth },
              {
                x: () => -s * M.blobTravel * vp.clientWidth,
                ease: "none",
                scrollTrigger: {
                  trigger: spread,
                  containerAnimation: tween,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              },
            );
          });
        });

        /* Keyboard: ← / → while the section is pinned. */
        const onKey = (e: KeyboardEvent) => {
          if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
          const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!dir || !inRange() || useUIStore.getState().menuOpen) return;
          if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable='true']")) return;
          const from = indexNow();
          const to = clampI(from + dir);
          if (to === from) return;
          e.preventDefault();
          navigate.current(to);
          announce(to);
        };

        /* Focus (Tab) landing on another spread brings that spread in. */
        const onFocus = (e: FocusEvent) => {
          const k = spreads.indexOf((e.target as Element).closest?.("[data-sc-spread]") as HTMLElement);
          if (k >= 0 && k !== indexNow()) navigate.current(k);
        };

        /* Drag (mouse, pen, touch): horizontal pointer movement scrolls the page 1:1. */
        let drag: { id: number; x: number; y: number; from: number; moved: boolean; lastX: number; lastT: number; v: number } | null =
          null;
        let suppressClick = false;
        const onDown = (e: PointerEvent) => {
          if (e.button !== 0 || !inRange() || useUIStore.getState().menuOpen) return;
          if ((e.target as Element).closest("input, textarea, select")) return;
          drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: window.scrollY, moved: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
        };
        const onMove = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          const dx = e.clientX - drag.x;
          if (!drag.moved) {
            if (Math.abs(dx) < M.dragThreshold) return;
            if (Math.abs(e.clientY - drag.y) > Math.abs(dx)) {
              drag = null; // a vertical gesture: leave it to the page
              return;
            }
            drag.moved = true;
            vp.setPointerCapture(e.pointerId);
            vp.dataset.dragging = "";
            window.getSelection()?.removeAllRanges();
            scrubber.scrubDuration?.(M.dragScrub);
          }
          drag.v = ((e.clientX - drag.lastX) / Math.max(1, e.timeStamp - drag.lastT)) * 1000;
          drag.lastX = e.clientX;
          drag.lastT = e.timeStamp;
          jump(Math.max(st.start, Math.min(st.end, drag.from - dx)));
        };
        const onUp = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          const d = drag;
          drag = null;
          if (!d.moved) return;
          delete vp.dataset.dragging;
          if (vp.hasPointerCapture(e.pointerId)) vp.releasePointerCapture(e.pointerId);
          scrubber.scrubDuration?.(M.scrub);
          if (e.type === "pointerup") {
            suppressClick = true; // the click that follows this pointerup must not follow a link
            window.setTimeout(() => (suppressClick = false), 0);
          }
          const p = progressAt();
          let k = Math.round(p);
          if (Math.abs(d.v) > M.flick) k = d.v < 0 ? Math.ceil(p) : Math.floor(p);
          k = navigate.current(k);
          announce(k);
        };
        const onClick = (e: MouseEvent) => {
          if (!suppressClick) return;
          e.preventDefault();
          e.stopPropagation();
          suppressClick = false;
        };
        const onDragStart = (e: DragEvent) => e.preventDefault();

        /* Trackpads: a sideways swipe moves the track too (Lenis only reads vertical wheel deltas). */
        const onWheel = (e: WheelEvent) => {
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || !inRange()) return;
          e.preventDefault();
          e.stopPropagation();
          const l = lenis();
          const y = Math.max(st.start, Math.min(st.end, (l ? l.targetScroll : window.scrollY) + e.deltaX));
          if (l) l.scrollTo(y);
          else window.scrollTo(0, y);
        };

        window.addEventListener("keydown", onKey);
        vp.addEventListener("focusin", onFocus);
        vp.addEventListener("pointerdown", onDown);
        vp.addEventListener("pointermove", onMove);
        vp.addEventListener("pointerup", onUp);
        vp.addEventListener("pointercancel", onUp);
        vp.addEventListener("click", onClick, true);
        vp.addEventListener("dragstart", onDragStart);
        vp.addEventListener("wheel", onWheel, { passive: false });

        return () => {
          window.removeEventListener("keydown", onKey);
          vp.removeEventListener("focusin", onFocus);
          vp.removeEventListener("pointerdown", onDown);
          vp.removeEventListener("pointermove", onMove);
          vp.removeEventListener("pointerup", onUp);
          vp.removeEventListener("pointercancel", onUp);
          vp.removeEventListener("click", onClick, true);
          vp.removeEventListener("dragstart", onDragStart);
          vp.removeEventListener("wheel", onWheel);
          delete vp.dataset.mode;
          delete vp.dataset.cursor;
          delete vp.dataset.dragging;
          navigate.current = stackedNav;
        };
      }

      // Re-measure once everything above has its final size (fonts, images).
      ScrollTrigger.refresh();

      return () => {
        mm.revert();
        navigate.current = (i) => i;
      };
    },
    { scope: viewport },
  );

  const nav = useMemo(() => ({ go }), [go]);

  return (
    <NavContext.Provider value={nav}>
      <div
        ref={viewport}
        className="group/sc relative data-dragging:select-none data-[mode=h]:h-svh data-[mode=h]:touch-pan-y data-[mode=h]:overflow-clip"
      >
        <div ref={track} className="flex flex-col group-data-[mode=h]/sc:flex-row group-data-[mode=h]/sc:will-change-transform">
          {children}
        </div>
      </div>
      <p ref={live} className="sr-only" aria-live="polite" />
    </NavContext.Provider>
  );
}

/**
 * One spread's entrance: letters rise out of their masks, portraits wipe up
 * (clip-path), text fades up and the counter rolls. Plays once.
 */
function reveal(spread: HTMLElement, trigger: ScrollTrigger.Vars) {
  const tl = gsap.timeline({ scrollTrigger: trigger });
  const rises = Array.from(spread.querySelectorAll<HTMLElement>("[data-sc-rise]"));
  const ys = rises.filter((el) => el.dataset.scRise !== "x");
  const xs = rises.filter((el) => el.dataset.scRise === "x");
  if (ys.length) tl.from(ys, { yPercent: 110, duration: DURATION.slow, ease: EASE.expo, stagger: M.letterStagger }, 0);
  if (xs.length) tl.from(xs, { xPercent: -110, duration: DURATION.slow, ease: EASE.expo, stagger: M.letterStagger }, 0);

  const portraits = spread.querySelectorAll("[data-sc-portrait]");
  if (portraits.length) {
    tl.fromTo(
      portraits,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: DURATION.slow, ease: EASE.expo, stagger: STAGGER },
      0.1,
    );
  }
  const fades = spread.querySelectorAll("[data-sc-fade]");
  if (fades.length) tl.from(fades, { y: 24, opacity: 0, duration: DURATION.base, ease: EASE.out, stagger: STAGGER }, 0.3);

  spread.querySelectorAll<HTMLElement>("[data-sc-odo]").forEach((col, k) => {
    tl.fromTo(
      col,
      { y: 0, yPercent: -Number(col.dataset.from) * 5 },
      { y: 0, yPercent: -Number(col.dataset.to) * 5, duration: DURATION.slow, ease: EASE.expo },
      0.2 + k * STAGGER,
    );
  });
  return tl;
}

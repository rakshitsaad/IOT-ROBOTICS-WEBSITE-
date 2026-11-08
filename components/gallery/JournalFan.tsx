"use client";

import type { MotionValue } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import type { JournalPage } from "@/lib/gallery";
import { JournalIcon } from "./icons";
import { JournalPageContent } from "./JournalPages";
import { FAN, clamp, fanStyle, rubberBand } from "./fan";

/**
 * The journal's 3D fan (DESIGN.md §14). Pages sit in a stage with an 1800px
 * perspective; each one's transform comes from `pos` (fan.ts), written straight
 * to the DOM on every change, never through React state. React only re-renders
 * when the rounded page (`active`) changes, to move the render window
 * (FAN.window pages each side) and the loading hints.
 *
 * Navigation here: drag or swipe with inertia (a flick carries several pages),
 * trackpad sideways scroll (follows the fingers, then settles), the mouse wheel
 * (a page per notch; past the first or last page it scrolls the page on), and
 * clicking a side page. Arrow keys and the scrubber live in the viewer.
 */

export interface FanNav {
  /** Spring to a page (instant under reduced motion). */
  go(index: number, velocity?: number): void;
  /** Stop the spring where it is. */
  stop(): void;
  /** The page the position is heading to. */
  target: { current: number };
}

interface JournalFanProps {
  pages: JournalPage[];
  pos: MotionValue<number>;
  active: number;
  /** Pages shown each side (7 desktop, 3 phones). */
  side: number;
  /** Reduced motion: a flat slider. */
  flat: boolean;
  /** Videos may play (journal view, no lightbox, motion allowed). */
  autoplay: boolean;
  muted: boolean;
  onToggleSound(): void;
  /** The event's start (note pages show it). */
  date: string;
  /** The page the viewer opened on (its image is preloaded). */
  initial: number;
  nav: FanNav;
  /** The centre page was clicked: open the lightbox at this item. */
  onOpen(page: number, itemId: string): void;
  label: string;
}

/** A drag starts after this much horizontal movement (px). */
const DRAG_START = 6;

export function JournalFan({
  pages,
  pos,
  active,
  side,
  flat,
  autoplay,
  muted,
  onToggleSound,
  date,
  initial,
  nav,
  onOpen,
  label,
}: JournalFanProps) {
  const stage = useRef<HTMLDivElement>(null);
  const wrappers = useRef(new Map<number, HTMLDivElement>());
  const soundBox = useRef<HTMLDivElement>(null);
  const last = pages.length - 1;

  /* ---------------------------------------------------------------- frame */

  const apply = useCallback(() => {
    const p = pos.get();
    const v = flat ? 0 : pos.getVelocity();
    wrappers.current.forEach((wrap, i) => {
      const page = wrap.firstElementChild as HTMLElement | null;
      if (!page) return;
      const d = i - p;
      const s = fanStyle(d, side, flat);
      page.style.transform = s.transform;
      wrap.style.opacity = s.opacity.toFixed(3);
      wrap.style.zIndex = String(s.zIndex);
      wrap.style.visibility = s.opacity < 0.005 ? "hidden" : "";

      // The page curl: a light-to-dark band on the centre page's leading edge,
      // stronger the faster it moves and the further it has turned.
      const a = Math.abs(d);
      if (flat || a > 1.5) return;
      const strength = a < 1 ? clamp(Math.abs(v) / 7 + a * 1.4, 0, 1) * (1 - a) : 0;
      const forward = Math.abs(v) > 0.05 ? v > 0 : d < 0; // moving forward: pages travel left
      const left = page.querySelector<HTMLElement>("[data-curl='l']");
      const right = page.querySelector<HTMLElement>("[data-curl='r']");
      if (left) left.style.opacity = forward ? strength.toFixed(3) : "0";
      if (right) right.style.opacity = forward ? "0" : strength.toFixed(3);
    });
    if (soundBox.current) {
      soundBox.current.style.opacity = clamp(1 - Math.abs(active - p) * 4, 0, 1).toFixed(3);
    }
  }, [pos, side, flat, active]);

  // New pages need their transform before paint; then every change of `pos`.
  useLayoutEffect(() => apply());
  useEffect(() => pos.on("change", apply), [pos, apply]);

  /* ----------------------------------------------------------------- drag */

  const drag = useRef<{ id: number; x: number; y: number; start: number; step: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  /** px of drag per page: the first side page's offset (52% of a page width). */
  const pageStep = useCallback(() => {
    const page = stage.current?.querySelector<HTMLElement>("[data-fan-page]");
    const w = page?.offsetWidth ?? 400;
    return Math.max(110, (w * (flat ? FAN.flatGap * 100 : FAN.firstX)) / 100);
  }, [flat]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    suppressClick.current = false;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, start: pos.get(), step: pageStep(), moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.moved) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // a vertical swipe: the page scrolls instead
        return;
      }
      if (Math.abs(dx) < DRAG_START) return;
      g.moved = true;
      suppressClick.current = true;
      nav.stop();
      g.start = pos.get();
      g.x = e.clientX;
      stage.current?.setPointerCapture(e.pointerId);
      stage.current?.setAttribute("data-dragging", "");
      return;
    }
    pos.set(rubberBand(g.start - dx / g.step, last));
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    drag.current = null;
    if (!g.moved) return;
    stage.current?.removeAttribute("data-dragging");
    const v = pos.getVelocity(); // pages per second; 0 if the pointer was held still
    nav.go(Math.round(pos.get() + v * FAN.flickCarry), v);
  };

  /* ---------------------------------------------------------------- wheel */

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let settle = 0;
    let raw: number | null = null; // sideways scroll position before the rubber band
    let acc = 0;
    let lastStep = 0;
    let holdEnd = 0;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // trackpad pinch: the browser's zoom
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? el.clientHeight : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;

      // Sideways (trackpad): follow the fingers, settle on the nearest page.
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        nav.stop();
        raw = (raw ?? pos.get()) + dx / pageStep();
        pos.set(rubberBand(raw, last));
        window.clearTimeout(settle);
        settle = window.setTimeout(() => {
          raw = null;
          nav.go(Math.round(pos.get()), pos.getVelocity());
        }, 140);
        return;
      }

      // Up and down (mouse wheel, trackpad): one page per notch.
      if (dy === 0) return;
      const dir = Math.sign(dy);
      const now = performance.now();
      const target = nav.target.current;
      const atEnd = (dir > 0 && target >= last) || (dir < 0 && target <= 0);
      if (atEnd && now > holdEnd) return; // past the ends the page scrolls on
      e.preventDefault();
      if (atEnd) return;
      if (Math.sign(acc) !== dir) acc = 0;
      acc += dy;
      if (Math.abs(acc) >= 40 && now - lastStep > 120) {
        acc = 0;
        lastStep = now;
        nav.go(target + dir);
        // Reaching an end holds the wheel briefly, so a long swipe doesn't run into a page scroll.
        if (target + dir <= 0 || target + dir >= last) holdEnd = now + 600;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
    };
  }, [pos, nav, last, pageStep]);

  /* ---------------------------------------------------------------- click */

  const onPageClick = (i: number, e: MouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return; // the end of a drag, not a click
    }
    if (i !== active || Math.abs(pos.get() - i) > 0.5) {
      nav.go(i);
      return;
    }
    const id = (e.target as Element).closest<HTMLElement>("[data-flip-id]")?.dataset.flipId ?? pages[i].items[0].id;
    onOpen(i, id);
  };

  /* --------------------------------------------------------------- render */

  const lo = Math.max(0, active - FAN.window);
  const hi = Math.min(last, active + FAN.window);
  const range: number[] = [];
  for (let i = lo; i <= hi; i++) range.push(i);
  const p0 = pos.get();
  const centrePage = pages[active];

  return (
    <div
      ref={stage}
      role="region"
      aria-roledescription="journal"
      aria-label={label}
      data-fan-stage
      data-cursor="drag"
      data-lenis-prevent-wheel
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        // isolate: the pages' z-indexes (up to 2000) stay inside the stage, under the header and the lightbox.
        "relative isolate min-h-0 flex-1 touch-pan-y overflow-clip select-none [container-type:size]",
        // Page width: as tall as fits, capped at 76% of the width on phones, 46% on tablets, 34% from lg.
        "[--page-w:min(calc(84cqh*0.8),76cqw)] md:[--page-w:min(calc(86cqh*0.8),46cqw)] lg:[--page-w:min(calc(86cqh*0.8),34cqw)]",
      )}
    >
      {range.map((i) => {
        const page = pages[i];
        const centre = i === active;
        const dist = Math.abs(i - active);
        const s0 = fanStyle(i - p0, side, flat);
        return (
          <div
            key={page.key}
            ref={(el) => {
              if (el) wrappers.current.set(i, el);
              else wrappers.current.delete(i);
            }}
            data-fan-wrapper={i}
            style={{ zIndex: s0.zIndex, opacity: s0.opacity, perspective: `${FAN.perspective}px` }}
            className="pointer-events-none absolute inset-0"
          >
            <button
              type="button"
              data-fan-page={i}
              data-flip-id={page.kind === "collage" ? undefined : page.items[0].id}
              data-cursor={centre ? (page.kind === "note" ? "drag" : "view") : "drag"}
              data-cursor-label={centre && page.kind === "video" ? "Play" : undefined}
              tabIndex={centre ? 0 : -1}
              aria-hidden={centre ? undefined : true}
              aria-label={centre ? pageLabel(page) : `Go to page ${i + 1}`}
              onClick={(e) => onPageClick(i, e)}
              style={{ transform: s0.transform }}
              className={cn(
                "paper pointer-events-auto absolute top-1/2 left-1/2 aspect-[4/5] w-(--page-w) rounded-image p-[6px] @container",
                "-mt-[calc(var(--page-w)*0.625)] -ml-[calc(var(--page-w)/2)]",
                "shadow-[0_28px_60px_-24px] shadow-black/70 will-change-transform",
                "focus-visible:outline-offset-6",
              )}
            >
              <JournalPageContent
                page={page}
                eager={dist <= 2}
                preload={i === initial}
                loadVideo={dist <= 1}
                playing={autoplay && centre}
                muted={muted}
                date={date}
              />
              {!flat && (
                <>
                  <span
                    data-curl="l"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-[26%] rounded-l-image bg-linear-to-r from-white/50 via-black/30 via-30% to-transparent opacity-0"
                  />
                  <span
                    data-curl="r"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-[26%] rounded-r-image bg-linear-to-l from-white/50 via-black/30 via-30% to-transparent opacity-0"
                  />
                </>
              )}
            </button>
          </div>
        );
      })}

      {/* The centre video's sound toggle: over the page, outside its button. */}
      {autoplay && centrePage?.kind === "video" && (
        <div
          ref={soundBox}
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 z-[2000] aspect-[4/5] w-(--page-w)",
            "-mt-[calc(var(--page-w)*0.625)] -ml-[calc(var(--page-w)/2)]",
          )}
        >
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={!muted}
            aria-label={muted ? "Turn the sound on" : "Turn the sound off"}
            data-cursor="link"
            className={cn(
              "pointer-events-auto absolute right-5 bottom-5 grid size-10 place-items-center rounded-full",
              "bg-bg/70 text-text backdrop-blur-md transition-[background-color,transform] duration-[350ms] ease-power3",
              "hover:bg-bg/90 active:scale-95",
            )}
          >
            <JournalIcon name={muted ? "sound-off" : "sound-on"} className="size-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}

function pageLabel(page: JournalPage): string {
  const first = page.items[0];
  switch (page.kind) {
    case "photo":
      return `Open photo: ${first.alt}`;
    case "video":
      return `Play video: ${first.alt}`;
    case "collage":
      return `Open collage of ${page.items.length} photos: ${first.alt}`;
    case "note":
      return `Note: ${first.caption ?? ""}`;
  }
}

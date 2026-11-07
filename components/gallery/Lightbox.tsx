"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type Ref } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/gallery";
import { BEZIER, DURATION } from "@/lib/motion";
import { useUIStore } from "@/lib/store";
import type { GalleryItem } from "@/lib/types";
import { clamp } from "./fan";
import { JournalIcon } from "./icons";

/**
 * The journal lightbox (DESIGN.md §14): one photo or video full screen, with
 * prev/next, the caption, download and close.
 *
 * - Zoom (photos): the wheel or a trackpad pinch zooms around the pointer, a
 *   two-finger pinch on touch, double click toggles 2.5×, and the +/− buttons
 *   and keys. Zoomed in, dragging pans; at 1×, a sideways swipe changes photo.
 * - Keys: ← → change item, Esc closes, + − zoom.
 * - It is portalled to <body> above the header (below the custom cursor), makes
 *   the page behind inert, stops Lenis and locks the scroll, focuses Close, and
 *   gives focus back to what opened it.
 * - Reduced motion: no fades and zoom jumps instead of easing.
 */

const MAX_ZOOM = 5;

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  onIndex(index: number): void;
  onClose(): void;
  onDownload(item: GalleryItem): void;
  title: string;
  reduced: boolean;
}

/** Only ever mounted after a click (never in the server HTML), so `document` is there. */
export function Lightbox(props: LightboxProps) {
  return createPortal(<LightboxPanel {...props} />, document.body);
}

function LightboxPanel({ items, index, onIndex, onClose, onDownload, title, reduced }: LightboxProps) {
  const lenis = useUIStore((s) => s.lenis);
  const item = items[index];
  const count = items.length;
  const closeButton = useRef<HTMLButtonElement>(null);

  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const view = useRef({ s: 1, x: 0, y: 0 });
  const [zoomed, setZoomed] = useState(false);

  const prev = useCallback(() => onIndex((index - 1 + count) % count), [index, count, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % count), [index, count, onIndex]);

  /* Page behind: inert, no scroll; focus in, and back out on close. */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const behind = [document.getElementById("main"), document.getElementById("site-footer"), document.querySelector("header")].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    behind.forEach((el) => (el.inert = true));
    lenis?.stop();
    html.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      behind.forEach((el) => (el.inert = false));
      lenis?.start();
      html.style.overflow = prevOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [lenis]);

  /* Zoom and pan. */
  const write = useCallback(
    (ease = false) => {
      const el = layer.current;
      if (!el) return;
      const { s, x, y } = view.current;
      el.style.transition = ease && !reduced ? "transform 350ms var(--ease-power3)" : "none";
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
      setZoomed(s > 1.01);
    },
    [reduced],
  );

  const bound = useCallback(() => {
    const r = frame.current?.getBoundingClientRect();
    const v = view.current;
    if (!r) return;
    const mx = (r.width * (v.s - 1)) / 2;
    const my = (r.height * (v.s - 1)) / 2;
    v.x = clamp(v.x, -mx, mx);
    v.y = clamp(v.y, -my, my);
  }, []);

  /** Zooms to `scale`, keeping the point under (clientX, clientY) where it is. */
  const zoomAt = useCallback(
    (clientX: number, clientY: number, scale: number, ease = false) => {
      const r = frame.current?.getBoundingClientRect();
      if (!r) return;
      const v = view.current;
      const ns = clamp(scale, 1, MAX_ZOOM);
      const cx = clientX - (r.left + r.width / 2);
      const cy = clientY - (r.top + r.height / 2);
      v.x = cx - (cx - v.x) * (ns / v.s);
      v.y = cy - (cy - v.y) * (ns / v.s);
      v.s = ns;
      if (ns === 1) {
        v.x = 0;
        v.y = 0;
      }
      bound();
      write(ease);
    },
    [bound, write],
  );

  const zoomCentre = useCallback(
    (factor: number) => {
      const r = frame.current?.getBoundingClientRect();
      if (r) zoomAt(r.left + r.width / 2, r.top + r.height / 2, view.current.s * factor, true);
    },
    [zoomAt],
  );

  // A new item starts at 1×.
  useLayoutEffect(() => {
    view.current = { s: 1, x: 0, y: 0 };
    write();
  }, [index, write]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (item.type !== "photo") return;
      e.preventDefault();
      const k = e.ctrlKey ? 0.012 : 0.0022; // trackpad pinch arrives as ctrl + wheel
      zoomAt(e.clientX, e.clientY, view.current.s * Math.exp(-e.deltaY * k));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [item.type, zoomAt]);

  /* Keys. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if ((e.key === "+" || e.key === "=") && item.type === "photo") {
        zoomCentre(1.6);
      } else if (e.key === "-" && item.type === "photo") {
        zoomCentre(1 / 1.6);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, zoomCentre, item.type]);

  /* Pointers: pinch, pan when zoomed, swipe at 1×. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: "pinch"; dist: number; s: number }
    | { kind: "pan"; x: number; y: number; vx: number; vy: number }
    | { kind: "swipe"; x: number; y: number }
    | null
  >(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as Element).closest("video")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && item.type === "photo") {
      gesture.current = { kind: "pinch", dist: distance(pts[0], pts[1]), s: view.current.s };
    } else if (pts.length === 1) {
      gesture.current =
        view.current.s > 1.01
          ? { kind: "pan", x: e.clientX, y: e.clientY, vx: view.current.x, vy: view.current.y }
          : { kind: "swipe", x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      zoomAt(mid.x, mid.y, (g.s * distance(pts[0], pts[1])) / g.dist);
    } else if (g.kind === "pan") {
      view.current.x = g.vx + e.clientX - g.x;
      view.current.y = g.vy + e.clientY - g.y;
      bound();
      write();
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    gesture.current = null;
    if (g?.kind === "swipe") {
      const dx = e.clientX - g.x;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - g.y)) {
        if (dx < 0) next();
        else prev();
      }
    }
  };

  const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (item.type !== "photo") return;
    if (view.current.s > 1.01) zoomAt(e.clientX, e.clientY, 1, true);
    else zoomAt(e.clientX, e.clientY, 2.5, true);
  };

  const fade = reduced ? { duration: 0 } : { duration: DURATION.fast, ease: BEZIER.out };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photo ${index + 1} of ${count}`}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
      className="fixed inset-0 z-[90] flex flex-col bg-bg/95 backdrop-blur-xl"
    >
      {/* Top: counter and title, zoom, download, close. */}
      <div className="flex items-center justify-between gap-3 px-gutter py-4">
        <p className="mono-label min-w-0 truncate text-muted">
          <span className="text-text">{pad2(index + 1)}</span> / {pad2(count)}
          <span className="hidden sm:inline"> · {title}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {item.type === "photo" && (
            <>
              <RoundButton label="Zoom out" icon="zoom-out" onClick={() => zoomCentre(1 / 1.6)} disabled={!zoomed} />
              <RoundButton label="Zoom in" icon="zoom-in" onClick={() => zoomCentre(1.6)} />
            </>
          )}
          <RoundButton label="Download" icon="download" onClick={() => onDownload(item)} />
          <RoundButton ref={closeButton} label="Close" icon="close" onClick={onClose} light />
        </div>
      </div>

      {/* The item. */}
      <div
        ref={frame}
        data-lenis-prevent
        data-cursor={zoomed ? "drag" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        className="relative min-h-0 flex-1 touch-none overflow-hidden select-none"
      >
        {/* Keyed, so each item fades in; no exit fade, so the zoom layer ref stays on the shown item. */}
        <motion.div
            key={item.id}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={fade}
            className="absolute inset-0"
          >
            <div ref={layer} className="absolute inset-3 will-change-transform md:inset-x-24 md:inset-y-2">
              {item.type === "video" ? (
                <video
                  src={item.url ?? undefined}
                  poster={item.poster_url ?? undefined}
                  aria-label={item.alt}
                  controls
                  autoPlay={!reduced}
                  playsInline
                  className="size-full object-contain"
                />
              ) : (
                <Image
                  src={item.url!}
                  alt={item.alt}
                  fill
                  sizes="100vw"
                  draggable={false}
                  className="object-contain"
                />
              )}
            </div>
          </motion.div>

        {count > 1 && (
          <>
            <RoundButton
              label="Previous"
              icon="prev"
              onClick={prev}
              className="absolute top-1/2 left-(--gutter) hidden -translate-y-1/2 md:grid"
            />
            <RoundButton
              label="Next"
              icon="next"
              onClick={next}
              className="absolute top-1/2 right-(--gutter) hidden -translate-y-1/2 md:grid"
            />
          </>
        )}
      </div>

      {/* Bottom: caption, and prev/next on phones. */}
      <div className="flex min-h-20 items-center justify-between gap-4 px-gutter py-4">
        <RoundButton label="Previous" icon="prev" onClick={prev} className="md:hidden" />
        <p className="flex-1 text-center font-hand text-2xl leading-tight text-text md:text-3xl" aria-live="polite">
          {item.caption ?? <span className="sr-only">{item.alt}</span>}
        </p>
        <RoundButton label="Next" icon="next" onClick={next} className="md:hidden" />
      </div>
    </motion.div>
  );
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function RoundButton({
  label,
  icon,
  onClick,
  className,
  light = false,
  disabled = false,
  ref,
}: {
  label: string;
  icon: Parameters<typeof JournalIcon>[0]["name"];
  onClick(): void;
  className?: string;
  light?: boolean;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      data-cursor="link"
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full transition-[background-color,opacity,transform] duration-[350ms] ease-power3 active:scale-95",
        light ? "bg-text text-bg hover:bg-white" : "border border-line bg-bg-2/80 text-text hover:bg-text/10",
        "disabled:pointer-events-none disabled:opacity-35",
        className,
      )}
    >
      <JournalIcon name={icon} />
    </button>
  );
}

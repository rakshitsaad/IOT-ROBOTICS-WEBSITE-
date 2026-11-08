"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef, type PointerEvent } from "react";
import { clamp } from "./fan";

/**
 * The thin scrubber under the fan (DESIGN.md §14): a hairline track whose fill
 * follows the position every frame, a dot at the current page, and "12 / 40".
 * Click or drag along it to jump; it's a slider for assistive tech (the arrow
 * keys that move it are the viewer's, which work anywhere on the page).
 */
export function JournalScrubber({
  count,
  pos,
  active,
  onGo,
}: {
  count: number;
  pos: MotionValue<number>;
  active: number;
  onGo(index: number): void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const update = (p: number) => {
      const t = count > 1 ? clamp(p / (count - 1), 0, 1) : 1;
      if (fill.current) fill.current.style.transform = `scaleX(${t.toFixed(4)})`;
      if (dot.current) dot.current.style.left = `${(t * 100).toFixed(3)}%`;
    };
    update(pos.get());
    return pos.on("change", update);
  }, [pos, count]);

  const pick = (clientX: number) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || count < 2) return;
    onGo(Math.round(clamp((clientX - rect.left) / rect.width, 0, 1) * (count - 1)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    pick(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) pick(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div className="shell flex items-center justify-center gap-4 md:gap-5">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Page"
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={active + 1}
        aria-valuetext={`Page ${active + 1} of ${count}`}
        data-cursor="link"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="group/scrub relative h-8 w-full max-w-[520px] cursor-pointer touch-none rounded-pill focus-visible:outline-offset-2"
      >
        <div ref={track} className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-text/15">
          <span ref={fill} className="absolute inset-0 origin-left scale-x-0 bg-text/70" />
          <span
            ref={dot}
            className="absolute top-1/2 size-2 -translate-1/2 rounded-full bg-text transition-[width,height] duration-[350ms] ease-power3 group-hover/scrub:size-2.5"
          />
        </div>
      </div>
      <p className="mono-label shrink-0 text-muted tabular-nums" aria-hidden="true">
        <span className="text-text">{active + 1}</span> / {count}
      </p>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { pad2 } from "@/lib/gallery";
import { gsap } from "@/lib/gsap";
import type { StripTile } from "@/lib/projects";

/**
 * State 3 on md and up (DESIGN.md §16): one tile enlarged in the middle of
 * the stage (max 80% of its height and width, below the top label), flown there from the tile with
 * a FLIP (0.9s expo.out) and back to it on close. The stage dims and blurs
 * the other tiles and turns its top label into "CLOSE IMAGE".
 *
 * ← → (buttons and keys, handled by the stage) step through the photos with a
 * short crossfade; Esc, the label or a click outside the photo closes.
 */

export function ImageView({
  tiles,
  index,
  open,
  tileRect,
  onIndex,
  onRequestClose,
  onExited,
}: {
  tiles: StripTile[];
  index: number;
  /** false: fly back to the tile, then onExited. */
  open: boolean;
  /** The tile's current box in stage px, or null when it is off screen. */
  tileRect(index: number): DOMRect | null;
  onIndex(index: number): void;
  onRequestClose(): void;
  onExited(): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const tile = tiles[index];
  const aspect = tile.image.width / tile.image.height;
  const count = tiles.length;

  /** The FLIP transform that puts the box over the tile. */
  const fromTile = (i: number) => {
    const el = box.current;
    const wrap = el?.parentElement?.getBoundingClientRect();
    const stage = root.current?.getBoundingClientRect();
    const r = tileRect(i);
    if (!el || !wrap || !stage || !r) return null;
    // The wrapper is never tweened, so its box is the photo's resting place (stage px, like r).
    return {
      x: r.left + r.width / 2 - (wrap.left - stage.left + wrap.width / 2),
      y: r.top + r.height / 2 - (wrap.top - stage.top + wrap.height / 2),
      scale: r.width / el.offsetWidth,
    };
  };

  // Open: fly in from the tile. Step: crossfade.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !open) return;
    if (first.current) {
      first.current = false;
      const from = fromTile(index);
      if (from) gsap.fromTo(el, from, { x: 0, y: 0, scale: 1, duration: 0.9, ease: "expo.out" });
      else gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    } else {
      gsap.fromTo(el, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" });
    }
    // fromTile reads refs and the latest tileRect; the effect is about index/open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, open]);

  // Close: back to the tile (or fade if it is off screen).
  useEffect(() => {
    const el = box.current;
    if (!el || open) return;
    gsap.killTweensOf(el);
    const to = fromTile(index);
    const tween = to
      ? gsap.to(el, { ...to, duration: 0.7, ease: "expo.out", onComplete: onExited })
      : gsap.to(el, { opacity: 0, duration: 0.35, onComplete: onExited });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      ref={root}
      // The photo is centred in the band between the top label and the counter: at most 80% of the
      // stage's height and width, and never under the label or the header.
      className="absolute inset-0 z-40 [--view-band:calc(100cqh-var(--view-top)-var(--view-bottom))] [--view-bottom:4rem] [--view-mid:calc(var(--view-top)+var(--view-band)/2)] [--view-top:calc(var(--nav-h)+var(--ann-h)+4rem)]"
      data-cursor="view"
      data-cursor-label="CLOSE"
      onClick={(e) => {
        if (e.target === e.currentTarget && open) onRequestClose();
      }}
    >
      {/* The CSS centring sits on a wrapper; GSAP moves the inner box (§7: it would fold a CSS translate into its own). */}
      <div
        className="pointer-events-none absolute top-(--view-mid) left-1/2 h-(--view-h) [--view-h:min(80cqh,var(--view-band),calc(80cqw/var(--aspect)))] w-[calc(var(--view-h)*var(--aspect))] -translate-1/2"
        style={{ "--aspect": aspect.toFixed(4) } as CSSProperties}
      >
        <div
          ref={box}
          data-cursor="default"
          className="pointer-events-auto relative size-full overflow-hidden rounded-image bg-bg-2 shadow-[0_40px_120px_-30px] shadow-black"
        >
          <Image
            key={tile.key}
            src={tile.image.url}
            alt={tile.image.alt}
            fill
            sizes="80vw"
            draggable={false}
            className="object-cover"
          />
        </div>
      </div>

      {count > 1 && (
        <>
          <StepButton dir={-1} label="Previous photo" onClick={() => onIndex((index - 1 + count) % count)} />
          <StepButton dir={1} label="Next photo" onClick={() => onIndex((index + 1) % count)} />
        </>
      )}

      <p className="mono-label absolute bottom-6 left-1/2 -translate-x-1/2 text-muted" aria-live="polite">
        <span className="text-text">{pad2(index + 1)}</span> / {pad2(count)}
        <span className="sr-only">: {tile.image.alt}</span>
      </p>
    </div>
  );
}

function StepButton({ dir, label, onClick }: { dir: 1 | -1; label: string; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-cursor="link"
      className={`absolute top-(--view-mid) grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/60 text-text backdrop-blur-md transition-colors duration-[350ms] ease-power3 hover:border-text/40 hover:bg-text/10 ${
        dir < 0 ? "left-(--gutter)" : "right-(--gutter)"
      }`}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {dir < 0 ? "←" : "→"}
      </span>
    </button>
  );
}

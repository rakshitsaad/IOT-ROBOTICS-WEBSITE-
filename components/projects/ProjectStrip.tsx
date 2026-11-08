"use client";

import Image from "next/image";
import type { CSSProperties, RefObject } from "react";
import { cn } from "@/lib/cn";
import type { StripTile } from "@/lib/projects";

/**
 * The gallery strip (State 2, md and up; DESIGN.md §16): flat tiles of three
 * sizes at different heights, laid out by buildStrip() in container units
 * (cqh), so the server HTML is already in place.
 *
 * Each tile has three layers:
 *   outer   absolute position; the stage's ticker sets its translateX every
 *           frame (scroll × the tile's speed: smaller tiles lag, for depth)
 *   middle  the entrance, driven by the stage's --p (tiles fade and slide in
 *           during the second half of the transition; the cover only shows
 *           once the WebGL panel has landed on it)
 *   button  hover (scale 1.04, cursor "OPEN") and the dim + blur while an
 *           image is enlarged
 */

/** CSS for tile i's entrance, from --p (0 → 1 over the reel → gallery transition). */
function entrance(i: number): CSSProperties {
  const delay = 0.45 + Math.min((i - 1) * 0.04, 0.2);
  const t = `clamp(0, calc((var(--p, 1) - ${delay}) / 0.35), 1)`;
  return { opacity: t, transform: `translateX(calc((1 - ${t}) * 10cqh))` };
}

const COVER_HIDDEN = "(max-width: 767px) 1px, (prefers-reduced-motion: reduce) 1px";

export function ProjectStrip({
  tiles,
  title,
  coverShown,
  hidden,
  viewing,
  interactive,
  tileRefs,
  onOpen,
  onCoverLoad,
}: {
  tiles: StripTile[];
  title: string;
  /** The DOM cover replaces the WebGL panel once it has landed. */
  coverShown: boolean;
  /** Index of the tile shown enlarged (hidden here meanwhile), or null. */
  hidden: number | null;
  /** An image is enlarged: dim and blur the rest. */
  viewing: boolean;
  interactive: boolean;
  tileRefs: RefObject<(HTMLElement | null)[]>;
  onOpen(index: number): void;
  onCoverLoad(): void;
}) {
  const count = tiles.length;
  return (
    <div className="group/strip absolute inset-0 z-20" data-viewing={viewing || undefined} inert={!interactive}>
      <ul aria-label={`${title}: photos`} className="contents">
        {tiles.map((tile, i) => (
          <li
            key={tile.key}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            className="absolute will-change-transform"
            style={{
              left: `calc(50% + ${(tile.x - tile.w / 2).toFixed(3)}cqh)`,
              top: `${tile.y.toFixed(3)}cqh`,
              width: `${tile.w.toFixed(3)}cqh`,
              height: `${tile.h.toFixed(3)}cqh`,
              zIndex: tile.z,
            }}
          >
            <div
              className={cn("size-full", hidden === i && "invisible")}
              style={tile.cover ? { opacity: coverShown ? 1 : 0 } : entrance(i)}
            >
              <button
                type="button"
                onClick={() => onOpen(i)}
                data-cursor="view"
                data-cursor-label="OPEN"
                aria-label={`Open photo ${i + 1} of ${count}: ${tile.image.alt}`}
                className={cn(
                  "relative block size-full overflow-hidden rounded-image bg-bg-2 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text",
                  "[transition:scale_350ms_var(--ease-power3),opacity_600ms_var(--ease-power3),filter_600ms_var(--ease-power3)]",
                  "group-data-[viewing]/strip:opacity-30 group-data-[viewing]/strip:blur-[4px]",
                )}
              >
                <Image
                  src={tile.image.url}
                  alt=""
                  fill
                  // The cover is a deep link's largest image, so it loads at once. Where the stage is
                  // hidden (phones, reduced motion) a 1px size makes that a 16px thumbnail.
                  sizes={tile.cover ? `${COVER_HIDDEN}, ${Math.ceil(tile.w)}vh` : `${Math.ceil(tile.w)}vh`}
                  loading={tile.cover ? "eager" : undefined}
                  draggable={false}
                  className="object-cover"
                  onLoad={tile.cover ? onCoverLoad : undefined}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

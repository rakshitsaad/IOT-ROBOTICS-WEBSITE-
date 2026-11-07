import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * The soft iridescent ring behind the /about hands (DESIGN.md §15): a conic
 * gradient of the --iris colours shaped into a thin ring with feathered edges,
 * so it reads like the edge of a soap bubble. It turns once every 40s and
 * breathes (scale 0.98 ↔ 1.02 over 6s); both stop under reduced motion.
 *
 * The softness is drawn by the mask (a band that fades over about 30px each
 * side), not by `filter: blur()`: a blurred layer that rotates is re-blurred
 * every frame, which halved the frame rate. A masked one is rasterised once
 * and only turned by the compositor.
 *
 * Hooks for the scroll controller (each on its own wrapper, so the CSS loops,
 * the scroll scale and the cursor parallax never fight over one transform):
 *   data-ring-parallax  moved by the cursor
 *   data-ring-scale     scaled and faded by the scroll timeline
 *   data-ring-flash     a white copy of the ring that flashes at the touch
 */

/** The iris colours around the circle, with clear gaps so it looks like light on a bubble, not a solid band. */
const CONIC =
  "conic-gradient(from 200deg, var(--blue), var(--violet) 14%, transparent 27%, transparent 33%, var(--coral) 46%, var(--orange) 57%, transparent 69%, transparent 75%, var(--amber) 85%, var(--blue))";

/**
 * A ring centred `inset` inside the circle's edge: solid for `core`, fading to
 * nothing over `feather` on each side (closest-side = the radius).
 */
function ringMask(inset: string, core: string, feather: string): CSSProperties {
  const r = `(100% - ${inset})`;
  const mask = `radial-gradient(closest-side, transparent calc(${r} - ${core} / 2 - ${feather}), black calc(${r} - ${core} / 2), black calc(${r} + ${core} / 2), transparent calc(${r} + ${core} / 2 + ${feather}))`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

export function IrisRing({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute size-[70vmin]", className)}>
      <div data-ring-parallax className="size-full">
        <div data-ring-scale className="size-full">
          <div className="relative size-full animate-breathe motion-reduce:animate-none">
            {/* The glow: a wide, feathered band (≈ a 30px blur). */}
            <div
              className="absolute inset-0 animate-orbit opacity-40 will-change-transform motion-reduce:animate-none"
              style={{ backgroundImage: CONIC, ...ringMask("min(8vmin, 64px)", "0px", "min(7vmin, 56px)") }}
            />
            {/* The bubble's edge: a fine line on top. */}
            <div
              className="absolute inset-0 animate-orbit opacity-45 will-change-transform motion-reduce:animate-none"
              style={{ backgroundImage: CONIC, ...ringMask("min(8vmin, 64px)", "0px", "0.5vmin") }}
            />
            {/* The flash at the touch (invisible until then). */}
            <div
              data-ring-flash
              className="absolute inset-0 bg-white opacity-0"
              style={ringMask("min(8vmin, 64px)", "0px", "min(4vmin, 30px)")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

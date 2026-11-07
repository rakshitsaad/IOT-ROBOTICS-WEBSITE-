/**
 * House motion constants. See DESIGN.md → Motion.
 * GSAP takes the string eases; Motion (Framer) takes the cubic-bezier arrays;
 * CSS uses the --ease-* tokens (Tailwind: ease-power3 / ease-expo).
 */

export const EASE = {
  /** Default for most entrances, hovers that move, reveals. */
  out: "power3.out",
  /** Big, confident moves: overlays, hero type, pinned sequences. */
  expo: "expo.out",
} as const;

/** cubic-bezier equivalents for Motion / CSS. */
export const BEZIER = {
  out: [0.33, 1, 0.68, 1] as [number, number, number, number],
  expo: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

/** Seconds. Entrance / reveal / scroll motion lives in 0.6–1.2s. */
export const DURATION = {
  fast: 0.6,
  base: 0.9,
  slow: 1.2,
  /** Hover/press micro-feedback only (colour, border, small scale). */
  micro: 0.35,
} as const;

/** Default stagger between siblings (seconds). */
export const STAGGER = 0.06;

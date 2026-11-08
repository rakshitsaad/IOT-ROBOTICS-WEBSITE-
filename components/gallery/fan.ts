/**
 * The journal fan's geometry (DESIGN.md §14). Every page's transform comes from
 * ONE continuous float, the position (the active page index, sprung), through
 * d = index − position:
 *
 * - d = 0: facing the viewer, translateZ(0), scale 1;
 * - otherwise: translateX(sign(d) × (52% + 6% × (|d| − 1))) of the page's width,
 *   rotateY(−sign(d) × 62°), translateZ(−110px × |d|), fading out after |d| = 5;
 *   between the centre and the first side page everything is interpolated, so a
 *   page turns smoothly as the position moves;
 * - z-index by distance, so nearer pages cover farther ones.
 */
export const FAN = {
  /** The stage's perspective, px. */
  perspective: 1800,
  /** Offset of the first side page, % of the page width. */
  firstX: 52,
  /** Extra offset per further page, %. */
  stepX: 6,
  /** Side pages' turn, degrees. */
  rotate: 62,
  /** Depth per page of distance, px. */
  depth: 110,
  /** Pages start fading after this distance (desktop). */
  fadeFrom: 5,
  /** Pages shown on each side. */
  side: { desktop: 7, mobile: 3 },
  /** Pages rendered on each side of the position (the rest aren't in the DOM). */
  window: 8,
  /** Reduced motion: a flat slider, neighbours this many page widths apart. */
  flatGap: 1.08,
  /** The position's spring (Motion). */
  spring: { stiffness: 150, damping: 23, mass: 1 },
  /** Drag: how far a flick carries, in seconds of its release velocity. */
  flickCarry: 0.24,
  /** Drag past the first or last page moves at this fraction of the pointer. */
  rubber: 0.3,
} as const;

export interface FanStyle {
  transform: string;
  opacity: number;
  zIndex: number;
}

export function fanStyle(d: number, side: number, flat: boolean): FanStyle {
  const a = Math.abs(d);
  const s = Math.sign(d);
  const zIndex = 1000 - Math.round(a * 10);

  if (flat) {
    return {
      transform: `translate3d(${(d * FAN.flatGap * 100).toFixed(3)}%, 0, 0)`,
      opacity: a <= side + 0.5 ? 1 : 0,
      zIndex,
    };
  }

  const t = Math.min(a, 1);
  const x = s * (FAN.firstX * t + FAN.stepX * Math.max(0, a - 1));
  const rot = -s * FAN.rotate * t;
  const z = -FAN.depth * a;
  // Fade over the last pages: from |d| = 5 to 0 at side + 1 on desktop (7 → 8),
  // and over the last page on phones (3 → 4).
  const fadeFrom = Math.min(FAN.fadeFrom, side - 1);
  const opacity = Math.min(1, Math.max(0, 1 - (a - fadeFrom) / (side + 1 - fadeFrom)));

  return {
    transform: `translate3d(${x.toFixed(3)}%, 0, ${z.toFixed(2)}px) rotateY(${rot.toFixed(3)}deg)`,
    opacity,
    zIndex,
  };
}

/** Clamps a raw position into [0, last], letting it run past the ends at FAN.rubber. */
export function rubberBand(p: number, last: number): number {
  if (p < 0) return p * FAN.rubber;
  if (p > last) return last + (p - last) * FAN.rubber;
  return p;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

import { REEL, reelMetrics, wrapCentered } from "@/lib/projects";

/**
 * The reel's live state (DESIGN.md §16), shared by the stage (input, physics,
 * hit areas, transitions) and the WebGL canvas (which only reads it). A plain
 * mutable object, like botTransform: per-frame values never go through React.
 *
 * Units are CSS px. The scene's world units are px too: the camera is placed
 * so the z = 0 plane maps 1:1 onto the stage, origin at its centre, y up.
 */

export interface ReelSlot {
  key: string;
  /** Index into the filtered project list. */
  project: number;
  cover: string;
}

export const reel = {
  /** Stage size. */
  width: 1,
  height: 1,
  /** Number of slots (the filtered list, repeated to fill the loop). */
  count: 0,
  /** Scroll along the curve: where the reel is, where it is heading, and its smoothed speed (px/s). */
  offset: 0,
  target: 0,
  speed: 0,
  dragging: false,
  /** Slot under the pointer, or -1. */
  hovered: -1,
  /** 0 → 1 the first time the canvas shows (panels fade in from the centre, the curve settles). */
  intro: 0,
  /** Global fade, used when the filter changes. */
  alpha: 1,
  /** Speed effects, smoothed: extra bend 0–1 and a signed RGB split (uv units). */
  boost: 0,
  split: 0,
  /** The reel ↔ gallery transition: this slot unbends onto a flat rect (world px, centre and size). */
  morph: { slot: -1, t: 0, x: 0, y: 0, w: 0, h: 0 },
  /** 0 → 1: every other slot flies out sideways and fades. */
  fly: 0,
  /** Set by the canvas: request a frame (it renders on demand). */
  invalidate: () => {},
};

export type ReelGeometry = ReturnType<typeof reelGeometry>;

/** Px geometry for the current stage, including the live curvature (1/px). */
export function reelGeometry() {
  const m = reelMetrics(reel.width);
  const loop = Math.max(reel.count, 1) * m.spacing;
  const k = (1 / m.radius) * (1 + REEL.bendBoost * reel.boost) * (1 + (1 - reel.intro) * 0.8);
  return { ...m, loop, k };
}

/** Where a slot's centre sits along the curve (0 = screen centre), after the loop wrap and the fly-out. */
export function slotArc(slot: number, g: ReelGeometry): number {
  let s = wrapCentered(slot * g.spacing - reel.offset, g.loop);
  if (reel.fly > 0 && slot !== reel.morph.slot) s += (s < 0 ? -1 : 1) * reel.fly * reel.width * 0.9;
  return s;
}

/** A point on the curve at arc length s: x across, z towards the camera (same maths as the vertex shader). */
export function arcPoint(s: number, k: number) {
  const t = s * k;
  const h = Math.sin(t / 2);
  return { x: Math.sin(t) / k, z: (2 * h * h) / k };
}

/** Project a world point onto the stage (px from its top left). */
export function toScreen(x: number, y: number, z: number, g: ReelGeometry) {
  const scale = g.camera / Math.max(g.camera - z, 1);
  return { x: reel.width / 2 + x * scale, y: reel.height / 2 - y * scale };
}

/** The screen box of a panel centred at arc length s (the curved panel's extent, for its hit area). */
export function panelBox(s: number, g: ReelGeometry) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (let i = 0; i <= 6; i++) {
    const p = arcPoint(s + (i / 6 - 0.5) * g.panelW, g.k);
    const a = toScreen(p.x, g.panelH / 2, p.z, g);
    const b = toScreen(p.x, -g.panelH / 2, p.z, g);
    left = Math.min(left, a.x);
    right = Math.max(right, a.x);
    top = Math.min(top, a.y);
    bottom = Math.max(bottom, b.y);
  }
  return { left, top, width: right - left, height: bottom - top };
}

/** The slot nearest the centre. */
export function activeSlot(g: ReelGeometry): number {
  if (reel.count === 0) return 0;
  const i = Math.round(reel.offset / g.spacing);
  return ((i % reel.count) + reel.count) % reel.count;
}

/** The target that brings `slot` to the centre the short way round. */
export function targetFor(slot: number, g: ReelGeometry): number {
  return reel.offset + wrapCentered(slot * g.spacing - reel.offset, g.loop);
}

/** Exponential smoothing towards a target, frame-rate independent. */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

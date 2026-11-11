/**
 * The /about robot hand's rig (DESIGN.md §15): joint positions, the pose keyframes and the interpolation behind
 * `setPose(progress)`. Pure and client-safe; RobotHand.tsx draws the SVG and writes these values into transforms.
 *
 * Frames:
 * - The hand's own frame: the wrist pivot at (0, 0), the fingers pointing up (−y), the forearm running down (+y).
 *   Every joint is drawn in its parent's frame with the joint at its origin, so a rotation always turns around it.
 * - The world: the card's SVG, a 1000 × 1000 viewBox (`slice`), where the hand is placed by x, y, rot and scale.
 *
 * Angles are in degrees, positive = clockwise on screen. Fingers curl towards +x (the palm and thumb side); the thumb
 * closes towards −x (the fingers).
 */

export type FingerName = "index" | "middle" | "ring" | "little";

/** Order for staggers: the index moves first, the little finger last. */
export const FINGER_ORDER: readonly FingerName[] = ["index", "middle", "ring", "little"];

/** Back to front, so the index finger is drawn on top. */
export const FINGER_DRAW_ORDER: readonly FingerName[] = ["little", "ring", "middle", "index"];

export interface FingerSpec {
  /** The knuckle, in the palm's frame. */
  knuckle: [number, number];
  /** Segment width. */
  w: number;
  /** Joint-to-joint lengths: proximal, middle, tip (to the centre of the tip's rounded end). */
  len: [number, number, number];
}

export const FINGERS: Record<FingerName, FingerSpec> = {
  index: { knuckle: [64, -212], w: 48, len: [82, 60, 44] },
  middle: { knuckle: [21, -219], w: 50, len: [88, 64, 46] },
  ring: { knuckle: [-22, -215], w: 48, len: [82, 60, 44] },
  little: { knuckle: [-63, -203], w: 42, len: [66, 50, 38] },
};

export const THUMB = {
  /** The thumb's base joint, in the palm's frame (on the thumb side, low on the palm). */
  base: [84, -72] as [number, number],
  w: [54, 48] as [number, number],
  len: [76, 58] as [number, number],
};

/** spread (at the knuckle, in the palm's plane), then the curl of the proximal, middle and tip segments. */
export type FingerPose = [spread: number, c1: number, c2: number, c3: number];

export interface HandPose {
  /** The wrist pivot, in the card's 1000 × 1000 viewBox. */
  x: number;
  y: number;
  /** The whole hand; 180 points the fingers straight down. */
  rot: number;
  scale: number;
  /** The palm's flex at the wrist. */
  wrist: number;
  /** The thumb's base and tip joints. */
  thumb: [number, number];
  fingers: Record<FingerName, FingerPose>;
}

/** The hand's size in the card. */
const S = 1.45;

const RELAXED: Pick<HandPose, "wrist" | "thumb" | "fingers"> = {
  wrist: -4,
  thumb: [34, -8],
  fingers: { index: [8, 14, 16, 10], middle: [3, 14, 16, 10], ring: [-3, 15, 17, 10], little: [-8, 16, 18, 12] },
};
const OPEN: Pick<HandPose, "wrist" | "thumb" | "fingers"> = {
  wrist: 4,
  thumb: [50, 2],
  fingers: { index: [21, -8, -4, -2], middle: [7, -8, -4, -2], ring: [-8, -8, -4, -2], little: [-23, -6, -4, -2] },
};
const POINT: Pick<HandPose, "wrist" | "thumb" | "fingers"> = {
  wrist: 0,
  thumb: [16, -22],
  fingers: { index: [4, -4, 0, 0], middle: [0, 46, 58, 38], ring: [-2, 50, 60, 40], little: [-4, 52, 62, 42] },
};
const GRIP: Pick<HandPose, "wrist" | "thumb" | "fingers"> = {
  wrist: -8,
  thumb: [-8, -42],
  fingers: { index: [-2, 60, 72, 52], middle: [0, 64, 76, 54], ring: [-2, 68, 78, 54], little: [-4, 70, 78, 56] },
};
const LOOSE: Pick<HandPose, "wrist" | "thumb" | "fingers"> = {
  wrist: -2,
  thumb: [14, -24],
  fingers: { index: [2, 36, 42, 28], middle: [0, 38, 44, 30], ring: [-2, 40, 46, 30], little: [-4, 42, 46, 32] },
};

/** The keyframes, in order: entering (off the card, top right), entered, open, pointing, gripping, gone (bottom right). */
const KEYS: HandPose[] = [
  { x: 1460, y: -570, rot: 215, scale: S, ...RELAXED },
  { x: 780, y: 150, rot: 215, scale: S, ...RELAXED },
  { x: 612, y: 248, rot: 195, scale: S, ...OPEN },
  { x: 598, y: 260, rot: 192, scale: S, ...POINT },
  { x: 602, y: 272, rot: 188, scale: S, ...GRIP },
  { x: 1230, y: 1390, rot: 200, scale: S, ...LOOSE },
];

/** The pose shown without motion (reduced motion, before the scroll controller runs): open, reaching. */
export const STATIC_POSE: HandPose = KEYS[2];

type Ease = (t: number) => number;
const outCubic: Ease = (t) => 1 - (1 - t) ** 3;
const inCubic: Ease = (t) => t ** 3;
const inOutSine: Ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const smooth: Ease = (t) => t * t * (3 - 2 * t);

/**
 * One transition per pair of keys, over a share of the progress. The joints don't all move at once: each starts after
 * `finger × fingerIndex + segment × segmentIndex` of the window (the thumb after `thumb`), and every joint finishes
 * within `active` of it, leaving the rest of the window as a short hold.
 */
interface Phase {
  from: number;
  to: number;
  move: Ease;
  finger: number;
  segment: number;
  thumb: number;
  active: number;
}

const PHASES: Phase[] = [
  // 0–15%: the arm slides in from the top right, relaxed.
  { from: 0, to: 0.15, move: outCubic, finger: 0, segment: 0, thumb: 0, active: 1 },
  // 15–40%: it moves to the middle and turns; the fingers spread one after another, index first.
  { from: 0.15, to: 0.4, move: inOutSine, finger: 0.14, segment: 0.04, thumb: 0, active: 0.9 },
  // 40–60%: the index points, the others curl halfway.
  { from: 0.4, to: 0.6, move: inOutSine, finger: 0.06, segment: 0.04, thumb: 0.1, active: 0.85 },
  // 60–85%: the grip. Finger by finger, each bending proximal → middle → tip; the thumb closes last.
  { from: 0.6, to: 0.85, move: inOutSine, finger: 0.1, segment: 0.05, thumb: 0.45, active: 0.92 },
  // 85–100%: it loosens and leaves through the bottom right.
  { from: 0.85, to: 1, move: inCubic, finger: 0, segment: 0, thumb: 0, active: 1 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A joint's own progress through phase `ph` at window position `u`, given its start delay. */
function jointT(ph: Phase, u: number, delay: number, maxDelay: number): number {
  return smooth(clamp01((u - delay) / (ph.active - maxDelay)));
}

/** The hand at scroll progress `p` (0–1). */
export function poseAt(progress: number): HandPose {
  const p = clamp01(progress);
  const i = Math.max(0, PHASES.findIndex((ph) => p <= ph.to));
  const ph = PHASES[i];
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = clamp01((p - ph.from) / (ph.to - ph.from));
  const m = ph.move(u);
  const maxDelay = Math.max(3 * ph.finger + 2 * ph.segment, ph.thumb + ph.segment);

  const fingers = {} as Record<FingerName, FingerPose>;
  FINGER_ORDER.forEach((name, f) => {
    const from = a.fingers[name];
    const to = b.fingers[name];
    const base = f * ph.finger;
    fingers[name] = [
      lerp(from[0], to[0], jointT(ph, u, base, maxDelay)),
      lerp(from[1], to[1], jointT(ph, u, base, maxDelay)),
      lerp(from[2], to[2], jointT(ph, u, base + ph.segment, maxDelay)),
      lerp(from[3], to[3], jointT(ph, u, base + 2 * ph.segment, maxDelay)),
    ];
  });

  return {
    x: lerp(a.x, b.x, m),
    y: lerp(a.y, b.y, m),
    rot: lerp(a.rot, b.rot, m),
    scale: lerp(a.scale, b.scale, m),
    wrist: lerp(a.wrist, b.wrist, inOutSine(u)),
    thumb: [
      lerp(a.thumb[0], b.thumb[0], jointT(ph, u, ph.thumb, maxDelay)),
      lerp(a.thumb[1], b.thumb[1], jointT(ph, u, ph.thumb + ph.segment, maxDelay)),
    ],
    fingers,
  };
}

/** The index fingertip's glow while it points: a quick swell and fade around 52% of the progress (0–1). */
export function glowAt(progress: number): number {
  const d = Math.abs(progress - 0.52) / 0.06;
  return d >= 1 ? 0 : smooth(1 - d);
}

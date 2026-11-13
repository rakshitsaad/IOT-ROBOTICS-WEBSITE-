/**
 * The /about industrial arm (DESIGN.md §22). Client-safe config: sizes, joint limits and motion, where the arm
 * stands on each screen size, and the pose it takes in each part of the page.
 *
 * Units are the arm's own (its upper arm is 1.1 long). The arm stands at the origin with y up; with its base turned
 * to 0 it faces +Z (towards the camera); screen left is -X.
 */

export type Vec3 = [number, number, number];

/** Link lengths. The shoulder axis sits `shoulderH` above the floor and `shoulderOff` in front of the base axis. */
export const ARM_DIM = {
  shoulderH: 0.62,
  shoulderOff: 0.12,
  upper: 1.1,
  fore: 0.95,
  /** Wrist centre to the middle of the fingertips. */
  tool: 0.47,
  /** Where the forearm's roll joint (J4) sits, from the elbow. */
  rollAt: 0.34,
} as const;

/**
 * Joints, in order: J1 base yaw, J2 shoulder (elevation above horizontal), J3 elbow (bend), J4 forearm roll,
 * J5 wrist pitch, J6 flange roll, then the gripper (0 open, 1 closed).
 */
export const JOINT_COUNT = 7;

/** Mechanical limits in radians (J6 counter-rolls J4, so it shares J4's ±180°). */
export const JOINT_LIMITS: [number, number][] = [
  [-2.9, 2.9],
  [-0.35, 2.4],
  [0.15, 2.75],
  [-Math.PI, Math.PI],
  [-2.1, 2.1],
  [-Math.PI, Math.PI],
  [0, 1],
];

/**
 * How each joint moves: a critically damped spring (`w`, rad/s) capped at `vmax` (rad/s) and `amax` (rad/s²), so the
 * big axes start and stop slowly and the wrist is quicker, like a real servo arm. amax ≥ w × vmax keeps overshoot small.
 */
export const JOINT_MOTION: { w: number; vmax: number; amax: number }[] = [
  { w: 4, vmax: 1.4, amax: 6 },
  { w: 4.5, vmax: 1.5, amax: 7 },
  { w: 4.5, vmax: 1.7, amax: 8 },
  { w: 6, vmax: 3, amax: 18 },
  { w: 6.5, vmax: 3, amax: 20 },
  { w: 6, vmax: 3.5, amax: 21 },
  { w: 14, vmax: 7, amax: 98 },
];

/** Folded "power off" angles the arm starts from, so it unfolds into its first pose when it appears. */
export const ARM_REST = [-0.9, 1.45, 2.5, 0, 1.2, 0, 0.6];

/**
 * A pose: the wrist centre's target, a point the gripper points at, the gripper (0 open, 1 closed), a shift of the
 * whole arm in fractions of the screen (x right, y up; it moves different parts of the arm into view), and the
 * layer's opacity (lower where text sits over the arm).
 */
export interface ArmPose {
  target: Vec3;
  aim: Vec3;
  grip: number;
  shift: [number, number];
  opacity: number;
}

/**
 * Poses per part of the page. Each key is an element with `data-arm-scene="<name>"` (the footer is `#site-footer`);
 * `at` runs from 0 (the element's top at the screen's top) to 1 (its bottom at the screen's bottom), so a pinned
 * section plays its keys across its pin. Between keys the pose eases from one to the next.
 */
export const ARM_SCENES: Record<string, { at: number; pose: ArmPose }[]> = {
  intro: [
    // Reaching up into the empty right half, the gripper turned towards the heading.
    { at: 0, pose: { target: [-0.8, 1.85, 0.5], aim: [-2.4, 1.1, 2.2], grip: 0.3, shift: [0, 0], opacity: 1 } },
    // Reaches towards the heading and opens.
    { at: 0.45, pose: { target: [-1.3, 1.45, 0.75], aim: [-3.2, 0.9, 1.2], grip: 0, shift: [0, 0], opacity: 1 } },
    // Closes on it.
    { at: 0.75, pose: { target: [-1.35, 1.2, 0.8], aim: [-2.6, 0.2, 1.3], grip: 1, shift: [0, 0], opacity: 1 } },
    // Lifts it.
    { at: 1, pose: { target: [-0.7, 2.0, 0.45], aim: [-1.3, 3.0, 1.6], grip: 1, shift: [0, -0.02], opacity: 0.9 } },
  ],
  purpose: [
    // Leans over the two cards, looking down at them.
    { at: 0.5, pose: { target: [-0.5, 1.5, 0.9], aim: [-1.6, 0.3, 2.5], grip: 0.45, shift: [0.03, -0.12], opacity: 0.55 } },
  ],
  pillars: [
    // Raised, scanning across the three columns.
    { at: 0.5, pose: { target: [-0.25, 2.0, 0.35], aim: [-1.2, 2.6, 2.2], grip: 0.2, shift: [0.05, -0.16], opacity: 0.5 } },
  ],
  history: [
    // Low, following the timeline down.
    { at: 0, pose: { target: [-0.9, 1.25, 0.85], aim: [-2.2, 0.6, 1.6], grip: 0.6, shift: [0.03, -0.1], opacity: 0.45 } },
    { at: 1, pose: { target: [-0.8, 0.95, 0.9], aim: [-1.9, -0.2, 1.6], grip: 0.6, shift: [0.03, -0.08], opacity: 0.45 } },
  ],
  teams: [
    // Gripper open towards the team pills, as if offering one.
    { at: 0.5, pose: { target: [-1.1, 1.6, 0.6], aim: [-3, 1.0, 1.4], grip: 0, shift: [0, -0.04], opacity: 0.6 } },
  ],
  footer: [
    // At rest, looking down at the wordmark.
    { at: 1, pose: { target: [-0.6, 1.05, 0.7], aim: [-1.6, -0.5, 1.6], grip: 0.5, shift: [0.02, 0], opacity: 0.55 } },
  ],
};

/** The camera. The arm's placement below is in fractions of the screen, so it doesn't depend on these. */
export const ARM_CAMERA = { position: [0, 0.35, 9] as Vec3, fov: 28 };

/**
 * Where the arm's base stands, in fractions of the screen from its centre (x right, y up), its size, and an opacity
 * factor. Phones and portrait tablets get a smaller, fainter arm, because their text runs the full width.
 */
export function armPlacement(widthPx: number, aspect: number) {
  if (widthPx < 768) return { x: 0.2, y: -0.52, scale: 0.78, opacity: 0.5 };
  if (aspect < 1.15) return { x: 0.3, y: -0.5, scale: 1, opacity: 0.65 };
  return { x: 0.3, y: -0.53, scale: 1.4, opacity: 1 };
}

/** Interaction feel. */
export const ARM_INPUT = {
  /** Visitor input older than this (ms) starts the idle routine. */
  idleAfter: 5000,
  /** How far the wrist leans towards the cursor (a share of the distance, capped in arm units). */
  follow: 0.22,
  followMax: 0.6,
  /** How strongly the gripper turns to look at the cursor (0–1). */
  look: 0.75,
  /** The cursor is read on a plane this far in front of the arm's base (arm units). */
  planeZ: 0.9,
  /** Click: the gripper closes and the wrist nods, over this long (ms). */
  click: 500,
  /** Camera parallax with the cursor (world units). */
  parallax: [0.18, 0.1] as [number, number],
};

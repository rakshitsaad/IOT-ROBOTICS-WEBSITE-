import { ARM_DIM, JOINT_LIMITS, JOINT_MOTION, type Vec3 } from "@/lib/arm";

/**
 * The arm's maths, without three.js: inverse kinematics (where the wrist should be and what the gripper points at →
 * joint angles), forward kinematics (for checks), and the servo springs that move each joint.
 *
 * Joint frames (see IndustrialArm): J1 turns about Y; J2 and J3 pitch about the turret's X axis (rotation.x = −J2,
 * then +J3); J4 rolls about the forearm (Z); J5 pitches the wrist (X); J6 rolls the flange (Z). The tool points +Z.
 */

const { shoulderH: SH, shoulderOff: OFF, upper: L1, fore: L2, tool: TOOL } = ARM_DIM;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** The angle equal to `a` (mod 2π) nearest to `ref`. */
function nearest(a: number, ref: number) {
  return a + Math.round((ref - a) / (2 * Math.PI)) * 2 * Math.PI;
}

/**
 * Joint angles that put the wrist centre at `target` and point the gripper at `aim` (both in arm space), elbow up,
 * inside the joint limits. The forearm roll takes the solution nearest to `current` within ±180°, so it never winds round.
 * Writes J1–J6 into `out` (index 6, the gripper, is left alone).
 */
export function solveArm(target: Vec3, aim: Vec3, current: ArrayLike<number>, out: number[]) {
  const [tx, ty, tz] = target;
  const j1 = clamp(Math.atan2(tx, tz), JOINT_LIMITS[0][0], JOINT_LIMITS[0][1]);
  const s1 = Math.sin(j1);
  const c1 = Math.cos(j1);

  // In the arm's vertical plane: r forward from the shoulder, h up from it.
  const r = tx * s1 + tz * c1 - OFF;
  const h = ty - SH;
  const d = clamp(Math.hypot(r, h), Math.abs(L1 - L2) + 0.05, L1 + L2 - 0.02);
  const a = Math.atan2(h, r);
  const b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const c = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  const j2 = clamp(a + b, JOINT_LIMITS[1][0], JOINT_LIMITS[1][1]);
  const j3 = clamp(Math.PI - c, JOINT_LIMITS[2][0], JOINT_LIMITS[2][1]);

  // Where the wrist really is after the limits, and the forearm's frame there.
  const e = j2 - j3;
  const zf: Vec3 = [Math.cos(e) * s1, Math.sin(e), Math.cos(e) * c1];
  const xf: Vec3 = [c1, 0, -s1];
  const yf: Vec3 = [zf[1] * xf[2] - zf[2] * xf[1], zf[2] * xf[0] - zf[0] * xf[2], zf[0] * xf[1] - zf[1] * xf[0]];
  const w = wristCentre(j1, j2, j3);

  // The aim direction in the forearm's frame, then Rz(J4)·Rx(J5)·(0,0,1) = that direction.
  let dx = aim[0] - w[0];
  let dy = aim[1] - w[1];
  let dz = aim[2] - w[2];
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;
  const lx = dx * xf[0] + dy * xf[1] + dz * xf[2];
  const ly = dx * yf[0] + dy * yf[1] + dz * yf[2];
  const lz = dx * zf[0] + dy * zf[1] + dz * zf[2];

  let j4 = current[3];
  let j5 = Math.acos(clamp(lz, -1, 1));
  if (j5 > 0.03) {
    // Two solutions: (φ, J5) and (φ + π, −J5), each wrapped into J4's ±180° travel (a cabled forearm can't wind
    // round, and near J5 = 0 φ swings freely). Take the one that turns the forearm least.
    const phi = Math.atan2(lx, -ly);
    const p1 = nearest(phi, 0);
    const p2 = nearest(phi + Math.PI, 0);
    if (Math.abs(p2 - current[3]) < Math.abs(p1 - current[3])) {
      j4 = p2;
      j5 = -j5;
    } else j4 = p1;
  }
  j5 = clamp(j5, JOINT_LIMITS[4][0], JOINT_LIMITS[4][1]);

  out[0] = j1;
  out[1] = j2;
  out[2] = j3;
  out[3] = j4;
  out[4] = j5;
  // Counter-roll the flange so the fingers stay level as the forearm rolls.
  out[5] = -j4;
  return out;
}

/** Wrist centre for J1–J3 (arm space). */
export function wristCentre(j1: number, j2: number, j3: number): Vec3 {
  const s1 = Math.sin(j1);
  const c1 = Math.cos(j1);
  const e = j2 - j3;
  const r = OFF + L1 * Math.cos(j2) + L2 * Math.cos(e);
  return [r * s1, SH + L1 * Math.sin(j2) + L2 * Math.sin(e), r * c1];
}

/** Fingertip centre and the tool's direction for a full set of joints (arm space). */
export function forwardTool(j: ArrayLike<number>): { tip: Vec3; dir: Vec3 } {
  const [j1, j2, j3, j4, j5] = [j[0], j[1], j[2], j[3], j[4]];
  const s1 = Math.sin(j1);
  const c1 = Math.cos(j1);
  const e = j2 - j3;
  const zf: Vec3 = [Math.cos(e) * s1, Math.sin(e), Math.cos(e) * c1];
  const xf: Vec3 = [c1, 0, -s1];
  const yf: Vec3 = [zf[1] * xf[2] - zf[2] * xf[1], zf[2] * xf[0] - zf[0] * xf[2], zf[0] * xf[1] - zf[1] * xf[0]];
  const s5 = Math.sin(j5);
  const local: Vec3 = [s5 * Math.sin(j4), -s5 * Math.cos(j4), Math.cos(j5)];
  const dir: Vec3 = [0, 1, 2].map((k) => local[0] * xf[k] + local[1] * yf[k] + local[2] * zf[k]) as Vec3;
  const w = wristCentre(j1, j2, j3);
  return { tip: [w[0] + dir[0] * TOOL, w[1] + dir[1] * TOOL, w[2] + dir[2] * TOOL], dir };
}

/**
 * One servo step for every joint towards `target`: a critically damped spring, its acceleration and speed capped,
 * in substeps of at most 1/120s. Returns the largest joint speed, so callers can tell when the arm is still.
 */
export function stepJoints(pos: number[], vel: number[], target: ArrayLike<number>, dt: number) {
  const steps = Math.max(1, Math.ceil(dt * 120));
  const h = dt / steps;
  let fastest = 0;
  for (let i = 0; i < pos.length; i++) {
    const { w, vmax, amax } = JOINT_MOTION[i];
    for (let s = 0; s < steps; s++) {
      const acc = clamp(w * w * (target[i] - pos[i]) - 2 * w * vel[i], -amax, amax);
      vel[i] = clamp(vel[i] + acc * h, -vmax, vmax);
      pos[i] += vel[i] * h;
    }
    fastest = Math.max(fastest, Math.abs(vel[i]));
  }
  return fastest;
}

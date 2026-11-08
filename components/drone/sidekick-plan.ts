/**
 * The home sidekick's planning, in screen space (px inside the robot's stage): where it may fly, where it may not
 * stop, and the waypoints of each curved flight. Pure functions; Sidekick.tsx turns the waypoints into a
 * Catmull-Rom path in world space and flies it. See DESIGN.md §12 "Sidekick drone".
 */

export type Stunt = "barrel" | "flip" | "loop" | "orbit" | "peekaboo" | "wobble" | "boop";

export const SIDEKICK = {
  /** Drone width as a fraction of the robot's height (the drone is 1.6 units across, the robot 2.4 tall). */
  size: 1 / 6,
  /** Phones: smaller still. */
  mobileSize: 0.13,
  /** Trail: a subtle budget, short-lived. */
  particles: 300,
  mobileParticles: 110,
  life: 0.8,
  /** Seconds hovering at each stop (a gentle bob), and a stop-to-stop cycle of about 3–6s. */
  hover: [1, 2] as [number, number],
  flight: [1.4, 3] as [number, number],
  /** A stunt after every 2–3 flights. */
  stuntEvery: [2, 3] as [number, number],
  stunts: ["barrel", "flip", "loop", "orbit", "peekaboo", "wobble", "boop"] as Stunt[],
  mobileStunts: ["flip", "orbit"] as Stunt[],
  /** Seconds per stunt (each 1–2s). */
  stuntTime: { barrel: 1.2, flip: 1, loop: 1.5, orbit: 2, peekaboo: 2, wobble: 1.5, boop: 1.7 } as Record<Stunt, number>,
  /**
   * Cursor within `radius` px, coming at it faster than `speed` px/s: it darts away (`distance` px), then settles.
   * A slow, careful approach doesn't startle it, so it can be caught and clicked.
   */
  dart: { radius: 120, speed: 350, distance: 210, time: 0.55, settle: 0.7, cooldown: 0.9 },
  /** No input for this long (ms): it lands on the robot's head and both nap. */
  idle: 6000,
  /** Leaves upward when the hero's bottom is above this fraction of the viewport, comes back above `back`. */
  exit: 0.7,
  back: 0.82,
  /** Click target radius, px (at least). */
  hit: 30,
} as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Pt = { x: number; y: number };

export const inflate = (r: Rect, m: number): Rect => ({ x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m });
export const inside = (r: Rect, p: Pt) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
export const insideAny = (rs: Rect[], p: Pt) => rs.some((r) => inside(r, p));

/** Does the segment a → b pass through r (sampled)? */
export function crosses(r: Rect, a: Pt, b: Pt) {
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    if (inside(r, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return true;
  }
  return false;
}

export interface Zones {
  /** Where it may fly: the hero inside the stage, inset from the edges and clear of the header. */
  region: Rect;
  /** Where it may never stop: the wordmark's letters (per line) and the header's links and buttons. */
  text: Rect[];
  /** The robot's head + body box (it may not stop in front of it, or fly through it). */
  robot: Rect | null;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** A random stop inside the region, off the text, not in front of the robot, and not too close to `from`. */
export function pickStop(z: Zones, from: Pt, pad: number): Pt {
  const { region: R } = z;
  const blocked = [...z.text.map((r) => inflate(r, pad)), ...(z.robot ? [inflate(z.robot, pad)] : [])];
  const minHop = Math.min(R.w, R.h) * 0.25;
  for (let i = 0; i < 60; i++) {
    const p = { x: rand(R.x, R.x + R.w), y: rand(R.y, R.y + R.h) };
    if (insideAny(blocked, p)) continue;
    if (i < 40 && Math.hypot(p.x - from.x, p.y - from.y) < minHop) continue;
    return p;
  }
  // Tight space (phones: the wordmark and the robot fill most of the stage): the open grid spot farthest from every
  // zone; if the robot leaves none, one off the text only (in front of the robot: its depth band is in front of it).
  const text = z.text.map((r) => inflate(r, pad));
  return bestSpot(R, blocked, from, minHop) ?? bestSpot(R, text, from, minHop) ?? { x: R.x + R.w / 2, y: R.y + R.h };
}

/** Distance from p to rect r (0 inside). */
const gap = (r: Rect, p: Pt) => Math.hypot(Math.max(r.x - p.x, 0, p.x - (r.x + r.w)), Math.max(r.y - p.y, 0, p.y - (r.y + r.h)));

/** On a 9×7 grid over the region: the point farthest from all `zones` (and not on any), preferring ones away from `from`. */
function bestSpot(R: Rect, zones: Rect[], from: Pt, minHop: number): Pt | null {
  let best: Pt | null = null;
  let score = 0;
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 6; j++) {
      const p = { x: R.x + (R.w * i) / 8, y: R.y + (R.h * j) / 6 };
      if (insideAny(zones, p)) continue;
      const clearance = zones.length ? Math.min(...zones.map((r) => gap(r, p))) : 1;
      const s = (clearance + 1) * (Math.hypot(p.x - from.x, p.y - from.y) >= minHop ? 2 : 1) * (0.75 + 0.5 * Math.random());
      if (s > score) {
        score = s;
        best = p;
      }
    }
  }
  return best;
}

export type Waypoint = Pt & {
  /** Depth: "front" (the normal band in front of the robot), or "behind" (behind the robot). */
  depth: "front" | "behind";
};

/**
 * The waypoints of one flight (start and end excluded): 2–3 random midpoints bending the path, lifted above the
 * text wherever they would sit on it. If the straight line crosses the robot, the path goes around it: behind it
 * (past its sides at its own depth, then behind its centre), or over its head.
 */
export function planVia(z: Zones, a: Pt, b: Pt, pad: number): Waypoint[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const R = z.region;
  const clampPt = (p: Pt): Pt => ({
    x: Math.min(R.x + R.w, Math.max(R.x, p.x)),
    y: Math.min(R.y + R.h, Math.max(R.y - pad, p.y)),
  });
  const textTop = z.text.length ? Math.min(...z.text.map((r) => r.y)) : R.y;

  const robot = z.robot ? inflate(z.robot, pad * 1.4) : null;
  if (robot && crosses(robot, a, b)) {
    const cx = robot.x + robot.w / 2;
    const leftToRight = a.x < b.x;
    const near = leftToRight ? robot.x : robot.x + robot.w;
    const far = leftToRight ? robot.x + robot.w : robot.x;
    const y = robot.y + robot.h * rand(0.15, 0.45);
    if (Math.random() < 0.65) {
      // Behind: skirt the near side, pass behind its centre, come out past the far side.
      return [
        { x: near + (leftToRight ? -pad : pad), y, depth: "front" },
        { x: cx, y: y + rand(-0.1, 0.1) * robot.h, depth: "behind" },
        { x: far + (leftToRight ? pad : -pad), y, depth: "front" },
      ];
    }
    // Over the top of its head.
    const over = Math.max(R.y - pad, robot.y - pad * 1.5);
    return [
      { x: near, y: over, depth: "front" },
      { x: far, y: over, depth: "front" },
    ];
  }

  const n = Math.random() < 0.5 ? 2 : 3;
  const bend = rand(0.18, 0.42) * len * (Math.random() < 0.5 ? -1 : 1);
  const out: Waypoint[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const swing = Math.sin(Math.PI * t) * bend * (i === 2 && n === 3 ? rand(0.4, 1.2) : 1);
    let p = clampPt({ x: a.x + dx * t + nx * swing + rand(-30, 30), y: a.y + dy * t + ny * swing + rand(-30, 30) });
    // Over the text, never on it: lift a midpoint that lands on a letter above the wordmark.
    if (insideAny(z.text.map((r) => inflate(r, pad)), p)) p = { x: p.x, y: Math.max(R.y - pad, textTop - pad * 1.5) };
    out.push({ ...p, depth: "front" });
  }
  return out;
}

/** The next stunt: random, never the same as the last. */
export function pickStunt(list: readonly Stunt[], last: Stunt | null): Stunt {
  const pool = list.filter((s) => s !== last);
  return pool[Math.floor(Math.random() * pool.length)] ?? list[0];
}

export const between = ([a, b]: readonly [number, number]) => rand(a, b);

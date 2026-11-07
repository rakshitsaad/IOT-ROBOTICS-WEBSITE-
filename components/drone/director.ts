import { MISSION, phaseAt, type MissionCardId, type MissionPhase } from "@/lib/mission";
import { FLIGHT } from "./config";
import { droneState, type ScreenPoint } from "./store";

/**
 * The director: each frame, turns the mode (scroll progress or the lab's buttons) and the visitor's input into an
 * intent: where the drone should be, which card it scans, whether the globe shows, how far it has dissolved.
 * Pure apart from reading droneState; the rig turns the intent into motion (springs) and effects.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Intent {
  at: ScreenPoint;
  /** Card to scan once the drone is over it (the beam waits until it arrives). */
  scan: MissionCardId | null;
  /** Card the drone is over (for the beam target), scanning or not. */
  card: MissionCardId | null;
  globe: boolean;
  dissolve: number;
  phase: MissionPhase | "manual";
}

export interface Stage {
  w: number;
  h: number;
  /** A card's rect in stage px, or null if it isn't on the page. */
  card: (id: MissionCardId) => Rect | null;
  /** The drone's current spot (stage px). */
  drone: { x: number; y: number };
}

/** Over a card: centred, over its upper part, so the beam has room to reach down to it. */
export function overCard(r: Rect): ScreenPoint {
  return { x: r.x + r.w / 2, y: r.y + r.h * 0.2, z: FLIGHT.z };
}
/** Where the beam lands on a card. */
export function beamSpot(r: Rect): ScreenPoint {
  return { x: r.x + r.w / 2, y: r.y + r.h * 0.64, z: 0 };
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** Remembered between frames: where the drone was when the dissolve started (it holds there). */
let hold: ScreenPoint | null = null;

export function direct(stage: Stage, now: number): Intent {
  const { w, h } = stage;
  const home: ScreenPoint = { x: w * 0.62, y: h * 0.42, z: FLIGHT.z + 0.3 };
  const entry: ScreenPoint = { x: w * 1.1, y: h * 1.2, z: -2.5 };
  const centre: ScreenPoint = { x: w * 0.5, y: h * 0.72, z: FLIGHT.z + 0.4 };
  const none = { scan: null, card: null, globe: false, dissolve: 0 };

  const cardIntent = (id: MissionCardId, scan: boolean): Omit<Intent, "phase" | "dissolve" | "globe"> | null => {
    const r = stage.card(id);
    return r ? { at: overCard(r), scan: scan ? id : null, card: id } : null;
  };

  /** Free flight: a held card, else the cursor (fine pointers, not idle), else the figure-eight. */
  const free = (allowFollow: boolean) => {
    const it = droneState.interest;
    if (it.card && it.until > now) {
      const c = cardIntent(it.card, true);
      if (c) return c;
    }
    const p = droneState.pointer;
    if (allowFollow && droneState.finePointer && p.inside && now - p.moved < MISSION.idle) {
      return { at: follow(stage), scan: null, card: null };
    }
    return { at: patrol(stage, now), scan: null, card: null };
  };

  if (droneState.mode === "manual") {
    const m = droneState.manual;
    const g = m.goal;
    let base: Omit<Intent, "phase" | "dissolve" | "globe"> = { at: home, scan: null, card: null };
    if (g.kind === "card") base = cardIntent(g.card, g.scan) ?? base;
    else if (g.kind === "center") base = { at: centre, scan: null, card: null };
    else if (g.kind === "follow") base = free(true);
    else if (g.kind === "patrol") base = { at: patrol(stage, now), scan: null, card: null };
    if (m.globe) base = { ...base, at: centre, scan: null, card: null };
    hold = null;
    return { ...base, globe: m.globe, dissolve: droneState.dissolve, phase: "manual" };
  }

  const { id, u } = phaseAt(droneState.progress, droneState.mobile);
  if (id !== "dissolve") hold = null;

  switch (id) {
    case "arrive": {
      const t = ease(u);
      return {
        ...none,
        at: { x: lerp(entry.x, home.x, t), y: lerp(entry.y, home.y, t), z: lerp(entry.z, home.z, t) },
        phase: id,
      };
    }
    case "scan": {
      // Phones: a tapped card overrides the script for a moment.
      const it = droneState.interest;
      if (droneState.mobile && it.card && it.until > now) {
        const c = cardIntent(it.card, true);
        if (c) return { ...none, ...c, phase: id };
      }
      const order = MISSION.scanOrder;
      const k = Math.min(order.length - 1, Math.floor(u * order.length));
      const local = u * order.length - k;
      const c = cardIntent(order[k], local >= MISSION.beamAt);
      return { ...none, ...(c ?? { at: home }), phase: id };
    }
    case "globe":
      return { ...none, at: centre, globe: u > 0.1, phase: id };
    case "free":
      return { ...none, ...free(true), phase: id };
    case "dissolve": {
      if (!hold) hold = { ...stageSpot(stage) };
      return { ...none, at: hold, dissolve: u, phase: id };
    }
  }
}

function stageSpot(stage: Stage): ScreenPoint {
  return { x: stage.drone.x, y: stage.drone.y, z: FLIGHT.z };
}

/** Keep a small distance from the cursor, on the side the drone is coming from. */
function follow(stage: Stage): ScreenPoint {
  const p = droneState.pointer;
  const dx = stage.drone.x - p.x;
  const dy = stage.drone.y - p.y;
  const dist = Math.hypot(dx, dy) || 1;
  const keep = Math.min(dist, 110);
  return { x: p.x + (dx / dist) * keep, y: p.y + (dy / dist) * keep, z: FLIGHT.z };
}

/** A lazy figure-eight over the dashboard (one loop every ~14s). */
function patrol(stage: Stage, now: number): ScreenPoint {
  const t = (now / 1000) * ((Math.PI * 2) / 14);
  return {
    x: stage.w * (0.5 + 0.3 * Math.sin(t)),
    y: stage.h * (0.58 + 0.16 * Math.sin(2 * t)),
    z: FLIGHT.z + 0.25 * Math.cos(t),
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

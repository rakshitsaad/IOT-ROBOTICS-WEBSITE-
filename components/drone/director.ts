import { MISSION, type MissionCardId } from "@/lib/mission";
import { FLIGHT } from "./config";
import { droneState, type ScreenPoint } from "./store";

/**
 * The director (/lab/drone bench): each frame, turns the bench's buttons (droneState.manual) and the visitor's input
 * into an intent: where the drone should be, which card it scans, whether the globe shows, how far it has dissolved.
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
  phase: "manual";
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

export function direct(stage: Stage, now: number): Intent {
  const { w, h } = stage;
  const home: ScreenPoint = { x: w * 0.62, y: h * 0.42, z: FLIGHT.z + 0.3 };
  const centre: ScreenPoint = { x: w * 0.5, y: h * 0.72, z: FLIGHT.z + 0.4 };

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

  const m = droneState.manual;
  const g = m.goal;
  let base: Omit<Intent, "phase" | "dissolve" | "globe"> = { at: home, scan: null, card: null };
  if (g.kind === "card") base = cardIntent(g.card, g.scan) ?? base;
  else if (g.kind === "center") base = { at: centre, scan: null, card: null };
  else if (g.kind === "follow") base = free(true);
  else if (g.kind === "patrol") base = { at: patrol(stage, now), scan: null, card: null };
  if (m.globe) base = { ...base, at: centre, scan: null, card: null };
  return { ...base, globe: m.globe, dissolve: droneState.dissolve, phase: "manual" };
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

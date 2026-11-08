import { create } from "zustand";
import type { MissionCardId } from "@/lib/mission";

/**
 * Drone state. Two halves, like the robot (§11):
 * - `droneState`: a plain mutable object read every frame by the rig (never React state).
 * - `useDroneStore`: the little the DOM needs (which card is being scanned, and a key per card so its numbers
 *   re-count), as zustand.
 * `droneActions` drive both and are safe to call before the canvas mounts.
 */

/** Where the drone should be, in "screen" terms: px inside the stage, plus depth (world z). */
export type ScreenPoint = { x: number; y: number; z: number };

export type ManualGoal =
  | { kind: "home" }
  | { kind: "card"; card: MissionCardId; scan: boolean }
  | { kind: "center" }
  | { kind: "follow" }
  | { kind: "patrol" };

export const droneState = {
  /** Phones: smaller drone, no globe, no free flight. */
  mobile: false,
  /** Fine pointer (mouse / trackpad): free flight follows the cursor. Touch: patrol + taps. */
  finePointer: true,
  /** The stage element (the canvas fills it) and its cards, for DOM → world mapping. */
  root: null as HTMLElement | null,
  /** Pointer in stage px; `moved` is the last move time (ms), `inside` whether it is over the stage. */
  pointer: { x: 0, y: 0, moved: 0, inside: false },
  /** A card the visitor is pointing at (hover) or tapped, and until when it holds the drone (ms). */
  interest: { card: null as MissionCardId | null, until: 0 },
  /** What the bench's buttons ask for (/lab/drone). */
  manual: { goal: { kind: "home" } as ManualGoal, globe: false },
  /** Dissolve amount, 0 (whole) – 1 (gone); the bench tweens it. */
  dissolve: 0,
  /** Bumped by flip(); the rig plays one flip + burst per bump. */
  flipKey: 0,
  /** Written by the rig every frame: the drone's centre and radius in stage px (the click target follows it). */
  screen: { x: -999, y: -999, r: 0 },
  /** Written by the rig: smoothed speed (units/s), for /lab/drone. */
  speed: 0,
  /** Written by the rig: live trail particle count, for /lab/drone. */
  particles: 0,
  /** Written by the rig: current tilt from motion, in degrees (capped at 20), for /lab/drone. */
  tilt: 0,
};

interface DroneStore {
  /** The card under the beam right now (lifted, glowing border), or null. */
  scanning: MissionCardId | null;
  /** Bumped each time a card starts being scanned: its numbers re-count from 0. */
  scanKeys: Partial<Record<MissionCardId, number>>;
  /** Hologram globe showing (for the caption). */
  globe: boolean;
  setScanning: (card: MissionCardId | null) => void;
  setGlobe: (on: boolean) => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
  scanning: null,
  scanKeys: {},
  globe: false,
  setScanning: (card) =>
    set((s) =>
      s.scanning === card
        ? s
        : {
            scanning: card,
            scanKeys: card ? { ...s.scanKeys, [card]: (s.scanKeys[card] ?? 0) + 1 } : s.scanKeys,
          },
    ),
  setGlobe: (globe) => set((s) => (s.globe === globe ? s : { globe })),
}));

export const droneActions = {
  /** Fly over a card (no beam). */
  flyTo(card: MissionCardId) {
    droneState.manual.goal = { kind: "card", card, scan: false };
  },
  /** Fly over a card and scan it: beam on once it arrives, the card lifts and its numbers re-count. */
  scan(card: MissionCardId) {
    droneState.manual.goal = { kind: "card", card, scan: true };
  },
  /** Rise to the centre and project the hologram globe (or put it away). */
  globe(on: boolean) {
    droneState.manual.globe = on;
    if (on) droneState.manual.goal = { kind: "center" };
  },
  follow() {
    droneState.manual.goal = { kind: "follow" };
  },
  patrol() {
    droneState.manual.goal = { kind: "patrol" };
  },
  home() {
    droneState.manual = { goal: { kind: "home" }, globe: false };
  },
  /** A quick 360° roll with a particle burst (also on click). */
  flip() {
    droneState.flipKey++;
  },
  /** The pointer is over a card: the drone goes and scans it (in Follow mode). */
  hoverCard(card: MissionCardId) {
    droneState.interest = { card, until: Number.POSITIVE_INFINITY };
  },
  /** The pointer left the card: it keeps the drone for `holdMs` more. */
  leaveCard(holdMs: number) {
    if (droneState.interest.card) droneState.interest.until = performance.now() + holdMs;
  },
  /** A tap on a card (touch): scan it for `holdMs`. */
  tapCard(card: MissionCardId, holdMs: number) {
    droneState.interest = { card, until: performance.now() + holdMs };
  },
};

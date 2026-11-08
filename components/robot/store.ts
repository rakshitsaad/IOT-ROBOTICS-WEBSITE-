"use client";

import { create } from "zustand";
import type { BotIcon } from "./icons";

/**
 * Public API of the club robot. See DESIGN.md → Robot mascot.
 *
 * - useBotStore: discrete state (face, icon, tracking, gestures, glow, mood flags).
 * - botTransform / botInput: plain mutable objects for per-frame values
 *   (placement, gaze, scroll tilt). The robot reads them inside useFrame.
 *   Never mirror these values in React state.
 * - botScreen: the robot's on-screen box, written back by the robot.
 * - botActions: imperative helpers usable from anywhere.
 */

export type BotFace =
  | "idle"
  | "blink"
  | "happy"
  | "surprised"
  | "sleepy"
  | "wink"
  | "look-left"
  | "look-right";

export const BOT_FACES: BotFace[] = [
  "idle",
  "blink",
  "happy",
  "surprised",
  "sleepy",
  "wink",
  "look-left",
  "look-right",
];

export type BotGestureName = "wave" | "nod" | "bootUp" | "lookAt";
export type Vec3 = [x: number, y: number, z: number];

export interface BotGesture {
  name: BotGestureName;
  /** World-space target for lookAt. */
  point?: Vec3;
  /** How long lookAt holds before easing back (ms). */
  holdMs?: number;
  /** Increments on every call so repeating a gesture re-triggers it. */
  key: number;
}

export type BotIdleMoveKind = "tilt" | "glance";

/**
 * A face requested from outside the mood engine (e.g. a scroll moment).
 * useBotMood plays it as a top-priority reaction for holdMs, then resumes.
 */
export interface BotReaction {
  face: Exclude<BotFace, "blink">;
  holdMs: number;
  key: number;
}

/**
 * A resting state held by a page section (botActions.hold). While a scene is
 * held, useBotMood shows its face (and icon) instead of picking random moods;
 * blinks and visitor reactions still play on top and return to it.
 */
export interface BotScene {
  /** Who holds it; release(id) only clears a scene with the same id. */
  id: string;
  face: Exclude<BotFace, "blink">;
  icon: BotIcon | null;
}

export interface BotIdleMove {
  kind: BotIdleMoveKind;
  /** -1 = towards screen left, 1 = towards screen right. */
  dir: -1 | 1;
  key: number;
}

interface BotState {
  /** Persistent expression. "blink" is momentary: it plays and keeps the current face. */
  face: Exclude<BotFace, "blink">;
  /** Icon shown instead of the eyes, or null for the face. */
  icon: BotIcon | null;
  lookAtCursor: boolean;
  gesture: BotGesture | null;
  /** Last glow colour requested (CSS colour). */
  glowColor: string | null;
  /** Increments per glow request so the same colour can pulse again. */
  glowKey: number;
  /** Increments per requested blink. */
  blinkKey: number;
  /** Increments per bezel flash (a brief brightness burst, no tint). */
  flashKey: number;
  /**
   * The robot's built-in idle timers (blink every 2.5–5s, tilt/glance every
   * 6–10s). useBotMood turns this off and drives blinks and idle moves itself.
   */
  ambient: boolean;
  /** Last requested idle move (tilt or glance). */
  idleMove: BotIdleMove | null;
  /** Asleep: head droops slowly, screen dims, tracking fades out. */
  asleep: boolean;
  /** True while bootUp plays (set by the robot). */
  booting: boolean;
  /** Pointer is over the robot (set by BotStage's hit area). */
  hovered: boolean;
  /** Increments when the robot is clicked or tapped (BotStage's hit area). */
  pokeKey: number;
  /** Increments on nudge(): counts as visitor activity for the mood engine (wakes the robot, restarts its sleep timer). */
  nudgeKey: number;
  /** Last reaction requested with react() (played by useBotMood). */
  reaction: BotReaction | null;
  /** Resting state held by a page section, or null (random moods). */
  scene: BotScene | null;

  setFace: (face: BotFace) => void;
  setIcon: (icon: BotIcon | null) => void;
  setLookAtCursor: (on: boolean) => void;
  setGesture: (name: BotGestureName, options?: { point?: Vec3; holdMs?: number }) => void;
  setGlowColor: (color: string) => void;
  flash: () => void;
  setAmbient: (on: boolean) => void;
  setIdleMove: (kind: BotIdleMoveKind, dir: -1 | 1) => void;
  setAsleep: (asleep: boolean) => void;
  setHovered: (hovered: boolean) => void;
  poke: () => void;
  nudge: () => void;
  react: (face: Exclude<BotFace, "blink">, holdMs?: number) => void;
  setScene: (scene: BotScene | null) => void;
}

export const useBotStore = create<BotState>((set) => ({
  face: "idle",
  icon: null,
  lookAtCursor: false,
  gesture: null,
  glowColor: null,
  glowKey: 0,
  blinkKey: 0,
  flashKey: 0,
  ambient: true,
  idleMove: null,
  asleep: false,
  booting: false,
  hovered: false,
  pokeKey: 0,
  nudgeKey: 0,
  reaction: null,
  scene: null,

  setFace: (face) =>
    face === "blink"
      ? set((s) => ({ blinkKey: s.blinkKey + 1 }))
      : set({ face, icon: null }),
  setIcon: (icon) => set({ icon }),
  setLookAtCursor: (lookAtCursor) => set({ lookAtCursor }),
  setGesture: (name, options) =>
    set((s) => ({ gesture: { name, ...options, key: (s.gesture?.key ?? 0) + 1 } })),
  setGlowColor: (glowColor) => set((s) => ({ glowColor, glowKey: s.glowKey + 1 })),
  flash: () => set((s) => ({ flashKey: s.flashKey + 1 })),
  setAmbient: (ambient) => set({ ambient }),
  setIdleMove: (kind, dir) => set((s) => ({ idleMove: { kind, dir, key: (s.idleMove?.key ?? 0) + 1 } })),
  setAsleep: (asleep) => set({ asleep }),
  setHovered: (hovered) => set({ hovered }),
  poke: () => set((s) => ({ pokeKey: s.pokeKey + 1 })),
  nudge: () => set((s) => ({ nudgeKey: s.nudgeKey + 1 })),
  react: (face, holdMs = 1200) => set((s) => ({ reaction: { face, holdMs, key: (s.reaction?.key ?? 0) + 1 } })),
  setScene: (scene) => set({ scene }),
}));

/**
 * Placement of the whole robot (base included), in world units / radians.
 * Tween it with GSAP, e.g. gsap.to(botTransform, { x: 1.5, scrollTrigger: {...} }).
 * Default framing: the robot stands centred with its base at y = 0.
 */
export const botTransform = {
  x: 0,
  y: 0,
  z: 0,
  rotX: 0,
  rotY: 0,
  scale: 1,
};

export type BotTransform = typeof botTransform;

export const BOT_TRANSFORM_DEFAULT: Readonly<BotTransform> = { ...botTransform };

/**
 * Continuous inputs for the robot, written by useBotMood (or your own code)
 * and damped by the robot every frame.
 */
export const botInput = {
  /** Extra head pitch in radians, + looks down (e.g. watching content as the page scrolls). */
  pitch: 0,
  /**
   * Where to look when there is no cursor to track (touch wander, device
   * tilt). x right / y down, ±1 = the head's limit (25° / 15°); beyond ±1
   * only the eyes go further. `slow` uses lazy damping for looking around.
   */
  gaze: { x: 0, y: 0, active: false, slow: false },
  /**
   * A world point the head follows while `active`, above the cursor (below an explicit lookAt). The home sidekick
   * drone sets it during stunts near the robot, so the robot watches it instead of the cursor.
   */
  look: { x: 0, y: 0, z: 0, active: false },
};

/**
 * Where the robot's head is, in world units, written by the robot every rendered frame (so it follows botTransform,
 * the cursor turn and the sleep droop): the head's centre, the screen's front face, and the top of the head (between
 * the ears). `scale` is botTransform.scale. The home sidekick drone orbits, boops and lands on these.
 */
export const botAnchors = {
  head: { x: 0, y: 0, z: 0 },
  face: { x: 0, y: 0, z: 0 },
  top: { x: 0, y: 0, z: 0 },
  scale: 1,
  valid: false,
};

/**
 * The robot's on-screen box (head + body, without the dock) in px relative
 * to its stage. Written by the robot every rendered frame; BotStage places
 * its invisible hit area on it.
 */
export const botScreen = { x: 0, y: 0, w: 0, h: 0, valid: false };

/** Imperative helpers. Safe to call before the robot has mounted. */
export const botActions = {
  wave: () => useBotStore.getState().setGesture("wave"),
  nod: () => useBotStore.getState().setGesture("nod"),
  bootUp: () => useBotStore.getState().setGesture("bootUp"),
  lookAt: (point: Vec3, holdMs = 2500) =>
    useBotStore.getState().setGesture("lookAt", { point, holdMs }),
  blink: () => useBotStore.getState().setFace("blink"),
  setFace: (face: BotFace) => useBotStore.getState().setFace(face),
  setIcon: (icon: BotIcon | null) => useBotStore.getState().setIcon(icon),
  glow: (color: string) => useBotStore.getState().setGlowColor(color),
  flash: () => useBotStore.getState().flash(),
  track: (on: boolean) => useBotStore.getState().setLookAtCursor(on),
  sleep: (asleep: boolean) => useBotStore.getState().setAsleep(asleep),
  idleMove: (kind: BotIdleMoveKind, dir: -1 | 1) => useBotStore.getState().setIdleMove(kind, dir),
  poke: () => useBotStore.getState().poke(),
  /** Wake the robot as if the visitor had moved (needs useBotMood); the home sidekick does this before its robot stunts. */
  nudge: () => useBotStore.getState().nudge(),
  /** Show a face for holdMs, above moods and the engine's own reactions (needs useBotMood). */
  react: (face: Exclude<BotFace, "blink">, holdMs = 1200) => useBotStore.getState().react(face, holdMs),
  /**
   * Hold a resting face (and optional icon) for a page section, instead of
   * random moods (needs useBotMood). Blinks and reactions still play on top.
   */
  hold: (id: string, face: Exclude<BotFace, "blink"> = "idle", icon: BotIcon | null = null) => {
    const s = useBotStore.getState();
    const cur = s.scene;
    if (cur && cur.id === id && cur.face === face && cur.icon === icon) return;
    s.setScene({ id, face, icon });
  },
  /** Drop the held scene (only if `id` holds it, when given) and go back to random moods. */
  release: (id?: string) => {
    const s = useBotStore.getState();
    if (s.scene && (!id || s.scene.id === id)) s.setScene(null);
  },
};

"use client";

import { useEffect } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { botInput, useBotStore, type BotFace } from "./store";
import type { BotIcon } from "./icons";

/**
 * The robot's "brain". Mount it once on a page that shows the robot
 * (alongside <BotStage />); it drives useBotStore and botInput, and the
 * robot's body (ClubBot) plays whatever it asks for.
 *
 * - Blinks on its own timer (2.5–5s), always.
 * - Every 4–8s picks a weighted random expression, holds it 1.5–3s, then
 *   returns to idle (never the same pick twice in a row).
 * - Every 6–10s asks for a head tilt or a side glance.
 * - Reacts to the visitor (these interrupt the random moods): fast cursor,
 *   cursor still for 8s (falls asleep), hover, click, cursor leaving the
 *   window, scrolling.
 * - Plays faces requested with botActions.react() (scroll moments) above
 *   everything else while they last.
 * - While a section holds a scene (botActions.hold), shows its face and icon
 *   instead of random moods; reactions play on top and return to it. A scene
 *   with an icon keeps it through hover, wake-ups, glances and sleep (dimmed);
 *   only pokes and react() cues replace it while they last.
 * - Mouse/trackpad: follows the cursor. Touch: looks around by itself, or
 *   follows device tilt when the phone provides it.
 * - Reduced motion: no tracking, no moods, no reactions; slow blinks only.
 */

type MoodFace = Exclude<BotFace, "blink">;

/** Random mood weights (sum to 1). */
export const BOT_MOOD_WEIGHTS: readonly (readonly [MoodFace, number])[] = [
  ["idle", 0.4],
  ["happy", 0.2],
  ["look-left", 0.1],
  ["look-right", 0.1],
  ["wink", 0.08],
  ["surprised", 0.07],
  ["sleepy", 0.05],
];

/** Timings in seconds ([min, max] ranges are picked at random). */
export const BOT_MOOD_TIMING = {
  blink: [2.5, 5],
  slowBlink: [5, 9],
  moodEvery: [4, 8],
  moodHold: [1.5, 3],
  idleMoveEvery: [6, 10],
  /** Cursor still this long → asleep. */
  sleepAfter: 8,
  /** Look-around target changes on touch devices. */
  wanderEvery: [2.5, 4.5],
} as const;

/**
 * Reaction priorities: a reaction only interrupts one of equal or lower
 * priority. `cue` is botActions.react() (scroll moments): it wins while it lasts.
 */
const PRIORITY = { glance: 1, wake: 2, poke: 3, cue: 4 } as const;

export function useBotMood({ enabled = true }: { enabled?: boolean } = {}) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!enabled) return;
    return reduced || prefersReducedMotion() ? startCalm() : startMoodEngine();
  }, [enabled, reduced]);
}

/* ------------------------------------------------------- reduced motion */

function startCalm() {
  const store = useBotStore;
  const prevAmbient = store.getState().ambient;
  store.setState({ ambient: false, asleep: false, lookAtCursor: false, face: "idle", icon: null });
  let timer = 0;
  const loop = () => {
    store.getState().setFace("blink");
    timer = window.setTimeout(loop, rand(BOT_MOOD_TIMING.slowBlink) * 1000);
  };
  timer = window.setTimeout(loop, rand(BOT_MOOD_TIMING.slowBlink) * 1000);
  return () => {
    window.clearTimeout(timer);
    store.setState({ ambient: prevAmbient });
  };
}

/* ----------------------------------------------------------- full engine */

interface Step {
  face: MoodFace;
  until: number;
}

function startMoodEngine() {
  const store = useBotStore;
  const clock = () => performance.now() / 1000;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const prevAmbient = store.getState().ambient;
  store.setState({ ambient: false, asleep: false, icon: null, lookAtCursor: fine });

  const t0 = clock();
  const st = {
    reaction: null as { steps: Step[]; priority: number } | null,
    mood: null as Step | null,
    lastPick: null as MoodFace | null,
    nextMood: t0 + rand(BOT_MOOD_TIMING.moodEvery),
    nextBlink: t0 + rand(BOT_MOOD_TIMING.blink),
    nextIdle: t0 + rand(BOT_MOOD_TIMING.idleMoveEvery),
    nextWander: t0 + 1,
    lastActive: t0,
    asleep: false,
    lastFast: -Infinity,
    lastNod: -Infinity,
    lastPoke: -Infinity,
    speed: 0,
    lastX: 0,
    lastY: 0,
    lastTs: 0,
    tiltAt: -Infinity,
    tiltBase: null as number | null,
    askedTilt: false,
  };

  const reactionFace = (t: number) => st.reaction?.steps.find((s) => t < s.until)?.face ?? null;

  /** Resolves which face (and icon) should show right now and writes it to the store. */
  const apply = () => {
    const s = store.getState();
    if (s.booting) return; // the boot sequence owns the screen
    const t = clock();
    const scene = s.scene;
    let face: MoodFace;
    let icon: BotIcon | null = null;
    const keepIcon = Boolean(scene?.icon);
    let reaction = reactionFace(t);
    if (reaction && keepIcon && (st.reaction?.priority ?? 0) < PRIORITY.poke) reaction = null;
    if (st.asleep && !keepIcon) face = "sleepy";
    else if (reaction && !st.asleep) face = reaction;
    else if (s.hovered && !st.asleep && !keepIcon) face = "happy";
    else if (scene) {
      face = scene.face;
      icon = scene.icon;
    } else face = st.mood && t < st.mood.until ? st.mood.face : "idle";
    if (s.face !== face || s.icon !== icon) store.setState({ face, icon });
  };

  /** Plays a sequence of faces, interrupting moods and weaker reactions. */
  const react = (seq: [MoodFace, number][], priority: number) => {
    const t = clock();
    if (reactionFace(t) && st.reaction && st.reaction.priority > priority) return;
    let at = t;
    st.reaction = { priority, steps: seq.map(([face, d]) => ({ face, until: (at += d) })) };
    st.mood = null;
    apply();
  };

  const fallAsleep = () => {
    st.asleep = true;
    st.reaction = null;
    st.mood = null;
    store.getState().setAsleep(true);
    apply();
  };

  const wake = () => {
    st.asleep = false;
    store.getState().setAsleep(false);
    react(
      [
        ["surprised", 0.9],
        ["happy", 1.6],
      ],
      PRIORITY.wake,
    );
  };

  const activity = () => {
    st.lastActive = clock();
    if (st.asleep) wake();
  };

  /* ---- timers */
  const tick = () => {
    const t = clock();
    const s = store.getState();

    if (t >= st.nextBlink) {
      s.setFace("blink"); // momentary; the robot only blinks open-eyed faces
      st.nextBlink = t + rand(BOT_MOOD_TIMING.blink);
    }
    if (s.booting) return;

    if (fine && !st.asleep && t - st.lastActive > BOT_MOOD_TIMING.sleepAfter) fallAsleep();

    if (t >= st.nextIdle) {
      st.nextIdle = t + rand(BOT_MOOD_TIMING.idleMoveEvery);
      if (!st.asleep) s.setIdleMove(Math.random() < 0.5 ? "tilt" : "glance", Math.random() < 0.5 ? -1 : 1);
    }

    if (t >= st.nextMood) {
      st.nextMood = t + rand(BOT_MOOD_TIMING.moodEvery);
      if (!st.asleep && !reactionFace(t) && !s.hovered && !s.scene) {
        const face = pickMood(st.lastPick);
        st.lastPick = face;
        st.mood = { face, until: t + rand(BOT_MOOD_TIMING.moodHold) };
      }
    }

    if (!fine) wander(t);
    apply();
  };

  /* ---- touch: look around, or follow device tilt */
  const wander = (t: number) => {
    if (t - st.tiltAt < 1 || t < st.nextWander) return;
    st.nextWander = t + rand(BOT_MOOD_TIMING.wanderEvery);
    const atYou = Math.random() < 0.3;
    botInput.gaze.x = atYou ? 0 : rand([-0.9, 0.9]);
    botInput.gaze.y = atYou ? 0.1 : rand([-0.5, 0.5]);
    botInput.gaze.slow = true;
    botInput.gaze.active = true;
  };

  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    st.tiltAt = clock();
    st.tiltBase ??= e.beta;
    st.tiltBase += (e.beta - st.tiltBase) * 0.01; // slowly re-centre on how the phone is held
    botInput.gaze.x = clamp(e.gamma / 25, -1.5, 1.5);
    botInput.gaze.y = clamp((e.beta - st.tiltBase) / 20, -1.5, 1.5);
    botInput.gaze.slow = false;
    botInput.gaze.active = true;
  };

  /** iOS only reports tilt after the visitor allows it; ask on their first tap on the robot. */
  const requestTilt = () => {
    if (st.askedTilt) return;
    st.askedTilt = true;
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    DOE?.requestPermission?.().catch(() => {});
  };

  /* ---- visitor input */
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const dt = (e.timeStamp - st.lastTs) / 1000;
    const v = dt > 0 && dt < 0.1 ? Math.hypot(e.clientX - st.lastX, e.clientY - st.lastY) / dt : 0;
    st.speed = dt > 0 && dt < 0.1 ? st.speed * 0.5 + v * 0.5 : 0;
    st.lastX = e.clientX;
    st.lastY = e.clientY;
    st.lastTs = e.timeStamp;
    activity();

    const t = clock();
    const fast = Math.max(2800, window.innerWidth * 2.2); // px/s
    if (st.speed > fast && t - st.lastFast > 3 && !store.getState().booting) {
      st.lastFast = t;
      react([["surprised", 1]], PRIORITY.glance);
    }
  };

  // Cursor left the window: look towards that edge for 2s (the head follows
  // in ClubBot), then back to idle.
  const onOut = (e: MouseEvent) => {
    if (e.relatedTarget || !fine || store.getState().booting) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const d = [e.clientX, W - e.clientX, e.clientY, H - e.clientY];
    const edge = d.indexOf(Math.min(...d));
    react([[edge === 0 ? "look-left" : edge === 1 ? "look-right" : "idle", 2]], PRIORITY.glance);
  };

  // Scrolled down: watch the content (head tilts down a little).
  const onScroll = () => {
    activity();
    botInput.pitch = Math.min(window.scrollY / (window.innerHeight * 0.9), 1) * 0.2;
  };

  const poke = () => {
    const t = clock();
    if (t - st.lastPoke < 0.6 || store.getState().booting) return;
    st.lastPoke = t;
    st.lastActive = t;
    if (st.asleep) {
      st.asleep = false;
      store.getState().setAsleep(false);
    }
    react([["wink", 1.6]], PRIORITY.poke);
    const s = store.getState();
    s.setGesture("wave");
    s.flash();
    if (!fine) requestTilt();
  };

  const unsubscribe = store.subscribe((s, prev) => {
    if (s.booting !== prev.booting) {
      if (s.booting) {
        st.reaction = null;
        st.mood = null;
        s.setFace("happy"); // shown when the boot sequence ends
      } else {
        const t = clock();
        st.lastActive = t;
        st.nextMood = t + rand(BOT_MOOD_TIMING.moodEvery);
        react([["happy", 1.8]], PRIORITY.wake);
      }
    }
    if (s.hovered !== prev.hovered) {
      if (s.hovered && !s.booting) {
        activity();
        st.mood = null;
        const t = clock();
        if (t - st.lastNod > 3) {
          st.lastNod = t;
          s.setGesture("nod");
        }
      }
      apply();
    }
    if (s.pokeKey !== prev.pokeKey) poke();
    if (s.scene !== prev.scene) {
      st.mood = null;
      apply();
    }
    if (s.reaction && s.reaction !== prev.reaction) {
      react([[s.reaction.face, s.reaction.holdMs / 1000]], PRIORITY.cue);
    }
  });

  const interval = window.setInterval(tick, 100);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", activity, { passive: true });
  window.addEventListener("keydown", activity);
  window.addEventListener("pointerdown", activity, { passive: true });
  document.addEventListener("mouseout", onOut);
  if (!fine) window.addEventListener("deviceorientation", onOrient);
  onScroll();
  apply();

  return () => {
    window.clearInterval(interval);
    unsubscribe();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", activity);
    window.removeEventListener("keydown", activity);
    window.removeEventListener("pointerdown", activity);
    document.removeEventListener("mouseout", onOut);
    window.removeEventListener("deviceorientation", onOrient);
    botInput.pitch = 0;
    botInput.gaze.active = false;
    store.setState({ ambient: prevAmbient, asleep: false, lookAtCursor: false });
    store.getState().setFace("idle");
  };
}

/* --------------------------------------------------------------- helpers */

/** Weighted random expression, never the same as `previous`. */
function pickMood(previous: MoodFace | null): MoodFace {
  const options = BOT_MOOD_WEIGHTS.filter(([face]) => face !== previous);
  const total = options.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [face, w] of options) {
    r -= w;
    if (r <= 0) return face;
  }
  return options[options.length - 1][0];
}

function rand([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

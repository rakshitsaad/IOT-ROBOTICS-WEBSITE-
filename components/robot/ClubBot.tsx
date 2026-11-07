"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { FaceDisplay, seeded, type FaceFrame } from "./face";
import { PrimitiveRobot } from "./geometry";
import type { BotRig } from "./rig";
import {
  botInput,
  botScreen,
  botTransform,
  useBotStore,
  type BotFace,
  type BotGesture,
  type BotIdleMoveKind,
} from "./store";

/**
 * The club robot: model + behaviour. Render it inside an R3F <Canvas>
 * (normally via <BotStage />). All per-frame values live in a mutable
 * runtime object read in useFrame, never in React state.
 *
 * This is the "body": it plays what the store and botInput ask for. The
 * "brain" that decides moods and reactions is useBotMood.
 */

const DEG = Math.PI / 180;
const MAX_YAW = 25 * DEG;
const MAX_PITCH = 15 * DEG;
/** Eyes shift up to 12% of the screen width (and 7% of its height) towards the target. */
const EYE_MAX_X = 0.12;
const EYE_MAX_Y = 0.07;
/** Eyes reach their limit at 1.5× the head's range, so they keep looking once the head stops. */
const EYE_REACH = 1.5;
const GLITCH_S = 0.12;
const BLINK_S = 0.16;
const FLOAT_PERIOD = 3;
/** Seconds the head keeps looking at the edge where the cursor left the window. */
const AWAY_HOLD_S = 2;
const OPEN_EYED: BotFace[] = ["idle", "look-left", "look-right", "surprised", "wink"];

/** Points (in head / body space) whose projection gives the robot's on-screen box. */
const HEAD_BOX: [number, number, number][] = [
  [-0.66, 0, 0.45],
  [0.66, 0, 0.45],
  [-0.66, 1.0, 0.45],
  [0.66, 1.0, 0.45],
];
const BODY_BOX: [number, number, number][] = [
  [-0.32, 0.11, 0.15],
  [0.32, 0.11, 0.15],
];

interface ClubBotProps {
  /** Chest plate logo (missing file → plain plate). */
  logoUrl?: string;
  /** Play the boot-up sequence when the robot first appears. */
  bootOnMount?: boolean;
}

export function ClubBot({ logoUrl, bootOnMount = false }: ClubBotProps) {
  const wrapper = useRef<THREE.Group>(null);
  const rigRef = useRef<BotRig | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  /* ------------------------------------------------ setup / subscriptions */
  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;
    const S = createRuntime();
    runtime.current = S;
    const now = () => performance.now() / 1000;

    // Screen: face canvas as the emissive map.
    S.display = new FaceDisplay();
    rig.materials.screen.emissiveMap = S.display.texture;
    rig.materials.screen.needsUpdate = true;

    // Bezel: shader hook so glowColor can tint + brighten it.
    const bezel = rig.materials.bezel;
    bezel.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, S.glowUniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform vec3 uGlowColor;\nuniform float uGlowAmount;\nuniform float uGlowBoost;",
        )
        .replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\ntotalEmissiveRadiance = mix(totalEmissiveRadiance, uGlowColor * uGlowBoost, uGlowAmount);",
        );
    };
    bezel.customProgramCacheKey = () => "clubbot-bezel-glow";
    bezel.needsUpdate = true;

    rig.head.rotation.order = "YXZ";
    S.nextBlink = now() + 2;
    S.nextIdle = now() + 5;

    // Pointer, read from window because the canvas ignores pointer events.
    const onMove = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      S.pointer.x = e.clientX - r.left;
      S.pointer.y = e.clientY - r.top;
      S.pointer.has = true;
      S.pointer.away = false;
    };
    // Cursor left the window: keep looking past the edge it crossed for a moment.
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget || !S.pointer.has) return;
      const r = gl.domElement.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;
      let x = e.clientX;
      let y = e.clientY;
      const d = [x, W - x, y, H - y];
      const edge = d.indexOf(Math.min(...d));
      if (edge === 0) x = -0.35 * W;
      else if (edge === 1) x = 1.35 * W;
      else if (edge === 2) y = -0.35 * H;
      else y = 1.35 * H;
      S.pointer.x = x - r.left;
      S.pointer.y = y - r.top;
      S.pointer.away = true;
      S.pointer.awayUntil = now() + AWAY_HOLD_S;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut);

    const initial = useBotStore.getState();
    if (initial.asleep) S.sleep.v = 1;

    const unsubscribe = useBotStore.subscribe((s, prev) => {
      const still = prefersReducedMotion();
      if (s.glowKey !== prev.glowKey && s.glowColor) glow(S, s.glowColor);
      if (s.flashKey !== prev.flashKey) flash(S);
      if (s.blinkKey !== prev.blinkKey) startBlink(S, now(), true);
      if (s.asleep !== prev.asleep) setSleep(S, s.asleep, still);
      if (s.idleMove && s.idleMove !== prev.idleMove && !still) {
        // While the head is following something, a glance would fight it: tilt instead.
        idleMove(S, isBusy(S, s.lookAtCursor) ? "tilt" : s.idleMove.kind, s.idleMove.dir);
      }
      // Reduced motion: final states only, so gestures other than lookAt are skipped.
      if (s.gesture && s.gesture !== prev.gesture && (s.gesture.name === "lookAt" || !still)) {
        runGesture(S, s.gesture, now());
      }
    });

    if (bootOnMount && !prefersReducedMotion()) runGesture(S, { name: "bootUp", key: 0 }, now());

    return () => {
      unsubscribe();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      S.timelines.forEach((tl) => tl.kill());
      S.timelines.clear();
      if (useBotStore.getState().booting) useBotStore.setState({ booting: false });
      botScreen.valid = false;
      rig.materials.screen.emissiveMap = null;
      rig.materials.screen.needsUpdate = true;
      bezel.onBeforeCompile = () => {};
      bezel.needsUpdate = true;
      S.display?.dispose();
      runtime.current = null;
    };
  }, [gl, bootOnMount]);

  /* ------------------------------------------------------------ per frame */
  useFrame((state, rawDelta) => {
    const rig = rigRef.current;
    const S = runtime.current;
    const w = wrapper.current;
    if (!rig || !S || !w) return;

    const dt = Math.min(rawDelta, 0.1);
    const t = state.clock.elapsedTime;
    const now = performance.now() / 1000;
    const still = prefersReducedMotion();
    const store = useBotStore.getState();
    const damp = THREE.MathUtils.damp;

    // Placement from botTransform (tweened by GSAP elsewhere).
    w.position.set(botTransform.x, botTransform.y, botTransform.z);
    w.rotation.set(botTransform.rotX, botTransform.rotY, 0);
    w.scale.setScalar(botTransform.scale);

    // Built-in idle timers (off while useBotMood drives the robot).
    if (!still && store.ambient) {
      if (now > S.nextBlink) {
        startBlink(S, now, false);
        S.nextBlink = now + 2.5 + S.random() * 2.5;
      }
      if (now > S.nextIdle) {
        const kind = isBusy(S, store.lookAtCursor) || S.random() < 0.5 ? "tilt" : "glance";
        idleMove(S, kind, S.random() < 0.5 ? -1 : 1);
        S.nextIdle = now + 6 + S.random() * 4;
      }
    }

    // Look target as a fraction of the head's range (±1 = 25° / 15°):
    // explicit lookAt > cursor (or the edge it left by) > gaze input > idle glance.
    let nx = 0;
    let ny = 0;
    let slow = false;
    const P = S.pointer;
    if (P.away && now > P.awayUntil) {
      P.has = false;
      P.away = false;
    }
    const headPos = rig.head.localToWorld(S.tmp.a.set(0, 0.5, 0.45));
    if (S.look.target && now < S.look.until) {
      const d = S.tmp.b.copy(S.look.target).sub(headPos);
      nx = (Math.atan2(d.x, d.z) - botTransform.rotY) / MAX_YAW;
      ny = -Math.atan2(d.y, Math.hypot(d.x, d.z)) / MAX_PITCH;
    } else {
      S.look.target = null;
      if (store.lookAtCursor && P.has && !still) {
        const p = headPos.project(camera);
        const hx = ((p.x + 1) / 2) * state.size.width;
        const hy = ((1 - p.y) / 2) * state.size.height;
        nx = (P.x - hx) / (window.innerWidth * 0.5);
        ny = (P.y - hy) / (window.innerHeight * 0.5);
      } else if (botInput.gaze.active && !still) {
        nx = botInput.gaze.x;
        ny = botInput.gaze.y;
        slow = botInput.gaze.slow;
      } else {
        nx = S.idle.yaw / MAX_YAW;
      }
    }

    // Asleep: tracking fades out while the head droops.
    const sleep = S.sleep.v;
    nx *= 1 - sleep;
    ny *= 1 - sleep;

    const yawT = clamp(nx, -1, 1) * MAX_YAW;
    const pitchT = clamp(ny, -1, 1) * MAX_PITCH;
    const headRate = slow ? 1.4 : 5;
    const bodyRate = slow ? 1.1 : 3.5;
    S.yaw = damp(S.yaw, yawT, headRate, dt);
    S.pitch = damp(S.pitch, pitchT, headRate, dt);
    S.bodyYaw = damp(S.bodyYaw, yawT * 0.3, bodyRate, dt);
    S.bodyPitch = damp(S.bodyPitch, pitchT * 0.3, bodyRate, dt);
    S.scrollPitch = damp(S.scrollPitch, still ? 0 : botInput.pitch, 3, dt);

    // Eyes: shift on the screen towards the target (texture offset, no redraw).
    const eyesFree = S.face.target.kind === "face";
    const ex = eyesFree ? clamp(nx / EYE_REACH, -1, 1) * EYE_MAX_X : 0;
    const ey = eyesFree ? clamp(ny / EYE_REACH, -1, 1) * EYE_MAX_Y : 0;
    S.eye.x = damp(S.eye.x, ex, slow ? 2 : 9, dt);
    S.eye.y = damp(S.eye.y, ey, slow ? 2 : 9, dt);
    S.display?.texture.offset.set(-S.eye.x, S.eye.y);

    // Body: float + 30% follow; slower, smaller breathing while asleep.
    const wave = still ? 0 : Math.sin((t * Math.PI * 2) / FLOAT_PERIOD);
    rig.body.position.y = rig.rest.bodyY + wave * 0.03 * (1 - 0.5 * sleep) + S.pose.bodyY - 0.03 * sleep;
    rig.body.rotation.set(S.bodyPitch, S.bodyYaw, 0);

    // Head: the rest of the turn, plus tilt, scroll watch, sleep droop and gestures.
    rig.head.rotation.set(
      S.pitch - S.bodyPitch + S.pose.headPitch + S.scrollPitch + 0.36 * sleep,
      S.yaw - S.bodyYaw,
      S.idle.roll + S.pose.headRoll + 0.09 * sleep,
    );

    // Arms: slight sway with the float, plus gesture offsets (right arm).
    const sway = still ? 0 : Math.sin(t * 1.1) * 0.025;
    rig.armL.shoulder.rotation.set(wave * 0.04, 0, rig.rest.armL.shoulderZ + sway);
    rig.armL.elbow.rotation.set(rig.rest.armL.elbowX, 0, 0);
    rig.armR.shoulder.rotation.set(-wave * 0.04 + S.pose.armRShoulderX, 0, rig.rest.armR.shoulderZ - sway + S.pose.armRShoulderZ);
    rig.armR.elbow.rotation.set(rig.rest.armR.elbowX + S.pose.armRElbowX, 0, S.pose.armRElbowZ);

    // Materials. Asleep dims the screen and bezel; a flash brightens the bezel.
    const m = rig.materials;
    const dim = 1 - 0.45 * sleep;
    const bezelPower = S.power.bezel * dim * (1 + 2.2 * S.flash.v);
    m.screen.emissiveIntensity = 1.15 * S.power.screen * (1 - 0.25 * sleep);
    m.bezel.emissiveIntensity = 0.75 * bezelPower;
    if (m.bezel.emissiveMap && !still) m.bezel.emissiveMap.offset.x = (t * 0.035) % 1;
    S.glowUniforms.uGlowAmount.value = S.glow.amount;
    S.glowUniforms.uGlowColor.value.copy(S.glow.color);
    S.glowUniforms.uGlowBoost.value = 1.6 * bezelPower;

    const phase = (t % 2) / 2; // antenna: "device online" pulse every 2s
    const pulse = still ? 0.3 : phase < 0.06 ? phase / 0.06 : Math.exp(-(phase - 0.06) * 9);
    m.antennaLed.emissiveIntensity = (0.2 + 2.8 * pulse) * S.power.bezel * dim;
    m.chestLeds.forEach((led, i) => {
      led.emissiveIntensity = (1.1 + (still ? 0 : 0.5 * Math.sin(t * 2.6 - i * 0.9))) * S.power.bezel * dim;
    });

    updateFace(S, store, now);
    writeScreenBox(rig, camera, state.size, S.tmp.a);
  });

  return (
    <group ref={wrapper}>
      <PrimitiveRobot rigRef={rigRef} logoUrl={logoUrl} />
      <ContactShadows position-y={-0.002} scale={3.2} resolution={256} blur={2.4} far={1.6} opacity={0.6} color="#000000" />
    </group>
  );
}

/* ======================================================================
   Runtime state
   ====================================================================== */

type Runtime = ReturnType<typeof createRuntime>;

function createRuntime() {
  const off = { kind: "off" } as FaceFrame;
  return {
    display: null as FaceDisplay | null,
    pointer: { x: 0, y: 0, has: false, away: false, awayUntil: 0 },
    yaw: 0,
    pitch: 0,
    bodyYaw: 0,
    bodyPitch: 0,
    scrollPitch: 0,
    eye: { x: 0, y: 0 },
    idle: { roll: 0, yaw: 0 },
    sleep: { v: 0 },
    flash: { v: 0 },
    pose: { armRShoulderZ: 0, armRShoulderX: 0, armRElbowX: 0, armRElbowZ: 0, headPitch: 0, headRoll: 0, bodyY: 0 },
    power: { screen: 1, bezel: 1 },
    glow: { amount: 0, color: new THREE.Color("#ffffff") },
    glowUniforms: {
      uGlowColor: { value: new THREE.Color("#ffffff") },
      uGlowAmount: { value: 0 },
      uGlowBoost: { value: 1.6 },
    },
    look: { target: null as THREE.Vector3 | null, until: 0 },
    face: {
      key: "off",
      target: off,
      shown: off,
      override: null as FaceFrame | null,
      glitchStart: -1,
      glitchFrom: off,
      lastGlitchDraw: 0,
      blinkStart: -1,
      lastOpen: 1,
      dirty: true,
      /** Next face change skips the glitch (boot: eyes opening). */
      skipGlitch: false,
      /** ...and starts with the eyes closed, opening them. */
      openEyes: false,
    },
    nextBlink: 0,
    nextIdle: 0,
    timelines: new Map<string, gsap.core.Timeline>(),
    random: seeded(Math.floor(Math.random() * 1e9)),
    tmp: { a: new THREE.Vector3(), b: new THREE.Vector3() },
  };
}

/** Starts a timeline on a named channel, killing whatever was playing there. */
function channel(S: Runtime, name: string) {
  S.timelines.get(name)?.kill();
  const tl = gsap.timeline({ onComplete: () => S.timelines.delete(name) });
  S.timelines.set(name, tl);
  return tl;
}

/** Is the head already following something (so a glance would fight it)? */
function isBusy(S: Runtime, tracking: boolean) {
  return (tracking && S.pointer.has) || botInput.gaze.active || S.look.target !== null;
}

/** Projects head + body corners and writes the robot's on-screen box (stage px). */
function writeScreenBox(rig: BotRig, camera: THREE.Camera, size: { width: number; height: number }, v: THREE.Vector3) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = (obj: THREE.Object3D, [x, y, z]: [number, number, number]) => {
    obj.localToWorld(v.set(x, y, z)).project(camera);
    const sx = ((v.x + 1) / 2) * size.width;
    const sy = ((1 - v.y) / 2) * size.height;
    x0 = Math.min(x0, sx);
    x1 = Math.max(x1, sx);
    y0 = Math.min(y0, sy);
    y1 = Math.max(y1, sy);
  };
  HEAD_BOX.forEach((p) => add(rig.head, p));
  BODY_BOX.forEach((p) => add(rig.body, p));
  botScreen.x = x0;
  botScreen.y = y0;
  botScreen.w = x1 - x0;
  botScreen.h = y1 - y0;
  botScreen.valid = true;
}

/* ======================================================================
   Face
   ====================================================================== */

function frameKey(f: FaceFrame) {
  if (f.kind === "icon") return `icon:${f.icon}`;
  if (f.kind === "face") return `face:${f.face}`;
  return f.kind;
}

function updateFace(S: Runtime, store: ReturnType<typeof useBotStore.getState>, now: number) {
  const F = S.face;
  const display = S.display;
  if (!display) return;

  const want: FaceFrame =
    F.override ?? (store.icon ? { kind: "icon", icon: store.icon } : { kind: "face", face: store.face });
  const key = frameKey(want);

  // Every change plays a 120ms glitch on the old face first.
  if (key !== F.key) {
    F.key = key;
    F.target = want;
    F.blinkStart = -1;
    if (F.skipGlitch || prefersReducedMotion()) {
      F.dirty = true;
      if (F.openEyes && want.kind === "face" && OPEN_EYED.includes(want.face)) F.blinkStart = now - BLINK_S / 2;
    } else {
      F.glitchFrom = F.shown;
      F.glitchStart = now;
    }
    F.skipGlitch = false;
    F.openEyes = false;
  }

  if (F.glitchStart >= 0) {
    const progress = (now - F.glitchStart) / GLITCH_S;
    if (progress < 1) {
      if (now - F.lastGlitchDraw > 0.028) {
        display.draw(F.glitchFrom, { progress, random: S.random });
        F.lastGlitchDraw = now;
      }
      return;
    }
    F.glitchStart = -1;
    F.dirty = true;
  }

  // Blink: 1 → ½ → closed → ½ → 1 (redraws only on step changes).
  let openness = 1;
  if (F.blinkStart >= 0) {
    const p = (now - F.blinkStart) / BLINK_S;
    if (p >= 1) F.blinkStart = -1;
    else openness = Math.round((1 - Math.sin(p * Math.PI)) * 2) / 2;
  }

  if (F.dirty || openness !== F.lastOpen) {
    const frame: FaceFrame = F.target.kind === "face" ? { ...F.target, openness } : F.target;
    display.draw(frame);
    F.shown = frame;
    F.dirty = false;
    F.lastOpen = openness;
  }
}

/** Blink (no glitch: it is an eyelid move, not a face change). */
function startBlink(S: Runtime, now: number, requested: boolean) {
  const F = S.face;
  if (F.glitchStart >= 0 || F.blinkStart >= 0) return;
  if (F.target.kind !== "face" || !OPEN_EYED.includes(F.target.face)) return;
  if (!requested && F.override) return;
  F.blinkStart = now;
}

/** Shows a frame immediately, skipping the glitch (boot only). */
function showNow(S: Runtime, frame: FaceFrame) {
  const F = S.face;
  F.override = frame;
  F.key = frameKey(frame);
  F.target = frame;
  F.shown = frame;
  F.glitchStart = -1;
  F.blinkStart = -1;
  S.display?.draw(frame);
}

/* ======================================================================
   Idle, sleep, glow, gestures
   ====================================================================== */

function idleMove(S: Runtime, kind: BotIdleMoveKind, dir: -1 | 1) {
  const tl = channel(S, "idle");
  if (kind === "tilt") {
    // Head tilt up to 10°.
    const roll = dir * (4 + S.random() * 6) * DEG;
    tl.to(S.idle, { roll, duration: 0.9, ease: "power3.inOut" }).to(
      S.idle,
      { roll: 0, duration: 1, ease: "power3.inOut" },
      "+=1.2",
    );
  } else {
    // Side glance: the head turns and the eyes follow (see the eye shift).
    tl.to(S.idle, { yaw: dir * 14 * DEG, duration: 0.8, ease: "power3.out" }).to(
      S.idle,
      { yaw: 0, duration: 0.9, ease: "power3.inOut" },
      "+=1.4",
    );
  }
}

function setSleep(S: Runtime, asleep: boolean, still: boolean) {
  const tl = channel(S, "sleep");
  if (still) tl.set(S.sleep, { v: asleep ? 1 : 0 });
  else if (asleep) tl.to(S.sleep, { v: 1, duration: 3.2, ease: "sine.inOut" });
  else tl.to(S.sleep, { v: 0, duration: 0.7, ease: "expo.out" });
}

function glow(S: Runtime, color: string) {
  S.glow.color.set(color);
  channel(S, "glow")
    .to(S.glow, { amount: 0.85, duration: 0.25, ease: "power3.out" })
    .to(S.glow, { amount: 0, duration: 1.2, ease: "power3.inOut" }, "+=0.35");
}

function flash(S: Runtime) {
  channel(S, "flash")
    .to(S.flash, { v: 1, duration: 0.07, ease: "power2.out" })
    .to(S.flash, { v: 0, duration: 0.9, ease: "power2.out" });
}

function runGesture(S: Runtime, g: BotGesture, now: number) {
  const P = S.pose;
  switch (g.name) {
    case "wave": {
      channel(S, "arm")
        .to(P, { armRShoulderZ: -2.35, armRShoulderX: -0.2, armRElbowX: 0.3, headRoll: 0.12, duration: 0.45, ease: "power3.out" })
        .to(P, { armRElbowZ: 0.4, duration: 0.16, ease: "sine.out" })
        .to(P, { armRElbowZ: -0.4, duration: 0.3, ease: "sine.inOut", repeat: 3, yoyo: true })
        .to(P, { armRElbowZ: 0, duration: 0.16, ease: "sine.in" })
        .to(P, { armRShoulderZ: 0, armRShoulderX: 0, armRElbowX: 0, headRoll: 0, duration: 0.6, ease: "power3.inOut" });
      break;
    }
    case "nod": {
      channel(S, "head")
        .to(P, { headPitch: 0.24, duration: 0.22, ease: "power2.inOut" })
        .to(P, { headPitch: -0.05, duration: 0.24, ease: "power2.inOut" })
        .to(P, { headPitch: 0.18, duration: 0.22, ease: "power2.inOut" })
        .to(P, { headPitch: 0, duration: 0.4, ease: "power3.out" });
      break;
    }
    case "bootUp": {
      // Screen off → scan line → flicker → eyes appear → eyes open → the
      // store's face (useBotMood sets "happy" so the boot ends smiling).
      const tl = channel(S, "boot");
      tl.call(() => {
        useBotStore.setState({ booting: true });
        showNow(S, { kind: "off" });
      })
        .set(S.power, { screen: 0, bezel: 0.04 }, 0)
        .set(P, { headPitch: 0.28, bodyY: -0.025 }, 0)
        .call(() => {
          S.face.override = { kind: "boot" };
        }, [], 0.3);
      // Flicker: [time, screen, bezel]
      const flicker: [number, number, number][] = [
        [0.36, 0.8, 0.3],
        [0.42, 0, 0.06],
        [0.5, 1, 0.5],
        [0.56, 0.15, 0.12],
        [0.66, 0.9, 0.7],
        [0.72, 0.3, 0.3],
        [0.8, 1, 0.85],
      ];
      flicker.forEach(([time, screen, bezel]) => tl.set(S.power, { screen, bezel }, time));
      tl.call(() => {
        S.face.override = { kind: "face", face: "blink" };
      }, [], 0.86)
        .to(S.power, { screen: 1, bezel: 1, duration: 0.5, ease: "power3.out" }, 0.86)
        .to(P, { headPitch: 0, bodyY: 0, duration: 0.9, ease: "expo.out" }, 0.9)
        .call(() => {
          S.face.override = { kind: "face", face: "idle" };
          S.face.skipGlitch = true;
          S.face.openEyes = true;
        }, [], 1.2)
        .call(() => {
          S.face.override = null;
          useBotStore.setState({ booting: false });
        }, [], 1.75);
      break;
    }
    case "lookAt": {
      if (!g.point) {
        S.look.target = null;
        break;
      }
      S.look.target = new THREE.Vector3(...g.point);
      S.look.until = now + (g.holdMs ?? 2500) / 1000;
      break;
    }
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

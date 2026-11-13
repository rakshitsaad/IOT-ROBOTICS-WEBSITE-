"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { HOME_ROBOT } from "@/components/home/HomeRobot";
import { BOT_CAMERA, BOT_HEIGHT } from "@/components/robot/config";
import { botActions, botAnchors, botInput, botScreen, useBotStore } from "@/components/robot/store";
import { FLIGHT } from "./config";
import { Drone, ROTORS, type DroneParts } from "./Drone";
import {
  SIDEKICK,
  between,
  inflate,
  insideAny,
  pickStop,
  pickStunt,
  planVia,
  type Pt,
  type Rect,
  type Stunt,
  type Zones,
} from "./sidekick-plan";
import { Trail, type TrailApi } from "./Trail";

/**
 * The robot's little sidekick (DESIGN.md §12): the drone, about a sixth of the robot's size, flying around the home
 * hero inside the robot's own canvas (BotScene renders it; there is no second canvas).
 *
 * - Free flight: every few seconds a new stop in the hero, reached along a Catmull-Rom curve through 2–3 random
 *   midpoints (sidekick-plan.ts), on the drone's spring, tilting and banking with its motion; a 1–2s hover at each stop.
 *   It never stops on the wordmark or the header's buttons, and goes behind or over the robot, never through it.
 * - Stunts after every 2–3 flights, never the same twice in a row: barrel roll, flip, loop, orbit (the robot watches,
 *   happy), peekaboo (surprised), wobble, boop (blink + wink). Phones: flip and orbit only.
 * - Cursor within 120px: it darts away. Click (projected hit test; the canvas takes no pointer events) or tap: a flip
 *   and a sparkle. No input for 6s: it lands on the robot's head and both nap until something moves.
 * - It flies the whole page: the stage is fixed, so it keeps roaming it as the page scrolls. Its size is fixed (from
 *   the hero robot's), and while the robot is small (corner, statement, join card) it does solo stunts only.
 * - Physics runs in 1/60s substeps, so the timing holds when frames are slow.
 * Debug: `?sidekick=debug` exposes window.__sidekick (mode, event log, stunt(name), flip(), nap()).
 */

const CAM = new THREE.Vector3(...BOT_CAMERA.position);
const TAN = Math.tan(((BOT_CAMERA.fov / 2) * Math.PI) / 180);
const MOBILE = "(max-width: 767.98px)";
type Mode = "away" | "enter" | "fly" | "hover" | "stunt" | "dart" | "land" | "nap";

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const damp = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

export function Sidekick() {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const parts = useRef<DroneParts | null>(null);
  const outer = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const yaw = useRef<THREE.Group>(null);
  const trail = useRef<TrailApi>(null);
  const power = useRef(1);
  // The runtime is created lazily and only touched in effects and frame callbacks (never during render).
  const runtime = useRef<Runtime | null>(null);
  const mobile = useMediaQuery(MOBILE);

  useEffect(() => {
    (runtime.current ??= createRuntime()).mobile = mobile;
  }, [mobile]);

  /* ---- Input: activity (idle landing), cursor (dart), click / tap (flip). */
  useEffect(() => {
    const S = (runtime.current ??= createRuntime());
    const local = (e: { clientX: number; clientY: number }) => {
      const r = gl.domElement.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const activity = () => {
      S.activityAt = performance.now();
    };
    const move = (e: PointerEvent) => {
      activity();
      if (e.pointerType === "mouse") {
        const at = performance.now();
        const p = local(e);
        const prev = S.pointer;
        if (prev) {
          const v = Math.hypot(p.x - prev.x, p.y - prev.y) / Math.max(8, at - prev.at);
          S.pointerSpeed = S.pointerSpeed * 0.5 + v * 1000 * 0.5; // px/s, lightly smoothed
        }
        S.pointer = { ...p, at };
        S.sawMouse = true;
      }
    };
    // Capture phase, before the robot's own hit button: a click on the drone flips it and goes no further.
    const down = (e: PointerEvent) => {
      activity();
      const p = local(e);
      const s = S.screen;
      if (S.mode === "away" || !S.visible) return;
      if (Math.hypot(p.x - s.x, p.y - s.y) > Math.max(SIDEKICK.hit, s.r * 1.25)) return;
      e.stopPropagation();
      S.swallowUntil = performance.now() + 700;
      S.clickKey++;
    };
    const click = (e: MouseEvent) => {
      if (performance.now() < S.swallowUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const events = ["wheel", "keydown", "touchstart", "scroll"] as const;
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { capture: true });
    window.addEventListener("click", click, { capture: true });
    events.forEach((ev) => window.addEventListener(ev, activity, { passive: true }));

    let debug: (() => void) | null = null;
    if (new URLSearchParams(window.location.search).get("sidekick") === "debug") {
      const w = window as unknown as { __sidekick?: unknown };
      w.__sidekick = {
        runtime: S,
        log: S.log,
        robot: useBotStore,
        stunt: (name: Stunt) => (S.forceStunt = name),
        flip: () => S.clickKey++,
        nap: () => {
          S.sawMouse = true;
          S.activityAt = 0;
        },
      };
      debug = () => delete w.__sidekick;
    }
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down, { capture: true });
      window.removeEventListener("click", click, { capture: true });
      events.forEach((ev) => window.removeEventListener(ev, activity));
      debug?.();
      botInput.look.active = false;
      botActions.release("sidekick");
    };
  }, [gl]);

  useFrame(({ clock }, rawDt) => {
    const S = (runtime.current ??= createRuntime());
    const o = outer.current;
    const p = parts.current;
    if (!o || !tilt.current || !yaw.current || !p) return;
    if (prefersReducedMotion()) {
      o.visible = S.visible = false;
      return;
    }
    const t = clock.elapsedTime;
    const now = performance.now();
    const W = size.width;
    const H = size.height;
    const rs = botAnchors.valid ? botAnchors.scale : 1; // robot scale
    // The drone's size and depth come from the hero robot, so it doesn't shrink when the robot ducks into its corner.
    const K = HOME_ROBOT.scale;
    const ds = (K * BOT_HEIGHT * (S.mobile ? SIDEKICK.mobileSize : SIDEKICK.size)) / 1.6; // drone scale
    const far = Math.max(rs, K);
    const front = () => 0.95 * far + Math.random() * 0.45 * far; // depth band in front of the robot
    const behind = -1.15 * far;

    /* ---- Screen ↔ world (the camera looks straight down -z from CAM). */
    const ppu = (z: number) => H / (2 * (CAM.z - z) * TAN);
    const toWorld = (s: Pt, z: number, out = new THREE.Vector3()) =>
      out.set(CAM.x + (s.x - W / 2) / ppu(z), CAM.y - (s.y - H / 2) / ppu(z), z);
    const toScreen = (v: THREE.Vector3): Pt => ({ x: W / 2 + (v.x - CAM.x) * ppu(v.z), y: H / 2 - (v.y - CAM.y) * ppu(v.z) });

    /* ---- Zones (refreshed a few times a second: the wordmark moves while the hero is pinned). */
    if (t - S.zonesAt > 0.3 || !S.zones) {
      S.zonesAt = t;
      S.zones = readZones(gl.domElement.getBoundingClientRect(), W, H);
    }
    const Z = S.zones;
    const pad = Math.max(18, 0.8 * ds * ppu(rs) * 1.15);

    /* ---- First appearance: in from the top, after the robot's boot-up. */
    if (S.mode === "away" && t > S.enterAt) {
      const R = Z.region;
      S.pos.copy(toWorld({ x: R.x + Math.random() * R.w, y: -0.25 * H }, front()));
      S.vel.set(0, 0, 0);
      S.mode = "enter";
      log("enter");
      planFlight();
    }

    /* ---- Click / tap: flip + sparkle (wakes it first if it was napping). */
    if (S.clickKey !== S.clickSeen) {
      S.clickSeen = S.clickKey;
      if (S.mode !== "away") {
        wake(false);
        startStunt("flip", true);
        burst(70, 1.8);
        log("click-flip");
      }
    }

    /* ---- Cursor rushing at it: dart away (mouse only), then settle. Never in the middle of a stunt. */
    const ptr = S.pointer;
    if (ptr && now - ptr.at < 120 && t > S.dartCooldown && !["away", "enter", "stunt"].includes(S.mode)) {
      const d = Math.hypot(ptr.x - S.screen.x, ptr.y - S.screen.y);
      if (d < SIDEKICK.dart.radius && S.pointerSpeed > SIDEKICK.dart.speed) {
        wake(false);
        endStunt();
        const ux = (S.screen.x - ptr.x) / (d || 1);
        const uy = (S.screen.y - ptr.y) / (d || 1);
        const R = Z.region;
        let dest = {
          x: Math.min(R.x + R.w, Math.max(R.x, S.screen.x + ux * SIDEKICK.dart.distance)),
          y: Math.min(R.y + R.h, Math.max(R.y, S.screen.y + uy * SIDEKICK.dart.distance)),
        };
        if (insideAny(Z.text.map((r) => inflate(r, pad)), dest)) dest = { x: dest.x, y: Math.max(R.y, Math.min(...Z.text.map((r) => r.y)) - pad) };
        toWorld(dest, S.pos.z, S.goal);
        S.mode = "dart";
        S.until = t + SIDEKICK.dart.time;
        S.dartCooldown = t + SIDEKICK.dart.cooldown;
        log("dart");
      }
    }

    /* ---- Idle: a cursor that has been still for 6s (so mouse users only, once they have moved it; touch and an
       untouched page keep flying): land on the robot's head and nap; any input wakes both. */
    const idle = S.sawMouse && now - S.activityAt > SIDEKICK.idle;
    if (idle && (S.mode === "hover" || S.mode === "fly") && botAnchors.valid) {
      const top = perch(new THREE.Vector3());
      const mid = S.pos.clone().lerp(top, 0.5).add(new THREE.Vector3(0, 0.5 * rs, 0));
      S.curve = new THREE.CatmullRomCurve3([S.pos.clone(), mid, top.clone().add(new THREE.Vector3(0, 0.25 * rs, 0))], false, "centripetal");
      S.flightT = 0;
      S.flightDur = 1.8;
      S.mode = "land";
      log("land");
    }
    if ((S.mode === "land" || S.mode === "nap") && !idle) wake(true);

    /* ---- What to aim for this frame. */
    let roll = 0;
    let pitch = 0;
    let look = false;
    let stiff = 30;
    switch (S.mode) {
      case "enter":
      case "fly": {
        S.flightT += Math.min(rawDt, 0.25);
        const u = clamp01(S.flightT / S.flightDur);
        S.curve!.getPointAt(easeSine(u), S.goal);
        if (u >= 1) {
          S.mode = "hover";
          S.until = t + between(SIDEKICK.hover);
          S.flights++;
          const sp = toScreen(S.goal);
          log("stop", { x: Math.round(sp.x), y: Math.round(sp.y), onText: insideAny(Z.text, sp) });
        }
        break;
      }
      case "hover": {
        if (t > S.until) {
          if (S.forceStunt || S.flights >= S.stuntAfter) {
            // Stunts round the robot need it near its hero size: the drone would not fit round a small one.
            const pool = (S.mobile ? SIDEKICK.mobileStunts : SIDEKICK.stunts).filter((s) => rs >= 0.8 * K || !SIDEKICK.robotStunts.includes(s));
            startStunt(S.forceStunt ?? pickStunt(pool, S.lastStunt));
          } else planFlight();
        }
        // Never park on the text: if something put the stop there (a dart, a resize), move on now.
        if (S.mode === "hover" && insideAny(Z.text, toScreen(S.goal))) planFlight();
        break;
      }
      case "dart":
        stiff = 85;
        if (t > S.until) {
          S.mode = "hover";
          S.until = t + SIDEKICK.dart.settle;
        }
        break;
      case "stunt": {
        stiff = 60;
        const r = runStunt(t);
        roll = r.roll;
        pitch = r.pitch;
        look = r.look;
        break;
      }
      case "land": {
        stiff = 26;
        S.flightT += Math.min(rawDt, 0.25);
        const u = clamp01(S.flightT / S.flightDur);
        if (u < 1) S.curve!.getPointAt(easeSine(u), S.goal);
        else perch(S.goal);
        if (u >= 1 && S.pos.distanceTo(S.goal) < 0.03 * rs) {
          S.mode = "nap";
          botActions.hold("sidekick", "sleepy");
          log("nap");
        }
        break;
      }
      case "nap":
        stiff = 40;
        perch(S.goal); // follows the head as it droops
        break;
    }

    /* ---- Spring, in 1/60s substeps. */
    if (S.mode !== "away") {
      const total = Math.min(rawDt, 0.25);
      const n = Math.max(1, Math.ceil(total * 60));
      const h = total / n;
      const c = 2 * 0.8 * Math.sqrt(stiff);
      for (let i = 0; i < n; i++) {
        S.acc.subVectors(S.goal, S.pos).multiplyScalar(stiff).addScaledVector(S.vel, -c);
        S.vel.addScaledVector(S.acc, h);
        S.pos.addScaledVector(S.vel, h);
      }
      S.accSmooth.lerp(S.acc, 1 - Math.exp(-10 * total));
    }
    const speed = S.vel.length();
    const napping = S.mode === "nap";

    /* ---- Attitude: tilt into motion (≤ 20°), bank, bob when slow; stunt rotations on top. */
    const dt = Math.min(rawDt, 0.1);
    S.tiltV.copy(S.vel).multiplyScalar(FLIGHT.tiltVel / rs).addScaledVector(S.accSmooth, (FLIGHT.tiltAcc * 0.6) / rs);
    let tx = -S.tiltV.y + S.tiltV.z;
    let tz = -S.tiltV.x;
    const mag = Math.hypot(tx, tz);
    if (mag > FLIGHT.maxTilt) {
      tx *= FLIGHT.maxTilt / mag;
      tz *= FLIGHT.maxTilt / mag;
    }
    if (napping) tx = tz = 0;
    S.tiltX = damp(S.tiltX, tx, 8, dt);
    S.tiltZ = damp(S.tiltZ, tz, 8, dt);
    S.yaw = damp(S.yaw, THREE.MathUtils.clamp((-S.vel.x * 0.35) / rs, -0.6, 0.6), 3, dt);
    S.basePitch = damp(S.basePitch, napping ? 0.06 : 0.32, 3, dt);
    const hoverAmt = (1 - THREE.MathUtils.smoothstep(speed / rs, 0.08, 0.9)) * (napping ? 0 : 1);
    const bob = (Math.sin(t * 2.3) + 0.4 * Math.sin(t * 1.4 + 1)) * 0.035 * rs * hoverAmt;
    power.current = damp(power.current, napping ? 0.12 : 1, napping ? 1.2 : 4, dt);

    S.visible = S.mode !== "away";
    o.visible = S.visible;
    o.position.set(S.pos.x, S.pos.y + bob, S.pos.z);
    o.rotation.x = S.basePitch;
    o.scale.setScalar(ds);
    tilt.current.rotation.set(S.tiltX + pitch, 0, S.tiltZ + roll + Math.sin(t * 1.9) * 0.025 * hoverAmt);
    yaw.current.rotation.y = S.yaw;
    o.updateMatrixWorld(true);
    const sp = toScreen(S.pos);
    S.screen = { x: sp.x, y: sp.y, r: 0.8 * ds * ppu(S.pos.z) };
    if (S.mode === "hover" && insideAny(Z.text, sp)) S.stats.hoverOnText += rawDt;
    S.stats.time += rawDt;

    /* ---- The robot watches it during stunts near it. */
    botInput.look.active = look;
    S.watched = look;
    if (look) {
      botInput.look.x = S.pos.x;
      botInput.look.y = S.pos.y;
      botInput.look.z = S.pos.z;
    }

    /* ---- Trail: subtle, more when faster. */
    if (trail.current && S.visible && !napping) {
      const rate = Math.min(220, (speed / rs) * 140) * (S.mobile ? 0.4 : 1);
      S.emit += rate * Math.min(rawDt, 0.1);
      const k = Math.floor(S.emit);
      S.emit -= k;
      for (let i = 0; i < k; i++) {
        const rotor = ROTORS[(S.rotor = (S.rotor + 1) % 4)];
        p.root.localToWorld(S.tmp.set(rotor[0], rotor[1] - 0.05, rotor[2]));
        S.tmp2.copy(S.vel).multiplyScalar(-0.2).add(S.drift.set(0, -0.3 * rs, 0));
        trail.current.emit(S.tmp, S.tmp2, 1, 0.12 * rs);
      }
    }
    if (S.burstN > 0 && trail.current) {
      p.root.localToWorld(S.tmp.set(0, 0, 0));
      const v = new THREE.Vector3();
      for (let i = 0; i < S.burstN; i++) {
        v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(S.burstV * rs * (0.5 + Math.random() * 0.7));
        trail.current.emit(S.tmp, v, 1, 0.05 * rs);
      }
      S.burstN = 0;
    }

    /* ================================================================ helpers */

    function log(ev: string, data?: Record<string, unknown>) {
      if (S.log.length > 600) S.log.shift();
      S.log.push({ t: Math.round(t * 10) / 10, ev, ...data });
    }

    function planFlight() {
      const a = toScreen(S.pos);
      const b = pickStop(Z, a, pad);
      const via = planVia(Z, a, b, pad);
      const pts = [S.pos.clone()];
      via.forEach((w) => pts.push(toWorld(w, w.depth === "behind" ? behind : front())));
      pts.push(toWorld(b, front()));
      S.curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      const len = S.curve.getLength();
      S.flightDur = THREE.MathUtils.clamp(len / (1.9 * far), SIDEKICK.flight[0], SIDEKICK.flight[1]);
      S.flightT = 0;
      if (S.mode !== "enter") S.mode = "fly";
      log("flight", { via: via.map((w) => w.depth).join(","), dur: Math.round(S.flightDur * 10) / 10 });
    }

    function startStunt(name: Stunt, forced = false) {
      S.forceStunt = null;
      S.stunt = { name, t0: t, dur: SIDEKICK.stuntTime[name], p0: S.pos.clone(), side: S.pos.x < botAnchors.head.x ? 1 : -1, marks: new Set() };
      S.mode = "stunt";
      if (!forced) {
        S.lastStunt = name;
        S.flights = 0;
        S.stuntAfter = Math.round(between(SIDEKICK.stuntEvery));
      }
      // Stunts aimed at the robot wake it first (the drone is poking it), so it can watch and react.
      if (name === "orbit" || name === "boop") botActions.nudge();
      if (name === "orbit") botActions.react("happy", S.stunt.dur * 1000 + 300);
      log("stunt", { name, forced });
    }

    function endStunt() {
      if (S.mode !== "stunt") return;
      S.stunt = null;
      botInput.look.active = false;
    }

    /** One frame of the current stunt: writes S.goal, returns extra rotations and whether the robot watches. */
    function runStunt(time: number) {
      const st = S.stunt!;
      const u = clamp01((time - st.t0) / st.dur);
      const once = (k: string, at: number, fn: () => void) => {
        if (u >= at && !st.marks.has(k)) {
          st.marks.add(k);
          fn();
        }
      };
      const head = new THREE.Vector3(botAnchors.head.x, botAnchors.head.y, botAnchors.head.z);
      const out = { roll: 0, pitch: 0, look: head.distanceTo(S.pos) < 2.4 * rs };
      const e = easeInOut(u);
      switch (st.name) {
        case "barrel": {
          // Sideways towards the middle of the hero, rolling once.
          const dir = toScreen(st.p0).x < Z.region.x + Z.region.w / 2 ? 1 : -1;
          S.goal.copy(st.p0).add(S.tmp2.set(dir * 1.1 * rs * e, Math.sin(Math.PI * u) * 0.12 * rs, 0));
          out.roll = -dir * Math.PI * 2 * e;
          break;
        }
        case "flip": {
          S.goal.copy(st.p0).add(S.tmp2.set(0, Math.sin(Math.PI * u) * 0.28 * rs, 0));
          out.pitch = -Math.PI * 2 * e;
          once("burst", 0.5, () => burst(30, 1.2));
          break;
        }
        case "loop": {
          const r = 0.34 * rs;
          const th = Math.PI * 2 * e;
          const dir = st.side;
          S.goal.copy(st.p0).add(S.tmp2.set(dir * Math.sin(th) * r, r - Math.cos(th) * r, 0));
          out.roll = dir * th;
          break;
        }
        case "orbit": {
          // Two laps round the head (passing behind it), after a short approach.
          const R = 0.82 * rs;
          const phi0 = Math.atan2(st.p0.x - head.x, st.p0.z - head.z);
          const ring = (phi: number, v: THREE.Vector3) =>
            v.set(head.x + R * Math.sin(phi), head.y + 0.1 * rs + 0.08 * rs * Math.sin(2 * phi), head.z + R * Math.cos(phi));
          if (u < 0.18) S.goal.copy(st.p0).lerp(ring(phi0, S.tmp2), easeSine(u / 0.18));
          else ring(phi0 + Math.PI * 4 * easeSine((u - 0.18) / 0.82), S.goal);
          out.look = true;
          break;
        }
        case "peekaboo": {
          // Behind the robot (round its near side), a beat hidden, then out past the other side.
          const side = st.side === 1 ? -1 : 1; // the side it starts on, relative to the head
          const hide = S.tmp2.set(head.x - side * 0.1 * rs, head.y - 0.35 * rs, head.z + behind);
          if (u < 0.32) {
            const edge = new THREE.Vector3(head.x + side * 1.05 * rs, head.y - 0.3 * rs, head.z);
            S.goal.copy(bezier(st.p0, edge, hide, easeSine(u / 0.32)));
          } else if (u < 0.55) {
            S.goal.copy(hide);
          } else {
            const edge = new THREE.Vector3(head.x - side * 1.05 * rs, head.y - 0.25 * rs, head.z);
            const pop = new THREE.Vector3(head.x - side * 1.35 * rs, head.y - 0.05 * rs, head.z + front());
            S.goal.copy(bezier(hide, edge, pop, easeSine(clamp01((u - 0.55) / 0.3))));
            once("surprised", 0.62, () => {
              botActions.nudge();
              botActions.react("surprised", 1100);
            });
          }
          out.look = u > 0.55;
          break;
        }
        case "wobble": {
          // Loses its balance, drops a little, then a quick boost back up.
          const drop = u < 0.6 ? -0.3 * rs * easeSine(u / 0.6) : -0.3 * rs + 0.42 * rs * Math.sin((Math.PI / 2) * clamp01((u - 0.6) / 0.25));
          S.goal.copy(st.p0).add(S.tmp2.set(Math.sin(u * 23) * 0.04 * rs * (1 - u), drop, 0));
          const fade = 1 - THREE.MathUtils.smoothstep(u, 0.55, 0.7);
          out.roll = Math.sin(u * Math.PI * 9) * 0.55 * fade;
          out.pitch = Math.sin(u * Math.PI * 6 + 1) * 0.22 * fade;
          once("boost", 0.6, () => burst(18, 0.9));
          break;
        }
        case "boop": {
          // Up to the robot's screen, a light tap, and back out.
          const face = new THREE.Vector3(botAnchors.face.x, botAnchors.face.y, botAnchors.face.z);
          const normal = face.clone().sub(head).normalize();
          const near = face.clone().addScaledVector(normal, 0.42 * rs);
          const touch = face.clone().addScaledVector(normal, 0.16 * rs);
          if (u < 0.42) S.goal.copy(bezier(st.p0, st.p0.clone().lerp(near, 0.5).add(S.tmp2.set(0, 0.3 * rs, 0)), near, easeSine(u / 0.42)));
          else if (u < 0.6) S.goal.copy(near).lerp(touch, Math.sin(Math.PI * clamp01((u - 0.42) / 0.18)));
          else S.goal.copy(near).lerp(st.p0, easeSine(clamp01((u - 0.6) / 0.4)));
          once("blink", 0.5, () => botActions.blink());
          once("wink", 0.6, () => botActions.react("wink", 1300));
          out.look = true;
          break;
        }
      }
      if (u >= 1) {
        log("stunt-end", { name: st.name });
        endStunt();
        S.mode = "hover";
        S.until = time + 0.35;
        S.goal.copy(S.pos);
      }
      return out;
    }

    function burst(n: number, v: number) {
      S.burstN += n;
      S.burstV = v;
    }

    /** Where it sits on the robot's head (a little above the top, following the head). */
    function perch(out: THREE.Vector3) {
      return out.set(botAnchors.top.x, botAnchors.top.y + 0.15 * ds + 0.01 * rs, botAnchors.top.z);
    }

    /** Back to flight after a nap (or quietly, without a hop, when leaving). */
    function wake(hop: boolean) {
      if (S.mode !== "land" && S.mode !== "nap") return;
      botActions.release("sidekick");
      log("wake");
      if (!hop) return;
      S.mode = "hover";
      S.until = t + 0.5;
      S.goal.copy(S.pos).add(S.tmp2.set(0, 0.35 * rs, 0.4 * rs));
    }
  });

  return (
    <>
      <group ref={outer} visible={false}>
        <group ref={tilt}>
          <group ref={yaw}>
            <Drone parts={parts} power={power} />
          </group>
        </group>
      </group>
      <Trail
        max={mobile ? SIDEKICK.mobileParticles : SIDEKICK.particles}
        life={SIDEKICK.life}
        size={0.026}
        api={trail}
      />
    </>
  );
}

/* ------------------------------------------------------------------ setup */

type Runtime = ReturnType<typeof createRuntime>;

function createRuntime() {
  return {
    mode: "away" as Mode,
    visible: false,
    mobile: false,
    enterAt: 1.6, // first appearance: after the robot's boot-up
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    acc: new THREE.Vector3(),
    accSmooth: new THREE.Vector3(),
    goal: new THREE.Vector3(),
    tiltV: new THREE.Vector3(),
    tmp: new THREE.Vector3(),
    tmp2: new THREE.Vector3(),
    drift: new THREE.Vector3(),
    tiltX: 0,
    tiltZ: 0,
    yaw: 0,
    basePitch: 0.32,
    curve: null as THREE.CatmullRomCurve3 | null,
    flightT: 0,
    flightDur: 1,
    until: 0,
    flights: 0,
    stuntAfter: 2,
    lastStunt: null as Stunt | null,
    forceStunt: null as Stunt | null,
    stunt: null as { name: Stunt; t0: number; dur: number; p0: THREE.Vector3; side: 1 | -1; marks: Set<string> } | null,
    dartCooldown: 0,
    pointer: null as (Pt & { at: number }) | null,
    pointerSpeed: 0,
    sawMouse: false,
    watched: false,
    activityAt: typeof performance === "undefined" ? 0 : performance.now(),
    clickKey: 0,
    clickSeen: 0,
    swallowUntil: 0,
    screen: { x: -999, y: -999, r: 0 },
    zones: null as Zones | null,
    zonesAt: -1,
    emit: 0,
    rotor: 0,
    burstN: 0,
    burstV: 1,
    log: [] as Record<string, unknown>[],
    stats: { hoverOnText: 0, time: 0 },
  };
}

/** The flight region and the no-stop zones, in stage px, from the DOM. */
function readZones(canvas: DOMRect, W: number, H: number): Zones {
  const toStage = (r: DOMRect): Rect => ({ x: r.left - canvas.left, y: r.top - canvas.top, w: r.width, h: r.height });
  // Region: the stage (fixed, so the same box all the way down the page), inset from its edges, below the header.
  const nav = document.querySelector("header nav")?.getBoundingClientRect();
  const navBottom = nav ? nav.bottom - canvas.top : 0;
  const y0 = Math.max(H * 0.08, navBottom + 24);
  const y1 = H * 0.86;
  const region: Rect = { x: W * 0.08, y: y0, w: W * 0.84, h: Math.max(40, y1 - y0) };

  const text: Rect[] = [];
  const word = document.querySelector<HTMLElement>("[data-hero-wordmark]");
  if (word && parseFloat(getComputedStyle(word).opacity) > 0.15) {
    // One box per line, around its letters (not the line's full width).
    word.querySelectorAll<HTMLElement>("[data-hero-line]").forEach((line) => {
      let x0 = Infinity, y0l = Infinity, x1 = -Infinity, y1l = -Infinity;
      line.querySelectorAll("[data-letter]").forEach((l) => {
        const r = l.getBoundingClientRect();
        x0 = Math.min(x0, r.left);
        y0l = Math.min(y0l, r.top);
        x1 = Math.max(x1, r.right);
        y1l = Math.max(y1l, r.bottom);
      });
      if (x1 > x0) text.push({ x: x0 - canvas.left, y: y0l - canvas.top, w: x1 - x0, h: y1l - y0l });
    });
  }
  document.querySelectorAll<HTMLElement>("header a, header button").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) text.push(toStage(r));
  });
  const robot = botScreen.valid ? { x: botScreen.x, y: botScreen.y, w: botScreen.w, h: botScreen.h } : null;
  return { region, text, robot };
}

/** Quadratic Bézier a → b → c at t. */
function bezier(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) {
  const m = 1 - t;
  return new THREE.Vector3(
    m * m * a.x + 2 * m * t * b.x + t * t * c.x,
    m * m * a.y + 2 * m * t * b.y + t * t * c.y,
    m * m * a.z + 2 * m * t * b.z + t * t * c.z,
  );
}

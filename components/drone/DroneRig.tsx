"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { MissionCardId } from "@/lib/mission";
import { MISSION } from "@/lib/mission";
import { DRONE_CAMERA, FLIGHT } from "./config";
import { Dissolve, type DissolveApi } from "./Dissolve";
import { Drone, LENS, ROTORS, TOP, type DroneParts } from "./Drone";
import { beamSpot, direct, type Rect } from "./director";
import { HoloGlobe, type GlobeApi } from "./HoloGlobe";
import { ScanBeam, type BeamApi } from "./ScanBeam";
import { droneState, useDroneStore, type ScreenPoint } from "./store";
import { Trail, type TrailApi } from "./Trail";

/**
 * The drone's brain and body: each frame it asks the director for an intent, flies there on damped springs, tilts
 * and banks with its velocity and acceleration, bobs while hovering, and drives the trail, beam, globe and
 * dissolve. Nothing here is React state; the DOM only hears which card is under the beam (useDroneStore).
 *
 * Coordinates: the camera looks straight at z = 0 (the dashboard plane), so a stage px maps to world linearly at
 * any depth; ScreenPoint {x, y} px + z world.
 */

const TAN = Math.tan(((DRONE_CAMERA.fov / 2) * Math.PI) / 180);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

export function DroneRig({ maxParticles, dissolveCount }: { maxParticles: number; dissolveCount: number }) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const parts = useRef<DroneParts | null>(null);
  const outer = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const yaw = useRef<THREE.Group>(null);
  const trail = useRef<TrailApi>(null);
  const beam = useRef<BeamApi>(null);
  const globe = useRef<GlobeApi>(null);
  const dissolve = useRef<DissolveApi>(null);
  const R = useRef(createRuntime()).current;

  // Compile every shader up front (the beam, globe and dissolve start hidden, and compile skips hidden objects),
  // then draw them for a few warm-up frames at zero alpha (drivers often finish a program only on first use), so
  // none of them stalls a frame the first time it appears mid-sequence. DroneStage renders these frames right
  // after the canvas mounts, while the section is still a screen away.
  useEffect(() => {
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    gl.compileAsync(scene, camera).catch(() => {});
    hidden.forEach((o) => (o.visible = false));
  }, [gl, scene, camera]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const now = performance.now();
    const t = clock.elapsedTime;
    const W = size.width;
    const H = size.height;
    const root = droneState.root;
    const o = outer.current;
    const p = parts.current;
    if (!o || !tilt.current || !yaw.current || !p) return;

    /* ---- Stage mapping. px per world unit at depth z; stage px ↔ world. */
    const ppu = (z: number) => H / (2 * (DRONE_CAMERA.z - z) * TAN);
    const toWorld = (s: ScreenPoint, out: THREE.Vector3) => out.set((s.x - W / 2) / ppu(s.z), -(s.y - H / 2) / ppu(s.z), s.z);
    const rootRect = root?.getBoundingClientRect();
    const cardRect = (id: MissionCardId): Rect | null => {
      if (!root || !rootRect) return null;
      let el = R.cards.get(id);
      if (!el || !el.isConnected) {
        el = root.querySelector<HTMLElement>(`[data-mc-card="${id}"]`) ?? undefined;
        if (el) R.cards.set(id, el);
      }
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - rootRect.left, y: r.top - rootRect.top, w: r.width, h: r.height };
    };

    /* ---- Intent. */
    const scale = droneState.mobile ? MISSION.mobileScale : 1;
    const intent = direct({ w: W, h: H, card: cardRect, drone: droneState.screen }, now);

    /* ---- Spring towards the target (semi-implicit Euler, slightly under-damped). */
    toWorld(intent.at, R.target);
    if (!R.placed) {
      R.pos.copy(R.target);
      R.placed = true;
    }
    const k = FLIGHT.stiffness;
    const c = 2 * FLIGHT.damping * Math.sqrt(k);
    R.prevVel.copy(R.vel);
    R.acc.subVectors(R.target, R.pos).multiplyScalar(k).addScaledVector(R.vel, -c);
    R.vel.addScaledVector(R.acc, dt);
    R.pos.addScaledVector(R.vel, dt);
    R.accSmooth.lerp(R.acc, 1 - Math.exp(-10 * dt));
    const speed = R.vel.length();
    droneState.speed = damp(droneState.speed, speed, 8, dt);

    /* ---- Attitude: tilt towards motion (velocity + acceleration, ≤ 20°), bank into turns, bob when slow. */
    R.tiltVec.copy(R.vel).multiplyScalar(FLIGHT.tiltVel).addScaledVector(R.accSmooth, FLIGHT.tiltAcc);
    // Screen-up is "forward" (nose down), towards the camera is "back" (nose up); right is roll right.
    let tx = -R.tiltVec.y + R.tiltVec.z;
    let tz = -R.tiltVec.x;
    const mag = Math.hypot(tx, tz);
    if (mag > FLIGHT.maxTilt) {
      tx *= FLIGHT.maxTilt / mag;
      tz *= FLIGHT.maxTilt / mag;
    }
    R.tiltX = damp(R.tiltX, tx, 7, dt);
    R.tiltZ = damp(R.tiltZ, tz, 7, dt);
    droneState.tilt = (Math.hypot(R.tiltX, R.tiltZ) * 180) / Math.PI;
    const yawTarget = THREE.MathUtils.clamp(-R.vel.x * FLIGHT.yawVel, -FLIGHT.maxYaw, FLIGHT.maxYaw);
    R.yaw = damp(R.yaw, yawTarget, 3, dt);
    const hover = 1 - THREE.MathUtils.smoothstep(speed, 0.1, 1.2);
    const bob = (Math.sin(t * 2.1) + 0.4 * Math.sin(t * 1.37 + 1)) * FLIGHT.bob * hover;
    const wobble = Math.sin(t * 1.7) * 0.02 * hover;

    /* ---- Flip: a 360° roll with a hop, and a burst. */
    if (droneState.flipKey !== R.flipKey) {
      R.flipKey = droneState.flipKey;
      if (R.flipT < 0 && intent.dissolve <= 0) {
        R.flipT = 0;
        burst(trail.current, p.root, R.tmp, scale);
      }
    }
    let roll = 0;
    let hop = 0;
    if (R.flipT >= 0) {
      const f = Math.min(1, R.flipT / FLIGHT.flip);
      roll = Math.PI * 2 * easeInOut(f);
      hop = Math.sin(Math.PI * f) * 0.28 * scale;
      R.flipT += dt;
      if (f >= 1) R.flipT = -1;
    }

    /* ---- Apply. */
    o.position.set(R.pos.x, R.pos.y + bob + hop, R.pos.z);
    o.rotation.x = FLIGHT.pitch;
    o.scale.setScalar(scale);
    tilt.current.rotation.set(R.tiltX, 0, R.tiltZ + wobble + roll);
    yaw.current.rotation.y = R.yaw;
    o.updateMatrixWorld(true);

    const screenR = 0.75 * scale * ppu(R.pos.z);
    droneState.screen = { x: W / 2 + R.pos.x * ppu(R.pos.z), y: H / 2 - R.pos.y * ppu(R.pos.z), r: screenR };

    /* ---- Dissolve (frozen pose while it plays; reassembles as d returns to 0). */
    const d = intent.dissolve;
    if (d <= 0) {
      R.frozen.copy(p.root.matrixWorld);
      if (!R.samples) R.samples = p.sample(dissolveCount);
    }
    p.root.visible = d < 0.06;
    p.root.scale.setScalar(1 - 0.3 * THREE.MathUtils.smoothstep(d, 0, 0.06));
    if (R.samples) dissolve.current?.update(R.samples, R.frozen, d);

    /* ---- Trail: emission follows speed; nothing while dissolved. Quality drops first if frames get slow. */
    R.frameAvg = damp(R.frameAvg, rawDt, 2, rawDt);
    if (R.frameAvg > 1 / 45) R.quality = Math.max(0.3, R.quality - dt * 0.5);
    else if (R.frameAvg < 1 / 58) R.quality = Math.min(1, R.quality + dt * 0.1);
    if (trail.current && d <= 0) {
      const rate = (2 + Math.min(700, speed * 260)) * R.quality * (maxParticles / MISSION.particles);
      R.emit += rate * dt;
      const n = Math.floor(R.emit);
      R.emit -= n;
      for (let i = 0; i < n; i++) {
        const rotor = ROTORS[(R.rotor = (R.rotor + 1) % 4)];
        p.root.localToWorld(R.tmp.set(rotor[0], rotor[1] - 0.05, rotor[2]));
        R.tmp2.copy(R.vel).multiplyScalar(-0.22).add(R.down);
        trail.current.emit(R.tmp, R.tmp2, 1, 0.18 * scale);
      }
      if (now - R.countAt > 400) {
        R.countAt = now;
        droneState.particles = trail.current.alive();
      }
    }

    /* ---- Scan beam: on once the drone has arrived over the card. */
    const scanCard = intent.scan;
    let beamOn = false;
    let target: Rect | null = null;
    if (scanCard && d <= 0) {
      target = cardRect(scanCard);
      if (target) {
        const over = { x: target.x + target.w / 2, y: target.y + target.h * 0.2 };
        beamOn = Math.hypot(droneState.screen.x - over.x, droneState.screen.y - over.y) < FLIGHT.beamReach * Math.max(1, scale);
      }
    }
    R.beam = damp(R.beam, beamOn ? 1 : 0, beamOn ? 6 : 10, dt);
    if (target || R.beam > 0.002) {
      if (target) R.beamRect = target;
      const r = R.beamRect;
      if (r) {
        p.root.localToWorld(R.tmp.set(...LENS));
        toWorld(beamSpot(r), R.tmp2);
        beam.current?.place(R.tmp, R.tmp2, (Math.min(r.w * 0.34, r.h * 0.5)) / ppu(0), R.beam);
      }
    } else {
      beam.current?.place(R.tmp, R.tmp, 0, 0);
    }
    const scanning = R.beam > 0.5 && scanCard ? scanCard : null;
    if (scanning !== R.scanning) {
      R.scanning = scanning;
      useDroneStore.getState().setScanning(scanning);
    }

    /* ---- Globe: projects up from the top panel. */
    R.globe = damp(R.globe, intent.globe && d <= 0 ? 1 : 0, intent.globe ? 2.2 : 4, dt);
    const radius = 0.78 * scale;
    p.root.localToWorld(R.tmp.set(...TOP));
    R.tmp2.set(R.pos.x, R.pos.y + bob + 1.3 * scale + radius * 0.35, R.pos.z - 0.2);
    globe.current?.place(R.tmp2, R.tmp, radius, R.globe);
    const globeOn = R.globe > 0.5;
    if (globeOn !== R.globeOn) {
      R.globeOn = globeOn;
      useDroneStore.getState().setGlobe(globeOn);
    }

    if (R.warm > 0) {
      R.warm--;
      scene.traverse((obj) => {
        obj.visible = true; // effects are at zero alpha here; the next frame's place()/update() hides them again
      });
    }
  });

  return (
    <>
      <group ref={outer}>
        <group ref={tilt}>
          <group ref={yaw}>
            <Drone parts={parts} />
          </group>
        </group>
      </group>
      <Trail max={maxParticles} api={trail} />
      <ScanBeam api={beam} />
      <HoloGlobe api={globe} />
      <Dissolve count={dissolveCount} api={dissolve} />
    </>
  );
}

function createRuntime() {
  return {
    placed: false,
    /** Warm-up frames left (see the compile effect). */
    warm: 4,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    prevVel: new THREE.Vector3(),
    acc: new THREE.Vector3(),
    accSmooth: new THREE.Vector3(),
    target: new THREE.Vector3(),
    tiltVec: new THREE.Vector3(),
    down: new THREE.Vector3(0, -0.35, 0),
    tmp: new THREE.Vector3(),
    tmp2: new THREE.Vector3(),
    tiltX: 0,
    tiltZ: 0,
    yaw: 0,
    flipKey: droneState.flipKey,
    flipT: -1,
    emit: 0,
    rotor: 0,
    quality: 1,
    frameAvg: 1 / 60,
    countAt: 0,
    beam: 0,
    beamRect: null as Rect | null,
    scanning: null as MissionCardId | null,
    globe: 0,
    globeOn: false,
    frozen: new THREE.Matrix4(),
    samples: null as Float32Array | null,
    cards: new Map<MissionCardId, HTMLElement>(),
  };
}

/** The flip's burst: particles thrown out in every direction from the body. */
function burst(trail: TrailApi | null, root: THREE.Object3D, tmp: THREE.Vector3, scale: number) {
  if (!trail) return;
  root.localToWorld(tmp.set(0, 0, 0));
  const v = new THREE.Vector3();
  for (let i = 0; i < FLIGHT.burst; i++) {
    v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(1.6 + Math.random() * 1.4);
    trail.emit(tmp, v, 1, 0.1 * scale);
  }
}

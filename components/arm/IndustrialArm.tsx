"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { ARM_CAMERA, ARM_INPUT, ARM_REST, ARM_SCENES, armPlacement, JOINT_COUNT, type ArmPose, type Vec3 } from "@/lib/arm";
import { applyJoints, buildArm, type ArmQuality } from "./arm-model";
import { armInput, bindArmInput } from "./arm-input";
import { solveArm, stepJoints } from "./kinematics";

/**
 * The arm and its controller (DESIGN.md §22). Every frame:
 * 1. the scroll position picks a pose between the page's scene keys (lib/arm.ts → ARM_SCENES);
 * 2. the cursor, a hovered link or button, idle time and clicks bend that pose (where the wrist goes, what the gripper
 *    looks at, how far it is open);
 * 3. inverse kinematics turns it into joint angles, and each joint servos there with capped speed and acceleration.
 * `still` (reduced motion): the first pose only, no input, no springs.
 */
export function IndustrialArm({ quality, still }: { quality: ArmQuality; still: boolean }) {
  const rig = useMemo(() => buildArm(quality), [quality]);
  const key = useMemo(() => {
    const light = new THREE.DirectionalLight("#fff6ec", 3);
    light.position.set(-2.5, 4.5, 3.5);
    light.target.position.set(0, 1, 0);
    if (quality === "high") {
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      Object.assign(light.shadow.camera, { left: -2.6, right: 2.6, top: 3, bottom: -1.2, near: 0.5, far: 14 });
      light.shadow.bias = -0.0004;
      light.shadow.normalBias = 0.025;
    }
    return light;
  }, [quality]);
  // Mutable per-frame state (created on the first frame, never React state).
  const stRef = useRef<State | null>(null);

  // The key light travels with the arm, so its shadow box always fits it.
  useLayoutEffect(() => {
    rig.root.add(key, key.target);
    return () => {
      rig.root.remove(key, key.target);
      key.dispose();
    };
  }, [rig, key]);
  useEffect(() => () => rig.dispose(), [rig]);
  useEffect(() => (still ? undefined : bindArmInput()), [still]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("arm") !== "debug") return;
    (window as unknown as { __arm?: unknown }).__arm = { state: () => stRef.current, input: armInput, rig };
    return () => {
      delete (window as unknown as { __arm?: unknown }).__arm;
    };
  }, [rig]);

  useFrame((state, delta) => {
    const st = (stRef.current ??= createState());
    const camera = state.camera as THREE.PerspectiveCamera;
    const gl = state.gl;
    const dt = Math.min(delta, 1 / 20);
    const now = performance.now();
    const t = state.clock.elapsedTime;
    const { width, height } = state.size;
    const aspect = width / Math.max(1, height);
    const viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * ARM_CAMERA.position[2];
    const viewW = viewH * aspect;
    const place = armPlacement(width, aspect);

    // 1. Scroll → pose.
    const pose = still ? ARM_SCENES.intro[0].pose : scrollPose(st, now);
    const ease = still ? 1 : 1 - Math.exp(-dt * 3);
    st.shift[0] += (pose.shift[0] - st.shift[0]) * ease;
    st.shift[1] += (pose.shift[1] - st.shift[1]) * ease;
    st.opacity += (pose.opacity - st.opacity) * ease;

    const root = rig.root;
    root.position.set((place.x + st.shift[0]) * viewW, (place.y + st.shift[1]) * viewH, 0);
    root.scale.setScalar(place.scale);

    // Camera parallax with the cursor: the arm shifts a little against the page, so it reads as a layer behind it.
    const p = armInput.pointer;
    const px = !still && p.active ? (p.x / width) * 2 - 1 : 0;
    const py = !still && p.active ? (p.y / height) * 2 - 1 : 0;
    const pe = 1 - Math.exp(-dt * 2.5);
    st.parallax[0] += (px - st.parallax[0]) * pe;
    st.parallax[1] += (py - st.parallax[1]) * pe;
    camera.position.set(
      ARM_CAMERA.position[0] + st.parallax[0] * ARM_INPUT.parallax[0],
      ARM_CAMERA.position[1] - st.parallax[1] * ARM_INPUT.parallax[1],
      ARM_CAMERA.position[2],
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    root.updateMatrixWorld();

    // 2. Input bends the pose.
    const target = st.target.fromArray(pose.target);
    const aim = st.aim.fromArray(pose.aim);
    let grip = pose.grip;
    if (!still) {
      if (p.active && toArm(st, camera, root, p.x, p.y, width, height, st.cursor)) {
        lean(target, st.cursor, ARM_INPUT.follow, ARM_INPUT.followMax);
        aim.lerp(st.cursor, ARM_INPUT.look);
      }

      // Hover: the gripper turns to the link or button, leans in a little and opens.
      const el = armInput.hover;
      let hovering = false;
      if (el?.isConnected) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        hovering = cy > 0 && cy < height && toArm(st, camera, root, cx, cy, width, height, st.hoverAt);
      }
      st.hoverW += ((hovering ? 1 : 0) - st.hoverW) * (1 - Math.exp(-dt * 5));
      if (st.hoverW > 0.001) {
        lean(target, st.hoverAt, 0.25 * st.hoverW, 0.45);
        aim.lerp(st.hoverAt, 0.9 * st.hoverW);
        grip += (0 - grip) * 0.75 * st.hoverW;
      }

      // Idle: a slow inspection sweep, and now and then the gripper closes and opens as if calibrating.
      const idle = now - armInput.lastInput > ARM_INPUT.idleAfter;
      st.idleW += ((idle ? 1 : 0) - st.idleW) * (1 - Math.exp(-dt * (idle ? 0.7 : 4)));
      if (st.idleW > 0.001) {
        const w = st.idleW;
        target.x += w * 0.12 * Math.sin(t * 0.37);
        target.y += w * 0.09 * Math.sin(t * 0.53 + 1);
        target.z += w * 0.07 * Math.sin(t * 0.29 + 2);
        aim.x += w * 0.7 * Math.sin(t * 0.23);
        aim.y += w * 0.5 * Math.sin(t * 0.31 + 0.7);
        const cycle = (t % 7) / 7;
        if (cycle > 0.8) grip += (1 - grip) * w * 0.8 * Math.sin(((cycle - 0.8) / 0.2) * Math.PI);
      }

      // Click: the gripper snaps shut and the wrist nods, then both come back.
      const c = (now - armInput.clickAt) / ARM_INPUT.click;
      if (c >= 0 && c < 1) {
        const k = Math.sin(c * Math.PI);
        grip += (1 - grip) * k;
        aim.y -= 0.6 * k;
      }
    }

    // 3. Inverse kinematics, then the servos.
    solveArm(st.targetArr(target), st.aimArr(aim), st.pos, st.goal);
    st.goal[6] = Math.min(1, Math.max(0, grip));
    if (!still) {
      st.goal[5] += st.idleW * 0.5 * Math.sin(t * 0.27);
      // Servo corrections while idle: a tiny step on the wrist every 2–3.5s.
      if (now > st.jitterAt) {
        st.jitter = (Math.random() - 0.5) * 0.014;
        st.jitterAt = now + 2000 + Math.random() * 1500;
      }
      st.goal[4] += st.jitter * st.idleW;
    }

    let moving = st.first;
    if (still) st.pos.splice(0, JOINT_COUNT, ...st.goal);
    else moving = stepJoints(st.pos, st.vel, st.goal, dt) > 0.002 || moving;

    applyJoints(rig, st.pos);
    root.updateMatrixWorld(true);
    if (moving || still) rig.updateCables();
    st.first = false;

    gl.domElement.style.opacity = (st.opacity * place.opacity).toFixed(3);
  });

  return <primitive object={rig.root} />;
}

/* ------------------------------------------------------------------ state */

function createState() {
  const target = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const tArr: Vec3 = [0, 0, 0];
  const aArr: Vec3 = [0, 0, 0];
  return {
    pos: [...ARM_REST],
    vel: new Array<number>(JOINT_COUNT).fill(0),
    goal: [...ARM_REST],
    first: true,
    shift: [0, 0] as [number, number],
    opacity: 1,
    parallax: [0, 0] as [number, number],
    hoverW: 0,
    idleW: 0,
    jitter: 0,
    jitterAt: 0,
    target,
    aim,
    cursor: new THREE.Vector3(),
    hoverAt: new THREE.Vector3(),
    targetArr: (v: THREE.Vector3) => v.toArray(tArr) as Vec3,
    aimArr: (v: THREE.Vector3) => v.toArray(aArr) as Vec3,
    // Scroll keys
    scenes: [] as { el: HTMLElement; name: string }[],
    scenesAt: -Infinity,
    keys: [] as { s: number; pose: ArmPose }[],
    pose: { target: [0, 0, 0], aim: [0, 0, 0], grip: 0, shift: [0, 0], opacity: 1 } as ArmPose,
    // Picking
    ray: new THREE.Raycaster(),
    ndc: new THREE.Vector2(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
  };
}
type State = ReturnType<typeof createState>;

/* ----------------------------------------------------------------- helpers */

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Moves `v` a share of the way towards `to`, at most `max` (arm units). */
function lean(v: THREE.Vector3, to: THREE.Vector3, share: number, max: number) {
  const dx = (to.x - v.x) * share;
  const dy = (to.y - v.y) * share;
  const dz = (to.z - v.z) * share;
  const len = Math.hypot(dx, dy, dz);
  const k = len > max ? max / len : 1;
  v.set(v.x + dx * k, v.y + dy * k, v.z + dz * k);
}

/** A screen point → arm space, on a plane ARM_INPUT.planeZ in front of the arm's base. */
function toArm(
  st: State,
  camera: THREE.Camera,
  root: THREE.Object3D,
  x: number,
  y: number,
  w: number,
  h: number,
  out: THREE.Vector3,
) {
  st.ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1);
  st.ray.setFromCamera(st.ndc, camera);
  st.plane.constant = -(root.position.z + ARM_INPUT.planeZ * root.scale.x);
  if (!st.ray.ray.intersectPlane(st.plane, out)) return false;
  out.sub(root.position).divideScalar(root.scale.x);
  return true;
}

/**
 * The pose for the current scroll position. Each [data-arm-scene] element (and the footer) puts its keys at scroll
 * positions across its span: `at` 0 when its top is at the screen's top, 1 when its bottom is at the screen's bottom
 * (sections shorter than that spread their keys over 60% of their height around their middle).
 */
function scrollPose(st: State, now: number): ArmPose {
  if (now - st.scenesAt > 1000) {
    st.scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-arm-scene]"), (el) => ({
      el,
      name: el.dataset.armScene!,
    }));
    const footer = document.getElementById("site-footer");
    if (footer) st.scenes.push({ el: footer, name: "footer" });
    st.scenesAt = now;
  }
  const y = window.scrollY;
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  const keys = st.keys;
  keys.length = 0;
  for (const { el, name } of st.scenes) {
    const list = ARM_SCENES[name];
    if (!list || !el.isConnected) continue;
    const r = el.getBoundingClientRect();
    const span = Math.max(r.height - vh, 0.6 * r.height);
    const mid = r.top + y - vh / 2 + r.height / 2;
    for (const k of list) {
      const prev = keys.length ? keys[keys.length - 1].s : 0;
      keys.push({ s: Math.max(prev, clamp(mid + (k.at - 0.5) * span, 0, max)), pose: k.pose });
    }
  }
  if (!keys.length) return ARM_SCENES.intro[0].pose;
  if (y <= keys[0].s) return keys[0].pose;
  const last = keys[keys.length - 1];
  if (y >= last.s) return last.pose;
  let i = 0;
  while (keys[i + 1].s < y) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const k = smooth(clamp((y - a.s) / Math.max(1, b.s - a.s), 0, 1));
  const out = st.pose;
  for (let n = 0; n < 3; n++) {
    out.target[n] = a.pose.target[n] + (b.pose.target[n] - a.pose.target[n]) * k;
    out.aim[n] = a.pose.aim[n] + (b.pose.aim[n] - a.pose.aim[n]) * k;
  }
  out.grip = a.pose.grip + (b.pose.grip - a.pose.grip) * k;
  out.shift[0] = a.pose.shift[0] + (b.pose.shift[0] - a.pose.shift[0]) * k;
  out.shift[1] = a.pose.shift[1] + (b.pose.shift[1] - a.pose.shift[1]) * k;
  out.opacity = a.pose.opacity + (b.pose.opacity - a.pose.opacity) * k;
  return out;
}

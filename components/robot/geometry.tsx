"use client";

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { BOT_COLORS } from "./palette";
import type { BotRig } from "./rig";
import { createCircuitTexture, createIrisLoopTexture, loadPlateTexture, PLATE_ASPECT_INV } from "./textures";

/**
 * The club robot built from primitives. Geometry and materials only: no
 * animation, no face logic. It fills a BotRig (rig.ts) that ClubBot animates,
 * so a .glb model can replace this file without touching ClubBot.
 *
 * Units: about 2.4 tall from the base to the antenna tip; the robot faces +Z;
 * the base sits on y = 0. "Right" means the robot's own right (screen left).
 */

/* ------------------------------------------------------------ dimensions */

export const BOT_DIMENSIONS = {
  height: 2.4,
  head: { w: 1.2, h: 1.0, d: 0.9, r: 0.18, pivotY: 1.26 },
  bezel: { w: 0.98, h: 0.78, r: 0.15, frame: 0.08, depth: 0.05 },
  torso: { w: 0.82, h: 0.64, d: 0.62, r: 0.16, y: 0.84 },
  base: { r: 0.8, h: 0.06 },
} as const;

const HEAD = BOT_DIMENSIONS.head;
const BEZEL = BOT_DIMENSIONS.bezel;
const TORSO = BOT_DIMENSIONS.torso;
const BASE = BOT_DIMENSIONS.base;

const HEAD_CY = HEAD.h / 2; // head centre above the neck pivot
const HEAD_FRONT = HEAD.d / 2;
const SCREEN_W = BEZEL.w - 2 * BEZEL.frame + 0.01;
const SCREEN_H = BEZEL.h - 2 * BEZEL.frame + 0.01;
const PLATE = { w: 0.36, h: 0.36 * PLATE_ASPECT_INV, y: 0.03 };

const REST = {
  bodyY: 0,
  armL: { shoulderZ: 0.22, elbowX: -0.3 },
  armR: { shoulderZ: -0.22, elbowX: -0.3 },
};

/* ------------------------------------------------------------ component */

interface PrimitiveRobotProps {
  rigRef: RefObject<BotRig | null>;
  /** Chest plate logo. Missing file → plain plate. */
  logoUrl?: string;
}

export function PrimitiveRobot({ rigRef, logoUrl = "/logo.svg" }: PrimitiveRobotProps) {
  const assets = useMemo(() => buildAssets(), []);
  const { geo, mat } = assets;

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const shoulderL = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const shoulderR = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (!root.current || !body.current || !head.current) return;
    rigRef.current = {
      root: root.current,
      body: body.current,
      head: head.current,
      armL: { shoulder: shoulderL.current!, elbow: elbowL.current! },
      armR: { shoulder: shoulderR.current!, elbow: elbowR.current! },
      materials: {
        screen: mat.screen,
        bezel: mat.bezel,
        antennaLed: mat.antennaLed,
        chestLeds: mat.chestLeds,
      },
      rest: REST,
      screenAspect: SCREEN_W / SCREEN_H,
    };
    return () => {
      rigRef.current = null;
    };
  }, [rigRef, mat]);

  // Chest logo: drawn onto the plate colour; plain plate if it fails.
  useEffect(() => {
    let alive = true;
    loadPlateTexture(logoUrl, BOT_COLORS.plate).then((tex) => {
      if (!alive) return tex?.dispose();
      if (!tex) return;
      mat.plate.map = tex;
      mat.plate.color.set("#ffffff");
      mat.plate.needsUpdate = true;
    });
    return () => {
      alive = false;
      mat.plate.map?.dispose();
      mat.plate.map = null;
      mat.plate.color.set(BOT_COLORS.plate);
    };
  }, [logoUrl, mat]);

  useEffect(() => () => disposeAssets(assets), [assets]);

  return (
    <group ref={root}>
      {/* Base: hexagonal dock with circuit traces */}
      <mesh geometry={geo.base} material={[mat.baseSide, mat.baseTop, mat.baseSide]} position-y={BASE.h / 2} rotation-y={Math.PI / 6} />
      <mesh geometry={geo.baseRim} material={mat.rim} position-y={BASE.h + 0.0005} rotation-x={Math.PI / 2} />

      <group ref={body} position-y={REST.bodyY}>
        {/* Feet + legs */}
        {[-1, 1].map((side) => (
          <group key={side} position-x={side * 0.17}>
            <mesh geometry={geo.foot} material={mat.graphite} position={[0, 0.16, 0.03]} />
            <mesh geometry={geo.leg} material={mat.joint} position-y={0.365} />
          </group>
        ))}

        {/* Torso, chest plate, LED strip */}
        <group position-y={TORSO.y}>
          <mesh geometry={geo.torso} material={mat.graphite} />
          <mesh geometry={geo.plate} material={mat.plate} position={[0, PLATE.y, TORSO.d / 2 - 0.005]} />
          <mesh geometry={geo.ledStrip} material={mat.joint} position={[0, -0.148, TORSO.d / 2 - 0.004]} />
          {mat.chestLeds.map((m, i) => (
            <mesh key={i} geometry={geo.led} material={m} position={[(i - 1) * 0.058, -0.148, TORSO.d / 2 + 0.008]} />
          ))}
        </group>

        {/* Arms */}
        <Arm side="R" shoulderRef={shoulderR} elbowRef={elbowR} geo={geo} mat={mat} />
        <Arm side="L" shoulderRef={shoulderL} elbowRef={elbowL} geo={geo} mat={mat} />

        {/* Neck */}
        <mesh geometry={geo.neck} material={mat.joint} position-y={1.2} />

        {/* Head (pivot at the top of the neck) */}
        <group ref={head} position-y={HEAD.pivotY}>
          <mesh geometry={geo.head} material={mat.graphite} position-y={HEAD_CY} />
          <mesh geometry={geo.bezel} material={mat.bezel} position={[0, HEAD_CY, HEAD_FRONT - 0.045]} />
          <mesh geometry={geo.screen} material={mat.screen} position={[0, HEAD_CY, HEAD_FRONT + 0.002]} />

          {/* Ears */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.64, HEAD_CY, 0]}>
              <mesh geometry={geo.ear} material={mat.graphite} rotation-z={Math.PI / 2} />
              <mesh geometry={geo.earCap} material={mat.joint} position-x={side * 0.06} rotation-z={Math.PI / 2} />
            </group>
          ))}

          {/* Antenna on the right ear with the "online" LED */}
          <group position={[-0.68, HEAD_CY + 0.13, 0]} rotation-z={0.22}>
            <mesh geometry={geo.antennaCollar} material={mat.joint} position-y={0.025} />
            <mesh geometry={geo.antennaRod} material={mat.graphite} position-y={0.22} />
            <mesh geometry={geo.antennaTip} material={mat.antennaLed} position-y={0.43} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Arm({
  side,
  shoulderRef,
  elbowRef,
  geo,
  mat,
}: {
  side: "L" | "R";
  shoulderRef: RefObject<THREE.Group | null>;
  elbowRef: RefObject<THREE.Group | null>;
  geo: Assets["geo"];
  mat: Assets["mat"];
}) {
  const s = side === "R" ? -1 : 1; // robot's right is -X
  const rest = side === "R" ? REST.armR : REST.armL;
  return (
    <group ref={shoulderRef} position={[s * 0.46, 1.02, 0]} rotation-z={rest.shoulderZ}>
      <mesh geometry={geo.shoulderBall} material={mat.joint} />
      <mesh geometry={geo.upperArm} material={mat.graphite} position-y={-0.14} />
      <group ref={elbowRef} position-y={-0.27} rotation-x={rest.elbowX}>
        <mesh geometry={geo.elbowBall} material={mat.joint} />
        <mesh geometry={geo.forearm} material={mat.graphite} position-y={-0.11} />
        <group position-y={-0.23}>
          <mesh geometry={geo.mitten} material={mat.graphite} position-y={-0.02} scale={[0.92, 1.05, 0.82]} />
          <mesh geometry={geo.thumb} material={mat.graphite} position={[-s * 0.065, 0.0, 0.035]} rotation-z={-s * 0.55} />
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------- assets */

type Assets = ReturnType<typeof buildAssets>;

function buildAssets() {
  const iris = createIrisLoopTexture();
  const circuit = createCircuitTexture();

  const geo = {
    head: new RoundedBoxGeometry(HEAD.w, HEAD.h, HEAD.d, 5, HEAD.r),
    bezel: bezelGeometry(),
    screen: screenGeometry(),
    ear: new THREE.CylinderGeometry(0.16, 0.16, 0.1, 32),
    earCap: new THREE.CylinderGeometry(0.1, 0.1, 0.03, 24),
    antennaCollar: new THREE.CylinderGeometry(0.032, 0.036, 0.05, 12),
    antennaRod: new THREE.CylinderGeometry(0.014, 0.014, 0.4, 8),
    antennaTip: new THREE.SphereGeometry(0.045, 16, 12),
    neck: new THREE.CylinderGeometry(0.1, 0.12, 0.14, 24),
    torso: new RoundedBoxGeometry(TORSO.w, TORSO.h, TORSO.d, 4, TORSO.r),
    plate: plateGeometry(),
    ledStrip: new RoundedBoxGeometry(0.2, 0.05, 0.02, 2, 0.01),
    led: new THREE.SphereGeometry(0.019, 12, 8),
    shoulderBall: new THREE.SphereGeometry(0.085, 20, 14),
    upperArm: new THREE.CapsuleGeometry(0.068, 0.1, 6, 16),
    elbowBall: new THREE.SphereGeometry(0.068, 18, 12),
    forearm: new THREE.CapsuleGeometry(0.062, 0.08, 6, 16),
    mitten: new THREE.SphereGeometry(0.088, 20, 14),
    thumb: new THREE.CapsuleGeometry(0.032, 0.04, 4, 10),
    leg: new THREE.CapsuleGeometry(0.095, 0.2, 6, 18),
    foot: new RoundedBoxGeometry(0.22, 0.1, 0.3, 3, 0.045),
    base: new THREE.CylinderGeometry(BASE.r, BASE.r + 0.04, BASE.h, 6, 1),
    baseRim: new THREE.TorusGeometry(BASE.r, 0.006, 4, 6),
  };

  const mat = {
    // Matte graphite shell, dark metallic joints, matte black plate.
    graphite: new THREE.MeshStandardMaterial({ color: BOT_COLORS.graphite, roughness: 0.62, metalness: 0.18 }),
    joint: new THREE.MeshStandardMaterial({ color: BOT_COLORS.joint, roughness: 0.34, metalness: 0.7 }),
    plate: new THREE.MeshStandardMaterial({ color: BOT_COLORS.plate, roughness: 0.7, metalness: 0.1 }),
    screen: new THREE.MeshPhysicalMaterial({
      color: BOT_COLORS.screen,
      roughness: 0.15,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      emissive: BOT_COLORS.face,
      emissiveIntensity: 1.15,
      toneMapped: false,
    }),
    bezel: new THREE.MeshPhysicalMaterial({
      color: BOT_COLORS.bezel,
      roughness: 0.28,
      metalness: 0.45,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      // No iridescence: the bezel is dark metal lit by a slow maroon → red sheen.
      emissive: 0xffffff,
      emissiveMap: iris,
      emissiveIntensity: 0.75,
      toneMapped: false,
    }),
    antennaLed: new THREE.MeshStandardMaterial({
      color: BOT_COLORS.onlineDim,
      emissive: BOT_COLORS.online,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      toneMapped: false,
    }),
    // One lit red status LED, two dim maroon ones.
    chestLeds: [BOT_COLORS.red, BOT_COLORS.maroon, BOT_COLORS.maroon].map(
      (c) =>
        new THREE.MeshStandardMaterial({ color: "#0b0b0b", emissive: c, emissiveIntensity: 1.6, toneMapped: false }),
    ),
    // Diffuse only: a PBR top, seen at this grazing angle, turns into one
    // big red sheen from the rim light and hides the traces.
    baseTop: new THREE.MeshLambertMaterial({
      color: BOT_COLORS.baseTop,
      emissive: 0xffffff,
      emissiveMap: circuit,
      emissiveIntensity: 0.6,
    }),
    baseSide: new THREE.MeshStandardMaterial({ color: BOT_COLORS.baseSide, roughness: 0.5, metalness: 0.4 }),
    rim: new THREE.MeshBasicMaterial({ color: BOT_COLORS.red, transparent: true, opacity: 0.4, toneMapped: false }),
  };

  return { geo, mat, textures: [iris, circuit] };
}

function disposeAssets({ geo, mat, textures }: Assets) {
  Object.values(geo).forEach((g) => g.dispose());
  Object.values(mat)
    .flat()
    .forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

/* --------------------------------------------------------- shape helpers */

function roundedRect<T extends THREE.Path>(path: T, w: number, h: number, r: number): T {
  const x = -w / 2;
  const y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x + w, y + h - r);
  path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  path.lineTo(x + r, y + h);
  path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r);
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return path;
}

/** Rounded-rectangle frame. U = angle around the centre, so the iris gradient runs around it. */
function bezelGeometry() {
  const shape = roundedRect(new THREE.Shape(), BEZEL.w, BEZEL.h, BEZEL.r);
  shape.holes.push(
    roundedRect(new THREE.Path(), BEZEL.w - 2 * BEZEL.frame, BEZEL.h - 2 * BEZEL.frame, BEZEL.r - BEZEL.frame + 0.01),
  );
  const extruded = new THREE.ExtrudeGeometry(shape, {
    depth: BEZEL.depth,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 10,
  });
  const geo = extruded.index ? extruded.toNonIndexed() : extruded;
  if (geo !== extruded) extruded.dispose();

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, Math.atan2(pos.getY(i), pos.getX(i)) / (Math.PI * 2) + 0.5, 0.5);
  }
  // Triangles straddling the seam (u jumps 1 → 0) would sweep the whole
  // gradient; lift their low side past 1 (the texture repeats seamlessly).
  for (let i = 0; i < pos.count; i += 3) {
    const u = [uv.getX(i), uv.getX(i + 1), uv.getX(i + 2)];
    if (Math.max(...u) - Math.min(...u) > 0.5) {
      for (let k = 0; k < 3; k++) if (u[k] < 0.5) uv.setX(i + k, u[k] + 1);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

/** Flat screen panel with UVs spanning the longer side 0–1 (no stretching of the face). */
function screenGeometry() {
  const shape = roundedRect(new THREE.Shape(), SCREEN_W, SCREEN_H, BEZEL.r - BEZEL.frame + 0.012);
  const geo = new THREE.ShapeGeometry(shape, 12);
  const span = Math.max(SCREEN_W, SCREEN_H);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, 0.5 + pos.getX(i) / span, 0.5 + pos.getY(i) / span);
  }
  uv.needsUpdate = true;
  return geo;
}

/** Thin chest plate; UVs map the plate rectangle to 0–1 for the logo canvas. */
function plateGeometry() {
  const shape = roundedRect(new THREE.Shape(), PLATE.w, PLATE.h, 0.035);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false, curveSegments: 8 });
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, 0.5 + pos.getX(i) / PLATE.w, 0.5 + pos.getY(i) / PLATE.h);
  }
  uv.needsUpdate = true;
  return geo;
}

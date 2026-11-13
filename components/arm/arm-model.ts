import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { ARM_DIM, type Vec3 } from "@/lib/arm";
import { COLORS } from "@/lib/tokens";

/**
 * The industrial arm built in code (DESIGN.md §22): a six-axis arm with turned and cast parts, finned servo motors,
 * cap screws, cable runs that flex with the joints and a parallel two-finger gripper. Geometry and materials only;
 * IndustrialArm moves it. A .glb can replace this file: fill an ArmRig with the same joint nodes.
 *
 * Units and frames follow lib/arm.ts and kinematics.ts: base on y = 0, facing +Z at J1 = 0.
 */

/** Arm-only material colours (not UI tokens): graphite paint, cast black, brushed aluminium; red only for details. */
export const ARM_COLORS = {
  paint: "#44464C",
  cast: "#1B1C1F",
  aluminium: "#B7BAC0",
  steel: "#86898F",
  rubber: "#0C0C0D",
  red: COLORS.red,
} as const;

export type ArmQuality = "high" | "low";

export interface ArmRig {
  /** Placed and scaled by the controller. */
  root: THREE.Group;
  /** Joint nodes: J1 (rotation.y), J2 (rotation.x = −angle), J3 (rotation.x), J4 (rotation.z), J5 (rotation.x), J6 (rotation.z). */
  joints: [THREE.Object3D, THREE.Object3D, THREE.Object3D, THREE.Object3D, THREE.Object3D, THREE.Object3D];
  /** Gripper fingers, each slid along its x by `side × gap`. */
  fingers: { node: THREE.Object3D; side: 1 | -1 }[];
  /** Re-shape the flexible cables after the joints moved. */
  updateCables(): void;
  dispose(): void;
}

const { shoulderH: SH, shoulderOff: OFF, upper: L1, fore: L2, rollAt: ROLL } = ARM_DIM;
const WRIST_Z = L2 - ROLL;
/** The wrist group's scale: its fingertips end (0.07 + 0.277) × this from the wrist centre (ARM_DIM.tool). */
const WRIST_SCALE = 1.35;

/** Finger gap: centre offset when closed, and the extra travel when fully open. */
const FINGER = { closed: 0.0205, travel: 0.055 };

/** Writes joint angles (J1–J6, gripper) into the rig. */
export function applyJoints(rig: ArmRig, j: ArrayLike<number>) {
  const [n1, n2, n3, n4, n5, n6] = rig.joints;
  n1.rotation.y = j[0];
  n2.rotation.x = -j[1];
  n3.rotation.x = j[2];
  n4.rotation.z = j[3];
  n5.rotation.x = j[4];
  n6.rotation.z = j[5];
  for (const f of rig.fingers) f.node.position.x = f.side * (FINGER.closed + FINGER.travel * (1 - j[6]));
}

export function buildArm(quality: ArmQuality): ArmRig {
  const seg = quality === "high" ? 48 : 28;
  const shadows = quality === "high";
  const owned: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => {
    owned.push(x);
    return x;
  };
  const mat = materials(keep);

  const mesh = (geo: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, pos?: Vec3) => {
    const m = new THREE.Mesh(keep(geo), material);
    if (pos) m.position.set(...pos);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
  };
  const box = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 3, r);
  const lathe = (profile: [number, number][]) =>
    new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      seg,
    );
  const cylX = (r: number, len: number) => new THREE.CylinderGeometry(r, r, len, seg).rotateZ(-Math.PI / 2);
  const cylY = (r: number, len: number) => new THREE.CylinderGeometry(r, r, len, seg);
  const cylZ = (r: number, len: number) => new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2);
  /** A finned servo motor along X, centred. */
  const motorX = (r: number, len: number) => lathe(motorProfile(r, len)).rotateZ(-Math.PI / 2).translate(-len / 2, 0, 0);

  const screwGeo = keep(new THREE.CylinderGeometry(0.0115, 0.0115, 0.009, 14));
  const socketGeo = keep(new THREE.CylinderGeometry(0.0055, 0.0055, 0.0095, 6));
  /** Socket-head cap screws at `points`, their heads facing along `axis`. */
  const screws = (parent: THREE.Object3D, points: Vec3[], axis: Vec3, size = 1) => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...axis).normalize());
    const s = new THREE.Vector3(size, size, size);
    const m4 = new THREE.Matrix4();
    for (const [geo, material] of [
      [screwGeo, mat.steel],
      [socketGeo, mat.rubber],
    ] as const) {
      const im = new THREE.InstancedMesh(geo, material, points.length);
      points.forEach((p, i) => im.setMatrixAt(i, m4.compose(new THREE.Vector3(...p), q, s)));
      im.receiveShadow = shadows;
      parent.add(im);
    }
  };

  const root = new THREE.Group();
  root.name = "arm";

  /* ------------------------------------------------------------ fixed base */
  mesh(
    lathe([
      [0, 0],
      [0.6, 0],
      [0.64, 0.02],
      [0.64, 0.06],
      [0.61, 0.085],
      [0, 0.085],
    ]),
    mat.cast,
    root,
  );
  screws(root, ring(8, 0.55, "y", [0, 0.09, 0], Math.PI / 8), [0, 1, 0], 1.6);
  mesh(
    lathe([
      [0, 0.085],
      [0.47, 0.085],
      [0.47, 0.13],
      [0.44, 0.15],
      [0.44, 0.2],
      [0, 0.2],
    ]),
    mat.paint,
    root,
  );
  // J1 bearing ring.
  mesh(
    lathe([
      [0.445, 0.198],
      [0.463, 0.203],
      [0.463, 0.229],
      [0.445, 0.234],
    ]),
    mat.alu,
    root,
  );
  // Status LED on the base's front, and the cable connector at its back.
  mesh(box(0.09, 0.02, 0.02, 0.007), mat.led, root, [0, 0.168, 0.438]);
  mesh(box(0.17, 0.09, 0.11, 0.015), mat.cast, root, [0.27, 0.13, -0.36]);
  mesh(cylZ(0.03, 0.05), mat.alu, root, [0.27, 0.13, -0.43]);
  // Shadow catcher under the arm (high quality only).
  if (shadows) {
    const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2)), mat.floor);
    floor.receiveShadow = true;
    floor.position.y = 0.001;
    root.add(floor);
  }

  /* --------------------------------------------------------- J1: turret */
  const turret = new THREE.Group();
  root.add(turret);
  mesh(
    lathe([
      [0, 0.232],
      [0.43, 0.232],
      [0.425, 0.3],
      [0.39, 0.46],
      [0.35, 0.5],
      [0, 0.5],
    ]),
    mat.paint,
    turret,
  );
  // J1 motor at the back, half sunk into the turret.
  mesh(lathe(motorProfile(0.105, 0.27)).translate(0, 0.27, 0), mat.cast, turret, [0, 0, -0.38]);
  mesh(cylY(0.109, 0.018), mat.red, turret, [0, 0.47, -0.38]);
  mesh(cylY(0.095, 0.02), mat.alu, turret, [0, 0.55, -0.38]);
  screws(turret, ring(4, 0.065, "y", [0, 0.562, -0.38], Math.PI / 4), [0, 1, 0]);
  // Shoulder cheeks holding the J2 axis.
  for (const side of [-1, 1]) mesh(box(0.085, 0.36, 0.38, 0.03), mat.paint, turret, [side * 0.205, SH - 0.06, OFF]);
  // J2 servo on the arm's +X side (the side the camera sees).
  mesh(motorX(0.165, 0.2), mat.cast, turret, [0.345, SH, OFF]);
  mesh(cylX(0.171, 0.022), mat.red, turret, [0.262, SH, OFF]);
  mesh(cylX(0.145, 0.024), mat.alu, turret, [0.456, SH, OFF]);
  screws(turret, ring(6, 0.11, "x", [0.469, SH, OFF]), [1, 0, 0]);

  /* -------------------------------------------------- J2: upper arm */
  const shoulder = new THREE.Group();
  shoulder.position.set(0, SH, OFF);
  turret.add(shoulder);
  mesh(cylX(0.19, 0.31), mat.paint, shoulder);
  mesh(taperedBox(0.24, 0.3, 0.17, 0.22, L1, 0.06), mat.paint, shoulder);
  // Inset service cover on the +X face, with four screws.
  mesh(box(0.012, 0.17, 0.62, 0.005), mat.cast, shoulder, [0.108, 0, 0.55]);
  screws(
    shoulder,
    [
      [0.115, 0.068, 0.27],
      [0.115, -0.068, 0.27],
      [0.115, 0.068, 0.83],
      [0.115, -0.068, 0.83],
    ],
    [1, 0, 0],
  );
  mesh(cylX(0.15, 0.25), mat.paint, shoulder, [0, 0, L1]);
  // Cable run along the top, held by three clips.
  const topCable = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.06, 0.168, 0.15),
    new THREE.Vector3(0.06, 0.152, 0.55),
    new THREE.Vector3(0.06, 0.134, L1 - 0.1),
  ]);
  mesh(new THREE.TubeGeometry(topCable, 24, 0.02, 8, false), mat.rubber, shoulder);
  for (const z of [0.25, 0.55, 0.85]) mesh(box(0.06, 0.018, 0.035, 0.006), mat.alu, shoulder, [0.06, 0.168 - z * 0.03, z]);

  /* ------------------------------------------------------ J3: elbow */
  const elbow = new THREE.Group();
  elbow.position.set(0, 0, L1);
  shoulder.add(elbow);
  // Forearm housing (holds the J4 motor), running back past the elbow.
  mesh(box(0.21, 0.23, 0.52, 0.07), mat.paint, elbow, [0, 0, 0.05]);
  mesh(motorX(0.125, 0.17), mat.cast, elbow, [0.21, 0, 0]);
  mesh(cylX(0.13, 0.02), mat.red, elbow, [0.135, 0, 0]);
  mesh(cylX(0.108, 0.022), mat.alu, elbow, [0.305, 0, 0]);
  screws(elbow, ring(6, 0.08, "x", [0.317, 0, 0]), [1, 0, 0]);
  // J4 bearing ring.
  mesh(cylZ(0.104, 0.03), mat.alu, elbow, [0, 0, ROLL - 0.015]);

  /* ---------------------------------------------------- J4: forearm */
  const roll = new THREE.Group();
  roll.position.set(0, 0, ROLL);
  elbow.add(roll);
  mesh(
    lathe([
      [0, 0],
      [0.115, 0],
      [0.115, 0.06],
      [0.095, WRIST_Z - 0.15],
      [0.088, WRIST_Z - 0.11],
      [0, WRIST_Z - 0.11],
    ]).rotateX(Math.PI / 2),
    mat.paint,
    roll,
  );
  // Wrist yoke and its pivot caps.
  for (const side of [-1, 1]) {
    mesh(box(0.034, 0.13, 0.21, 0.014), mat.paint, roll, [side * 0.1, 0, WRIST_Z - 0.045]);
    mesh(cylX(0.05, 0.012), mat.alu, roll, [side * 0.123, 0, WRIST_Z]);
  }
  screws(roll, [[0.13, 0, WRIST_Z]], [1, 0, 0]);
  screws(roll, [[-0.13, 0, WRIST_Z]], [-1, 0, 0]);

  /* ------------------------------------------------------ J5: wrist */
  // The wrist, flange and gripper are modelled small and scaled up together (WRIST_SCALE).
  const wrist = new THREE.Group();
  wrist.position.set(0, 0, WRIST_Z);
  wrist.scale.setScalar(WRIST_SCALE);
  roll.add(wrist);
  mesh(cylX(0.062, 0.12), mat.cast, wrist);
  mesh(cylZ(0.05, 0.07), mat.cast, wrist, [0, 0, 0.035]);

  /* ---------------------------------------------- J6: flange, gripper */
  const flange = new THREE.Group();
  flange.position.set(0, 0, 0.07);
  wrist.add(flange);
  mesh(cylZ(0.064, 0.02), mat.alu, flange, [0, 0, 0.01]);
  screws(flange, ring(6, 0.048, "z", [0, 0, 0.022]), [0, 0, 1], 0.8);
  mesh(box(0.19, 0.075, 0.085, 0.015), mat.cast, flange, [0, 0, 0.0645]);
  mesh(box(0.07, 0.006, 0.05, 0.002), mat.red, flange, [0, 0.0385, 0.0645]);
  for (const side of [-1, 1]) mesh(cylY(0.008, 0.02), mat.alu, flange, [side * 0.05, 0.047, 0.06]);
  mesh(box(0.2, 0.028, 0.02, 0.004), mat.alu, flange, [0, 0, 0.117]);
  const fingers: ArmRig["fingers"] = [];
  for (const side of [-1, 1] as const) {
    const f = new THREE.Group();
    flange.add(f);
    mesh(box(0.04, 0.045, 0.03, 0.006), mat.steel, f, [0, 0, 0.135]);
    mesh(box(0.028, 0.05, 0.15, 0.008), mat.alu, f, [0, 0, 0.202]);
    mesh(box(0.006, 0.042, 0.075, 0.002), mat.rubber, f, [-side * 0.0165, 0, 0.235]);
    fingers.push({ node: f, side });
  }

  /* ----------------------------------------------- flexible cables */
  const anchor = (parent: THREE.Object3D, pos: Vec3, dir: Vec3) => {
    const a = new THREE.Object3D();
    a.position.set(...pos);
    a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...dir).normalize());
    parent.add(a);
    return a;
  };
  const cables = [
    // Turret to the upper arm's side: a loop that hangs out on the camera side.
    { a: anchor(turret, [0.3, 0.42, -0.1], [0.4, 1, 0.1]), b: anchor(shoulder, [0.125, 0, 0.3], [0.6, -0.2, -1]), r: 0.024, sag: 0.14 },
    // Over the elbow, from the top run to the forearm housing.
    { a: anchor(shoulder, [0.06, 0.134, L1 - 0.1], [0, 0.4, 1]), b: anchor(elbow, [0.06, 0.125, 0.18], [0, 0.5, -1]), r: 0.02, sag: 0.03 },
    // Under the forearm to the wrist.
    { a: anchor(roll, [0, -0.085, 0.12], [0, -0.3, 1]), b: anchor(wrist, [0, -0.06, -0.02], [0, -0.5, -1]), r: 0.014, sag: 0.08 },
  ].map((c) => {
    const pts = [0, 1, 2, 3, 4].map(() => new THREE.Vector3());
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    pts.forEach((p, i) => p.set(0, i * 0.1, 0));
    const m = mesh(new THREE.TubeGeometry(curve, 24, c.r, 7, false), mat.rubber, root);
    m.frustumCulled = false;
    return { ...c, pts, curve, mesh: m };
  });

  const n0 = new THREE.Vector3();
  const n4 = new THREE.Vector3();
  const updateCables = () => {
    for (const c of cables) {
      const [p0, p1, p2, p3, p4] = c.pts;
      root.worldToLocal(c.a.getWorldPosition(p0));
      root.worldToLocal(c.b.getWorldPosition(p4));
      // The root only moves and scales uniformly, so world directions are its directions too.
      c.a.getWorldDirection(n0);
      c.b.getWorldDirection(n4);
      const len = p0.distanceTo(p4);
      p1.copy(p0).addScaledVector(n0, len * 0.28);
      p3.copy(p4).addScaledVector(n4, len * 0.28);
      p2.copy(p1).add(p3).multiplyScalar(0.5);
      p2.y -= c.sag * len;
      const next = new THREE.TubeGeometry(c.curve, 24, c.r, 7, false);
      const geo = c.mesh.geometry;
      (geo.attributes.position.array as Float32Array).set(next.attributes.position.array as Float32Array);
      (geo.attributes.normal.array as Float32Array).set(next.attributes.normal.array as Float32Array);
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;
      next.dispose();
    }
  };

  return {
    root,
    joints: [turret, shoulder, elbow, roll, wrist, flange],
    fingers,
    updateCables,
    dispose: () => owned.forEach((o) => o.dispose()),
  };
}

/* ---------------------------------------------------------------- helpers */

function materials(keep: <T extends { dispose(): void }>(x: T) => T) {
  const brushed = keep(brushedTexture());
  return {
    paint: keep(
      new THREE.MeshPhysicalMaterial({
        color: ARM_COLORS.paint,
        metalness: 0.45,
        roughness: 0.38,
        clearcoat: 0.6,
        clearcoatRoughness: 0.28,
      }),
    ),
    cast: keep(new THREE.MeshStandardMaterial({ color: ARM_COLORS.cast, metalness: 0.7, roughness: 0.5 })),
    // Brushed: the texture streaks run around turned parts (lathe U), like a lathe finish.
    alu: keep(
      new THREE.MeshStandardMaterial({ color: ARM_COLORS.aluminium, metalness: 1, roughness: 0.62, roughnessMap: brushed }),
    ),
    steel: keep(new THREE.MeshStandardMaterial({ color: ARM_COLORS.steel, metalness: 1, roughness: 0.3 })),
    rubber: keep(new THREE.MeshStandardMaterial({ color: ARM_COLORS.rubber, metalness: 0, roughness: 0.8 })),
    red: keep(
      new THREE.MeshPhysicalMaterial({
        color: ARM_COLORS.red,
        metalness: 0.3,
        roughness: 0.4,
        clearcoat: 0.5,
        clearcoatRoughness: 0.25,
      }),
    ),
    led: keep(new THREE.MeshStandardMaterial({ color: "#1A0606", emissive: ARM_COLORS.red, emissiveIntensity: 2 })),
    floor: keep(new THREE.ShadowMaterial({ opacity: 0.5 })),
  };
}

/** Roughness map for brushed aluminium: fine streaks around a mid grey (the material's roughness scales it). */
function brushedTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgb(128,128,128)";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const v = 95 + Math.floor(Math.random() * 80);
    g.fillStyle = `rgba(${v},${v},${v},0.35)`;
    g.fillRect(0, Math.random() * 256, 256, 0.3 + Math.random() * 1.4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Lathe profile (radius, height) of a servo motor `len` long with cooling fins, from y = 0. */
function motorProfile(r: number, len: number): [number, number][] {
  const pts: [number, number][] = [
    [0, 0],
    [r * 0.9, 0],
    [r, len * 0.05],
  ];
  for (let i = 0; i < 6; i++) {
    const y = len * (0.15 + (i * 0.7) / 6);
    pts.push([r, y], [r * 0.94, y + len * 0.02], [r * 0.94, y + len * 0.07], [r, y + len * 0.09]);
  }
  pts.push([r, len * 0.95], [r * 0.9, len], [0, len]);
  return pts;
}

/** A rounded box along +Z from 0 to `len`, narrowing from w0 × h0 to w1 × h1. */
function taperedBox(w0: number, h0: number, w1: number, h1: number, len: number, r: number) {
  const g = new RoundedBoxGeometry(w0, h0, len, 4, r);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getZ(i) / len + 0.5;
    p.setX(i, p.getX(i) * (1 + (w1 / w0 - 1) * t));
    p.setY(i, p.getY(i) * (1 + (h1 / h0 - 1) * t));
  }
  return g.translate(0, 0, len / 2);
}

/** `count` points on a circle of `radius` around `axis` through `centre`. */
function ring(count: number, radius: number, axis: "x" | "y" | "z", centre: Vec3, phase = 0): Vec3[] {
  return Array.from({ length: count }, (_, i) => {
    const a = phase + (i / count) * Math.PI * 2;
    const u = Math.cos(a) * radius;
    const v = Math.sin(a) * radius;
    const [x, y, z] = centre;
    if (axis === "x") return [x, y + u, z + v];
    if (axis === "y") return [x + u, y, z + v];
    return [x + u, y + v, z];
  });
}

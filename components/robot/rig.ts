import type * as THREE from "three";

/**
 * The contract between a robot MODEL and the robot's BEHAVIOUR.
 *
 * geometry.tsx builds the robot from primitives and fills this in. A Blender
 * or Spline .glb can replace it later: load the file, find the nodes and
 * materials listed here (suggested node names in brackets), and hand back
 * the same object. ClubBot's face and animation code only ever touch the rig.
 */
export interface BotRig {
  /** [root] Whole robot including the base (ClubBot applies botTransform on a wrapper around it). */
  root: THREE.Group;
  /** [body] Everything above the base. Floats, and turns at 30% of the head. */
  body: THREE.Group;
  /** [head] Pivot at the top of the neck. Yaw / pitch / roll. */
  head: THREE.Group;
  /** [shoulder_L / elbow_L], robot's left (screen right). */
  armL: ArmRig;
  /** [shoulder_R / elbow_R], robot's right (screen left). Waves. */
  armR: ArmRig;
  materials: {
    /** [screen] Face is drawn into its emissiveMap. Needs 0–1 UVs across the screen. */
    screen: THREE.MeshPhysicalMaterial;
    /** [bezel] Iris emissive gradient; U runs around the frame. */
    bezel: THREE.MeshPhysicalMaterial;
    /** [antenna_led] Pulses deep red every 2s. */
    antennaLed: THREE.MeshStandardMaterial;
    /** [chest_led_1..3] Red, maroon, maroon. */
    chestLeds: THREE.MeshStandardMaterial[];
  };
  /** Rest pose the animation adds offsets to. */
  rest: {
    bodyY: number;
    armL: { shoulderZ: number; elbowX: number };
    armR: { shoulderZ: number; elbowX: number };
  };
  /** Screen opening aspect (width / height), for laying out the face. */
  screenAspect: number;
}

export interface ArmRig {
  shoulder: THREE.Group;
  elbow: THREE.Group;
}

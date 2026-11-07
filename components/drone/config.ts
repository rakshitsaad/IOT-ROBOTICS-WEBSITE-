import { COLORS } from "@/lib/tokens";

/**
 * Drone constants (DESIGN.md §12 "Mission Control"). Colours follow the site palette: the reference's cyan lights
 * are deep red here, its violet is maroon. The body is the one light material (a cool light grey, like brushed
 * aluminium), so the drone reads against the black dashboard.
 */
export const DRONE_COLORS = {
  body: "#C9CBD1",
  /** Glossy top panel and camera housing. */
  panel: "#0E0E10",
  arm: "#2A2A2D",
  pod: "#1A1A1C",
  blade: "#141416",
  /** Lights (rotor rings, lens, beam, trail, globe): emissive, pushed above 1 so only they bloom. */
  light: COLORS.red,
  /** Second particle colour and the globe's city points. */
  white: COLORS.text,
  maroon: COLORS.maroon,
} as const;

/** HDR multipliers: how far past 1.0 each light is pushed (only these cross the bloom threshold). */
export const GLOW = { ring: 5, lens: 6, led: 3.2, beam: 1.6, trail: 2.4, globe: 2.2, streak: 3 } as const;

/** Camera: straight at the dashboard plane (z = 0), so DOM rects map linearly onto it. */
export const DRONE_CAMERA = { fov: 30, z: 10 } as const;

/** Geometry (world units). The drone is about 1.6 units across, rotor tip to rotor tip on the diagonal. */
export const DRONE_SIZE = {
  armReach: 0.58,
  rotor: 0.22,
  body: { w: 0.5, h: 0.15, d: 0.64, r: 0.07 },
} as const;

/** Flight feel. */
export const FLIGHT = {
  /** Spring stiffness (1/s²) and damping ratio for position (slightly under-damped: settles with a small overshoot). */
  stiffness: 14,
  damping: 0.82,
  /** Base pitch so we see the drone from a little above, like the reference (rad). */
  pitch: 0.42,
  /** Max tilt from motion, ~20°. */
  maxTilt: (20 * Math.PI) / 180,
  /** Tilt per unit of velocity and of acceleration. */
  tiltVel: 0.11,
  tiltAcc: 0.016,
  /** Yaw into lateral motion (rad per unit/s), capped. */
  yawVel: 0.12,
  maxYaw: 0.5,
  /** Hover bob amplitude (units). */
  bob: 0.035,
  /** Depth the drone flies at in front of the dashboard (units; the dashboard is z = 0). */
  z: 1,
  /** Flip: duration (s) and particle burst. */
  flip: 0.75,
  burst: 140,
  /** Beam switches on once the drone is within this many px of its scan point. */
  beamReach: 46,
} as const;

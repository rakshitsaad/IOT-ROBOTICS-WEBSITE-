import { COLORS } from "@/lib/tokens";

/**
 * Material colours for the 3D robot: matte black, graphite and dark metallic
 * grey, with restrained deep red details (bezel, LEDs, dock traces). The red
 * comes from the brand tokens; the rest are robot-only materials (documented
 * in DESIGN.md → Robot).
 */
export const BOT_COLORS = {
  /** Matte graphite shell (head, torso, limbs). */
  graphite: "#424244",
  /** Joints, neck, ear caps: dark metallic grey. */
  joint: "#232325",
  /** Chest plate behind the logo: matte black. */
  plate: "#161616",
  /** Glossy screen glass. */
  screen: "#050505",
  /** Bezel base colour under the emissive sheen. */
  bezel: "#121212",
  /** Base plate top and sides. */
  baseTop: "#121212",
  baseSide: "#1E1E1F",
  /** The face on the screen: warm white, not pure white. */
  face: COLORS.text,
  /** "Device online" antenna LED: deep red, and its unlit glass. */
  online: COLORS.red,
  onlineDim: "#1A0707",
  red: COLORS.red,
  maroon: COLORS.maroon,
} as const;

import { ACCENTS } from "@/lib/tokens";

/**
 * Material colours for the 3D robot. Accents come from the brand tokens;
 * the rest are robot-only materials (documented in DESIGN.md → Robot).
 */
export const BOT_COLORS = {
  /** Matte warm graphite shell (head, torso, limbs). */
  graphite: "#6F6863",
  /** Joints, neck, ear caps. */
  joint: "#2A282C",
  /** Chest plate behind the logo. */
  plate: "#3B3734",
  /** Glossy screen glass. */
  screen: "#050507",
  /** Bezel base colour under the emissive gradient. */
  bezel: "#121218",
  /** Base plate top and sides. */
  baseTop: "#17161A",
  baseSide: "#2B282B",
  /** "Device online" antenna LED. */
  online: "#38FF8E",
  onlineDim: "#0C2416",
  blue: ACCENTS.blue,
  violet: ACCENTS.violet,
  coral: ACCENTS.coral,
} as const;

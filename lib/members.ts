import type { Member } from "./types";

/**
 * /members page config (DESIGN.md §13). Pure data and helpers, no React.
 */

/**
 * The Senior Core's term. Update once a year (or move it into `settings`
 * when Supabase lands); it is a constant because reading the clock would
 * keep the page out of the static shell.
 */
export const SENIOR_CORE_TERM = { label: "2026-27", year: 2026 } as const;

/** The four spread layouts, cycled by position: Split, Vertical, Cutout, Stacked. */
export type SeniorLayout = "split" | "vertical" | "cutout" | "stacked";
const CYCLE: SeniorLayout[] = ["split", "vertical", "cutout", "stacked"];

/** Layout for the senior at `index` (0-based). The cutout spread needs a cutout_url, else it falls back to split. */
export function seniorLayout(member: Member, index: number): SeniorLayout {
  const layout = CYCLE[index % CYCLE.length];
  return layout === "cutout" && !member.cutout_url ? "split" : layout;
}

/**
 * The name as display lines: first words, then the last word. A one-word
 * name is split in half (the "EDIT / ORIAL" break of the vertical spread).
 */
export function nameLines(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length > 1) return [words.slice(0, -1).join(" "), words[words.length - 1]];
  const word = words[0] ?? "";
  const cut = Math.ceil(word.length / 2);
  return [word.slice(0, cut), word.slice(cut)];
}

/**
 * Advance widths of Bodoni Moda capitals (weight 500), in em, measured in the
 * browser. Names are sized from these so the longest line exactly fills its
 * column, whatever its letters (I is 0.32em, W 1.06em).
 */
const BODONI_CAPS: Record<string, number> = {
  A: 0.774, B: 0.684, C: 0.797, D: 0.788, E: 0.598, F: 0.56, G: 0.829, H: 0.803, I: 0.32,
  J: 0.641, K: 0.703, L: 0.549, M: 0.937, N: 0.858, O: 0.865, P: 0.649, Q: 0.865, R: 0.71,
  S: 0.682, T: 0.609, U: 0.785, V: 0.719, W: 1.056, X: 0.705, Y: 0.654, Z: 0.652,
  " ": 0.211, "-": 0.506, "'": 0.264, ".": 0.26,
};
/** Unknown characters (accents, other scripts) count as a wide capital. */
const FALLBACK_EM = 0.86;
/** Names are tracked -0.01em; 4% spare covers rounding and optical-size changes. */
const TRACKING = -0.01;
const SAFETY = 1.04;

/** Width of the widest line in em when set in Bodoni Moda capitals. */
export function capsWidth(lines: readonly string[]): number {
  const width = (line: string) =>
    Array.from(line.toUpperCase()).reduce((w, ch) => w + (BODONI_CAPS[ch] ?? FALLBACK_EM) + TRACKING, 0);
  return Math.max(0.5, ...lines.map(width)) * SAFETY;
}

/** The first profile link, for the "Connect" link. */
export function primarySocial(member: Member): { label: string; href: string } | null {
  const { linkedin, github, instagram } = member.socials;
  if (linkedin) return { label: "LinkedIn", href: linkedin };
  if (github) return { label: "GitHub", href: github };
  if (instagram) return { label: "Instagram", href: instagram };
  return null;
}

export interface SocialLink {
  network: keyof Member["socials"];
  /** Mono abbreviation (Senior Core): LI, GH, IG. */
  short: string;
  label: string;
  href: string;
}

/** A member's profile links, in order: LinkedIn, GitHub, Instagram (only the ones they have). */
export function socialLinks(member: Member): SocialLink[] {
  const { linkedin, github, instagram } = member.socials;
  const links: (SocialLink | null)[] = [
    linkedin ? { network: "linkedin", short: "LI", label: "LinkedIn", href: linkedin } : null,
    github ? { network: "github", short: "GH", label: "GitHub", href: github } : null,
    instagram ? { network: "instagram", short: "IG", label: "Instagram", href: instagram } : null,
  ];
  return links.filter((s): s is SocialLink => s !== null);
}

/* ------------------------------------------------------------ Junior Core */

/**
 * Junior Core (DESIGN.md §13): one accordion per team. A team with more than
 * `perLine` members continues on another line of the same accordion.
 */
export const JUNIOR_CORE = { perLine: 8 } as const;

/** Id of a team's row on /members, the target of its filter pill. */
export const juniorRowId = (slug: string) => `jc-${slug}`;

/** "Ananya Gupta" → "Ananya" (the vertical label on a collapsed card). */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Ananya Gupta" → "AG"; one word gives one letter. For the avatar shown when there is no photo. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Splits a list into lines of at most `size`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const lines: T[][] = [];
  for (let i = 0; i < items.length; i += size) lines.push(items.slice(i, i + size));
  return lines;
}

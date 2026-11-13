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

/** The four spread layouts. Every senior uses Split (same big portrait); add layouts to CYCLE to mix them by position again. */
export type SeniorLayout = "split" | "vertical" | "cutout" | "stacked";
const CYCLE: SeniorLayout[] = ["split"];

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
 * Advance widths of Instrument Serif capitals (weight 400), in em, measured in the
 * browser. Names are sized from these so the longest line never overflows its
 * column, whatever its letters (I is 0.25em, M 0.66em).
 */
const SERIF_CAPS: Record<string, number> = {
  A: 0.431, B: 0.47, C: 0.48, D: 0.52, E: 0.453, F: 0.408, G: 0.507, H: 0.546, I: 0.249,
  J: 0.249, K: 0.484, L: 0.413, M: 0.657, N: 0.54, O: 0.53, P: 0.466, Q: 0.53, R: 0.501,
  S: 0.401, T: 0.461, U: 0.536, V: 0.441, W: 0.635, X: 0.48, Y: 0.413, Z: 0.427,
  " ": 0.17, "-": 0.43, "'": 0.233, ".": 0.213,
};
/** Unknown characters (accents, other scripts) count as a wide capital. */
const FALLBACK_EM = 0.6;
/** Names are tracked -0.01em; 4% spare covers rounding. */
const TRACKING = -0.01;
const SAFETY = 1.04;

/** Width of the widest line in em when set in Instrument Serif capitals. */
export function capsWidth(lines: readonly string[]): number {
  const width = (line: string) =>
    Array.from(line.toUpperCase()).reduce((w, ch) => w + (SERIF_CAPS[ch] ?? FALLBACK_EM) + TRACKING, 0);
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

/**
 * Junior Core section titles. Tech and Research are one department, as are Social Media and
 * Multimedia, so each pair shares one section (the Tech and Social Media teams' rows).
 */
const JUNIOR_SECTION_NAME: Record<string, string> = { Tech: "Tech & Research", "Social Media": "Social Media & Multimedia", PR: "PR & Outreach" };
export const juniorSectionName = (team: string) => JUNIOR_SECTION_NAME[team] ?? team;

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

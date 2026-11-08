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

export interface SocialLink {
  network: keyof Member["socials"];
  label: string;
  href: string;
}

/** A member's profile links, in order: LinkedIn, GitHub, Instagram (only the ones they have). */
export function socialLinks(member: Member): SocialLink[] {
  const { linkedin, github, instagram } = member.socials;
  const links: (SocialLink | null)[] = [
    linkedin ? { network: "linkedin", label: "LinkedIn", href: linkedin } : null,
    github ? { network: "github", label: "GitHub", href: github } : null,
    instagram ? { network: "instagram", label: "Instagram", href: instagram } : null,
  ];
  return links.filter((s): s is SocialLink => s !== null);
}

/* ------------------------------------------------------------ Junior Core */

/** Id of a team's section on /members, the target of its jump link. */
export const juniorRowId = (slug: string) => `jc-${slug}`;

/** "Ananya Gupta" → "AG"; one word gives one letter. For the avatar shown when there is no photo. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

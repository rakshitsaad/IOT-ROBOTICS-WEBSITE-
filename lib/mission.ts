import type { LabDomain } from "./home";

/**
 * The /lab/drone bench (DESIGN.md §18): the drone flies over a dashboard of club stats.
 * Client-safe config and types; the numbers come from getMissionStats() in lib/data.ts.
 */

export type MissionCardId = "members" | "projects" | "events" | "next" | "workshops" | "competitions";

export interface MissionStats {
  clubName: string;
  foundedYear: number | null;
  /** Current members, and the running total by the year they joined (from their year of study). */
  members: { total: number; growth: { year: number; total: number }[] };
  /** Projects, split by lab domain (a project counts once per matching domain tag). */
  projects: { total: number; domains: { domain: LabDomain; label: string; count: number }[] };
  /** Events in the current calendar year: total, already started, still to come. */
  events: { year: number; total: number; done: number; upcoming: number };
  /** The soonest event that has not started. */
  next: { title: string; slug: string; starts_at: string; venue: string } | null;
  /** Workshops that have run (started), plus the next scheduled one. */
  workshops: { run: number; next: { title: string; starts_at: string } | null };
  /** Competition podium finishes (achievements placed winner, 1st / 2nd / 3rd, runner-up). */
  competitions: { won: number; latest: { event: string; position: string } | null };
}

/** Achievement positions that count as a competition won (a podium). "Best Paper" or a grant don't. */
export const PODIUM = /winner|1st|2nd|3rd|first|second|third|runner/i;

/** The /lab/drone bench's drone settings. */
export const MISSION = {
  /** Drone scale on phones (relative to desktop). */
  mobileScale: 0.6,
  /** Trail particle budget (halved on phones). */
  particles: 1500,
  /** Free flight: the cursor must be still this long (ms) before the drone patrols. */
  idle: 4000,
  /** A tapped / hovered card holds the drone this long (ms) after the pointer leaves. */
  linger: 1200,
} as const;

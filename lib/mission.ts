import type { LabDomain } from "./home";

/**
 * Home "Mission Control" section (DESIGN.md §12): the drone flies over a dashboard of club stats.
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

type Phase = { id: MissionPhase; from: number; to: number };
export type MissionPhase = "arrive" | "scan" | "globe" | "free" | "dissolve";

export const MISSION = {
  /** Extra scroll the section holds for (CSS sticky), in screens. */
  hold: { desktop: 2.5, mobile: 1.5 },
  /** Seconds the scrubbed progress takes to catch up with the scroll. */
  scrub: 1,
  /** Scroll phases, as fractions of the hold. Phones skip the globe and free flight. */
  phases: {
    desktop: [
      { id: "arrive", from: 0, to: 0.15 },
      { id: "scan", from: 0.15, to: 0.4 },
      { id: "globe", from: 0.4, to: 0.65 },
      { id: "free", from: 0.65, to: 0.85 },
      { id: "dissolve", from: 0.85, to: 1 },
    ] as Phase[],
    mobile: [
      { id: "arrive", from: 0, to: 0.15 },
      { id: "scan", from: 0.15, to: 0.8 },
      { id: "dissolve", from: 0.8, to: 1 },
    ] as Phase[],
  },
  /** The scan phase visits these cards in order, each for an equal share of the phase. */
  scanOrder: ["members", "projects"] as MissionCardId[],
  /** Within a card's share: fly over it first, then switch the beam on at this fraction. */
  beamAt: 0.3,
  /** Drone scale on phones (relative to desktop). */
  mobileScale: 0.6,
  /** Trail particle budget (halved on phones). */
  particles: 1500,
  /** Free flight: the cursor must be still this long (ms) before the drone patrols. */
  idle: 4000,
  /** A tapped / hovered card holds the drone this long (ms) after the pointer leaves. */
  linger: 1200,
} as const;

/** Which phase scroll progress `p` (0–1) falls in, and how far through it (0–1). */
export function phaseAt(p: number, mobile: boolean): { id: MissionPhase; u: number } {
  const list = mobile ? MISSION.phases.mobile : MISSION.phases.desktop;
  const clamped = Math.min(1, Math.max(0, p));
  for (const ph of list) {
    if (clamped < ph.to || ph === list[list.length - 1]) {
      return { id: ph.id, u: Math.min(1, Math.max(0, (clamped - ph.from) / (ph.to - ph.from))) };
    }
  }
  return { id: "arrive", u: 0 };
}

/** Mono caption under the hologram globe. */
export function globeCaption(stats: MissionStats) {
  const since = stats.foundedYear ? ` since ${stats.foundedYear}` : "";
  return `${stats.clubName} / ${stats.members.total} members connected${since}`;
}

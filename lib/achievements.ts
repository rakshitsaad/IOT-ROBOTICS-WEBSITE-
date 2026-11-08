import type { Achievement, AchievementCategory } from "./types";
import { splitTitle } from "./projects";

/**
 * /achievements config (DESIGN.md §19): the card-expansion slider's timing and sizes, the filters, and small
 * formatting helpers. Client-safe.
 */

export type AchFilter = "all" | Exclude<AchievementCategory, "other">;

export const ACH_FILTERS: { id: AchFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "competition", label: "Competitions" },
  { id: "research", label: "Research" },
];

export const matchesFilter = (a: Achievement, f: AchFilter) => f === "all" || a.category === f;

/** Seconds. */
export const ACH_MOTION = {
  /** Autoplay interval, and how long any user action pauses it. */
  autoplay: 6,
  idleAfterAction: 10,
  /** The card growing into the background (or the background shrinking back into the first slot). */
  expand: 1.1,
  /** The old text leaving (before the card has finished). */
  out: 0.3,
  /** The new title lines rising, and the rest fading up after them. */
  lineIn: 0.9,
  lineStagger: 0.08,
  detailStagger: 0.05,
  /** The other cards sliding one slot. */
  cardShift: 0.9,
  cardStagger: 0.06,
  /** Reduced motion: slides crossfade. Filters: out, then in. */
  crossfade: 0.45,
  filterOut: 0.3,
  filterIn: 0.6,
};

/** The waiting cards (px). Phones: a small strip along the bottom. */
export const ACH_CARD = {
  desktop: { w: 170, h: 260, gap: 18 },
  mobile: { w: 110, h: 160, gap: 10 },
  radius: 16,
};

/** A win (the accent badge) or another result (muted). */
export const isWin = (result: string) => /^(winner|1st place|first place|gold)/i.test(result.trim());

/** The ghost pill's label for an achievement's link. */
export const linkLabel = (a: Pick<Achievement, "category">) => (a.category === "research" ? "Read paper" : "View certificate");

const DATE = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
/** "12 Dec 2025". */
export const achDate = (date: string) => DATE.format(new Date(`${date}T12:00:00+05:30`));
export const achYear = (date: string) => Number(date.slice(0, 4));

/** The title in two lines (split at the space nearest the middle). */
export const titleLines = (title: string) => splitTitle(title);

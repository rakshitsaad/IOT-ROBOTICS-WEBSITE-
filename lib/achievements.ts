import type { Achievement, AchievementCategory } from "./types";

/**
 * /achievements config (DESIGN.md §19): the filters and small formatting helpers. Client-safe.
 */

export type AchFilter = "all" | Exclude<AchievementCategory, "other">;

export const ACH_FILTERS: { id: AchFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "competition", label: "Competitions" },
  { id: "research", label: "Research" },
];

export const matchesFilter = (a: Achievement, f: AchFilter) => f === "all" || a.category === f;

export const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  competition: "Competition",
  research: "Research",
  other: "Recognition",
};

/** A win (the accent tag) or another result (quiet). */
export const isWin = (result: string) => /^(winner|1st place|first place|gold)/i.test(result.trim());

/** The label for an achievement's link. */
export const linkLabel = (a: Pick<Achievement, "category">) => (a.category === "research" ? "Read paper" : "View certificate");

const DATE = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
/** "12 Dec 2025". */
export const achDate = (date: string) => DATE.format(new Date(`${date}T12:00:00+05:30`));
export const achYear = (date: string) => Number(date.slice(0, 4));

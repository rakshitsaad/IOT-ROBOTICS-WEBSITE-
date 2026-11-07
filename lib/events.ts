import type { ClubEvent, GalleryItem } from "./types";

/**
 * /events config and helpers (DESIGN.md §17). Client-safe: no data access here.
 */

/** A photo with a file (gallery notes are left out). */
export type EventPhoto = GalleryItem & { url: string };

/** One event as /events shows it: the row, plus its gallery photos (past events). */
export interface ShowcaseEvent extends ClubEvent {
  photos: EventPhoto[];
  /** It has a journal at /gallery/<slug>. */
  has_gallery: boolean;
}

/** Upcoming first, soonest first; then past, newest first. */
export function sortShowcase<T extends Pick<ClubEvent, "status" | "starts_at">>(events: readonly T[]): T[] {
  const upcoming = events.filter((e) => e.status === "upcoming").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = events.filter((e) => e.status === "past").sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return [...upcoming, ...past];
}

const TZ = "Asia/Kolkata";

/** The event's year in IST. */
export function eventYear(iso: string): number {
  return Number(new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: TZ }).format(new Date(iso)));
}

/** "Fri 4 Dec 2026" (IST, so the server and the browser agree). */
export function eventDate(iso: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
}

/** "10:00 IST". */
export function eventTime(iso: string): string {
  const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(
    new Date(iso),
  );
  return `${t} IST`;
}

/** Filters: All, Upcoming, Past and each year that has events (newest first). */
export type EventFilter = "all" | "upcoming" | "past" | number;

export function eventFilters(events: readonly ClubEvent[]): { value: EventFilter; label: string }[] {
  const years = [...new Set(events.map((e) => eventYear(e.starts_at)))].sort((a, b) => b - a);
  return [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" },
    ...years.map((y) => ({ value: y, label: String(y) })),
  ];
}

export function matchesFilter(event: ClubEvent, filter: EventFilter): boolean {
  if (filter === "all") return true;
  if (filter === "upcoming" || filter === "past") return event.status === filter;
  return eventYear(event.starts_at) === filter;
}

/** Timings of the feature card (seconds unless noted). */
export const EVENTS_MOTION = {
  /** The banner's wipe, fade and scale (1.08 → 1). */
  banner: 0.8,
  bannerScale: 1.08,
  /** Starts after the banner starts: the cutout rising 40px. */
  cutoutAt: 0.15,
  cutoutRise: 40,
  /** The title's letters rise out of a mask, 30ms apart. */
  titleAt: 0.3,
  titleStagger: 0.03,
  detailsAt: 0.55,
  /** Thumbnails slide up 20px, 40ms apart. */
  thumbsAt: 0.65,
  thumbsStagger: 0.04,
  /** Leaving: title, details and thumbnails fade down before the next event comes in. */
  leave: 0.25,
  /** Reduced motion: a plain crossfade. */
  crossfade: 0.3,
  /** Autoplay interval (ms). */
  autoplay: 7000,
  /** Page tint crossfade (ms). */
  tint: 900,
} as const;

/**
 * Banner geometry in the card (all shares of the banner box): the box covers the card, and when the card is wider
 * than 16:9 the crop goes to the top first, up to `cropTop` of the banner's height, then to the bottom. With the
 * figure's head drawn 5% above the banner's top, it pokes out by about (5% + cropTop) of the banner's height on wide
 * cards and 5% (≈ 30px) on phones.
 */
export const EVENT_BANNER = { ratio: 16 / 9, cropTop: 0.09, cutoutHeight: 1.2 } as const;

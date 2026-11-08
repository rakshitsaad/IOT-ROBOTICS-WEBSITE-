import type { ClubEvent, EventType, GalleryItem } from "./types";

/**
 * /events helpers (DESIGN.md §17). Client-safe: no data access here.
 */

/** A photo with a file (gallery notes are left out). */
export type EventPhoto = GalleryItem & { url: string };

/** One event with its gallery photos and whether it has a journal at /gallery/<slug>. */
export interface ShowcaseEvent extends ClubEvent {
  photos: EventPhoto[];
  has_gallery: boolean;
}

/** Upcoming first, soonest first; then past, newest first. */
export function sortShowcase<T extends Pick<ClubEvent, "status" | "starts_at">>(events: readonly T[]): T[] {
  const upcoming = events.filter((e) => e.status === "upcoming").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = events.filter((e) => e.status === "past").sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return [...upcoming, ...past];
}

const TZ = "Asia/Kolkata";

function parts(iso: string, options: Intl.DateTimeFormatOptions): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { ...options, timeZone: TZ }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
}

/** The event's year in IST. */
export function eventYear(iso: string): number {
  return Number(parts(iso, { year: "numeric" }).year);
}

/** "Fri 4 Dec 2026" (IST, so the server and the browser agree). */
export function eventDate(iso: string): string {
  const p = parts(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
}

/** "10:00 IST". */
export function eventTime(iso: string): string {
  const p = parts(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${p.hour}:${p.minute} IST`;
}

/** The pieces of a date block: { day: "04", month: "Dec", year: "2026", weekday: "Fri" }. */
export function eventDateParts(iso: string) {
  const p = parts(iso, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  return { day: p.day, month: p.month, year: p.year, weekday: p.weekday };
}

/** "Fri 4 Dec – Sun 6 Dec 2026" for multi-day events, else the single date. */
export function eventDateRange(start: string, end: string | null): string {
  if (!end || eventDate(start) === eventDate(end)) return eventDate(start);
  const s = parts(start, { weekday: "short", day: "numeric", month: "short" });
  return `${s.weekday} ${s.day} ${s.month} – ${eventDate(end)}`;
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  workshop: "Workshop",
  hackathon: "Hackathon",
  talk: "Talk",
  competition: "Competition",
  meetup: "Meetup",
  exhibition: "Exhibition",
};

export const eventHref = (slug: string) => `/events/${slug}`;

import type { ClubEvent, GalleryItem } from "./types";

/**
 * Gallery journals (DESIGN.md §14): one per event, holding its photos, videos and notes in `sort_order`. Pure and
 * client-safe.
 */

/** An event with its gallery: the data /gallery/[slug] renders. */
export interface Journal {
  event: ClubEvent;
  items: GalleryItem[];
}

/** A journal on the /gallery index. */
export interface JournalSummary {
  slug: string;
  title: string;
  /** The event's start, ISO. */
  date: string;
  year: number;
  venue: string;
  cover_url: string | null;
  photos: number;
  videos: number;
  notes: number;
}

/** A note is a caption with no file. */
export function isNote(item: GalleryItem): boolean {
  return item.url === null;
}

/** Photos and videos (what the lightbox and the downloads show). */
export function isMedia(item: GalleryItem): item is GalleryItem & { url: string } {
  return item.url !== null;
}

/** "22 Nov 2025" in IST. */
export function journalDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

/** The year an event happened in, in IST. */
export function journalYear(iso: string): number {
  return Number(new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso)));
}

/** Zero-padded count for mono labels: 7 → "07". */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

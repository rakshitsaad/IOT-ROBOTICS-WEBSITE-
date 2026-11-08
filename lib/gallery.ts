import type { ClubEvent, GalleryItem } from "./types";

/**
 * Gallery journals (DESIGN.md §14): how an event's gallery items become the
 * pages of its journal, plus small shared helpers. Pure and client-safe (the
 * viewer imports it too).
 */

export type JournalPageKind = "photo" | "video" | "collage" | "note";

/** The sticker on a collage page. */
export type JournalSticker = "star" | "spark" | "logo";

export interface JournalPage {
  kind: JournalPageKind;
  /** Stable key: the first item's id. */
  key: string;
  /** One item, or 2–3 photos for a collage. */
  items: GalleryItem[];
  /** Collages only. */
  sticker: JournalSticker | null;
}

/** An event with its gallery: the data /gallery/[slug] renders. */
export interface Journal {
  event: ClubEvent;
  items: GalleryItem[];
  pages: JournalPage[];
}

/** A journal on the /gallery shelf. */
export interface JournalSummary {
  slug: string;
  title: string;
  /** The event's start, ISO. */
  date: string;
  year: number;
  cover_url: string | null;
  pages: number;
  photos: number;
  videos: number;
}

/** A collage holds 2 or 3 photos. */
const COLLAGE_MAX = 3;
const STICKERS: readonly JournalSticker[] = ["star", "spark", "logo"];

/** A note is a caption with no file. */
export function isNote(item: GalleryItem): boolean {
  return item.url === null;
}

/** Photos and videos (what the lightbox and the downloads show). */
export function isMedia(item: GalleryItem): item is GalleryItem & { url: string } {
  return item.url !== null;
}

/**
 * Builds the journal's pages from its items (in `sort_order`):
 * - a video, a note, or a photo without a group (or alone in its group) is one page;
 * - a run of consecutive photos sharing a `layout_group` becomes collages of 2–3
 *   photos (a run of 4 gives 2 + 2, 5 gives 3 + 2), so a collage never holds one photo.
 */
export function buildJournalPages(items: readonly GalleryItem[]): JournalPage[] {
  const pages: JournalPage[] = [];
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  let run: GalleryItem[] = [];
  const flush = () => {
    if (run.length === 1) pages.push(single(run[0]));
    else if (run.length > 1) {
      const count = Math.ceil(run.length / COLLAGE_MAX);
      const base = Math.floor(run.length / count);
      let extra = run.length % count;
      let start = 0;
      for (let c = 0; c < count; c++) {
        const size = base + (extra-- > 0 ? 1 : 0);
        const photos = run.slice(start, start + size);
        start += size;
        pages.push({
          kind: "collage",
          key: photos[0].id,
          items: photos,
          sticker: STICKERS[Math.floor(seeded(photos[0].id) * STICKERS.length)],
        });
      }
    }
    run = [];
  };

  for (const item of sorted) {
    const groupable = item.type === "photo" && !isNote(item) && item.layout_group !== null;
    if (groupable && run.length > 0 && run[0].layout_group === item.layout_group) {
      run.push(item);
      continue;
    }
    flush();
    if (groupable) run = [item];
    else pages.push(single(item));
  }
  flush();
  return pages;
}

function single(item: GalleryItem): JournalPage {
  const kind: JournalPageKind = isNote(item) ? "note" : item.type;
  return { kind, key: item.id, items: [item], sticker: null };
}

/**
 * A stable pseudo-random number in [0, 1) from a string (FNV-1a), so collage
 * rotations and stickers are the same on the server and the client.
 */
export function seeded(key: string, salt = 0): number {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

/** "22 Nov 2025" in IST (the mono date on covers and in the viewer). */
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

/** The image that stands for a page (the blurred backdrop): a photo, a video's poster, a collage's first photo. */
export function pageImage(page: JournalPage): string | null {
  const first = page.items[0];
  if (page.kind === "video") return first.poster_url;
  return first.url;
}

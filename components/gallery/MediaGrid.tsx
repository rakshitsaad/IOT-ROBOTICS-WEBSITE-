"use client";

import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { GalleryItem } from "@/lib/types";
import { downloadMedia, mediaFileName } from "./download";
import { JournalIcon } from "./icons";
import { Lightbox } from "./Lightbox";

/**
 * A set of photos (and videos) that open in the lightbox (DESIGN.md §14).
 * - layout "masonry": CSS columns keeping each photo's own shape (gallery journals, event photos).
 * - layout "grid": an even 3:2 grid (project photos).
 * Notes (items without a file) render as short text cards in the masonry. Captions sit under the photo, never on it.
 */
export function MediaGrid({
  items,
  title,
  slug,
  layout = "masonry",
  className,
}: {
  items: GalleryItem[];
  /** For the lightbox's label and download names. */
  title: string;
  slug: string;
  layout?: "masonry" | "grid";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const media = items.filter((i): i is GalleryItem & { url: string } => i.url !== null);
  const [open, setOpen] = useState<number | null>(null);

  const download = (item: GalleryItem) => {
    if (!item.url) return;
    const n = media.findIndex((m) => m.id === item.id) + 1;
    void downloadMedia(item.url, mediaFileName(slug, n, item.type, item.url), item.type);
  };

  return (
    <>
      <ul
        className={cn(
          layout === "masonry" ? "columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4 [&>li]:mb-3 md:[&>li]:mb-4" : "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3",
          className,
        )}
      >
        {items.map((item) => {
          if (!item.url) {
            return (
              <li key={item.id} className="break-inside-avoid">
                <figure className="rounded-image border border-line bg-bg-2 p-5">
                  <span aria-hidden="true" className="mono-label text-faint">
                    Note
                  </span>
                  <blockquote className="mt-3 text-[15px] leading-relaxed text-text/90">{item.caption}</blockquote>
                </figure>
              </li>
            );
          }
          const index = media.findIndex((m) => m.id === item.id);
          const ratio = layout === "grid" ? "3 / 2" : `${item.width ?? 3} / ${item.height ?? 2}`;
          const poster = item.type === "video" ? item.poster_url : item.url;
          return (
            <li key={item.id} className="break-inside-avoid">
              <figure>
                <button
                  type="button"
                  onClick={() => setOpen(index)}
                  aria-label={`Open ${item.type === "video" ? "video" : "photo"} ${index + 1} of ${media.length}: ${item.alt}`}
                  className="group/media relative block w-full overflow-hidden rounded-image bg-bg-2"
                  style={{ aspectRatio: ratio }}
                >
                  {poster && (
                    <Image
                      src={poster}
                      alt=""
                      fill
                      sizes={layout === "grid" ? "(min-width: 1024px) 30vw, 50vw" : "(min-width: 1024px) 24vw, (min-width: 768px) 32vw, 50vw"}
                      className="object-cover transition-transform duration-700 ease-power3 group-hover/media:scale-[1.03]"
                    />
                  )}
                  {item.type === "video" && (
                    <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-tag bg-bg/85 px-2 py-1 font-mono text-[11px] text-text">
                      <JournalIcon name="play" className="size-3" /> Video
                    </span>
                  )}
                </button>
                {item.caption && <figcaption className="mt-2 text-[13px] leading-snug text-faint">{item.caption}</figcaption>}
              </figure>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {open !== null && media[open] && (
          <Lightbox
            key="lightbox"
            items={media}
            index={open}
            onIndex={setOpen}
            onClose={() => setOpen(null)}
            onDownload={download}
            title={title}
            reduced={reduced}
          />
        )}
      </AnimatePresence>
    </>
  );
}

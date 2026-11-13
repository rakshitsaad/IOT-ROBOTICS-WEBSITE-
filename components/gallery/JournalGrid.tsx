"use client";

import Image from "next/image";
import { journalDate, isNote } from "@/lib/gallery";
import type { GalleryItem } from "@/lib/types";
import { JournalIcon } from "./icons";

/**
 * The journal's grid view (DESIGN.md §14): every item in a masonry of CSS
 * columns (2 on phones, 3 from md, 4 from lg), in journal order down each
 * column. Photos and videos open the lightbox; notes are small paper cards.
 * Each tile carries `data-flip-id` so the viewer can fly pages into it.
 */
export function JournalGrid({
  items,
  date,
  onOpen,
}: {
  items: GalleryItem[];
  date: string;
  onOpen(itemId: string): void;
}) {
  return (
    <ul className="shell columns-2 gap-3 pt-6 pb-24 md:columns-3 md:gap-4 lg:columns-4">
      {items.map((item) => {
        const ratio = item.width && item.height ? `${item.width} / ${item.height}` : "4 / 5";
        if (isNote(item)) {
          return (
            <li key={item.id} className="mb-3 break-inside-avoid md:mb-4">
              <div
                data-flip-id={item.id}
                className="paper-ruled rounded-image px-6 pt-9 pb-7 pl-[18%] [--rule:2.1rem] @container"
              >
                <p className="mono-label mb-2 text-[10px] text-bg/45">{journalDate(date)}</p>
                <p className="font-serif text-[length:clamp(1.25rem,7.5cqw,1.65rem)] leading-[2.1rem] italic text-bg/85">{item.caption}</p>
              </div>
            </li>
          );
        }
        const src = item.type === "video" ? item.poster_url : item.url;
        return (
          <li key={item.id} className="mb-3 break-inside-avoid md:mb-4">
            <button
              type="button"
              data-flip-id={item.id}
              data-cursor="view"
              data-cursor-label={item.type === "video" ? "Play" : undefined}
              aria-label={`${item.type === "video" ? "Play video" : "Open photo"}: ${item.alt}`}
              onClick={() => onOpen(item.id)}
              style={{ aspectRatio: ratio }}
              className="group/tile relative block w-full overflow-hidden rounded-image bg-bg-2"
            >
              {src && (
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-[600ms] ease-power3 group-hover/tile:scale-[1.03]"
                />
              )}
              {item.type === "video" && (
                <span className="absolute top-3 left-3 grid size-9 place-items-center rounded-full bg-bg/70 text-text backdrop-blur-sm">
                  <JournalIcon name="play" className="size-4 translate-x-px" />
                </span>
              )}
              {item.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-bg/85 to-transparent px-3 pt-8 pb-2.5 text-left font-serif text-lg leading-tight italic text-text">
                  {item.caption}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

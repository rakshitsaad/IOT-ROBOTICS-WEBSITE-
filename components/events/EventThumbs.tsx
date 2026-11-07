"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { EVENTS_MOTION, type ShowcaseEvent } from "@/lib/events";

/**
 * The row along the bottom of the feature card (DESIGN.md §17): a past event's photos (click: lightbox) or, for an
 * upcoming event, the other events (click: switch). 120×72 tiles that widen to 220px on hover or focus, with a
 * title under them; the neighbours slide aside because the row is a flex line. It scrolls sideways when full.
 */

interface Tile {
  key: string;
  src: string;
  title: string;
  label: string;
  onClick(): void;
  cursor: "view" | "link";
}

export function EventThumbs({
  event,
  others,
  intro,
  onPhoto,
  onEvent,
}: {
  event: ShowcaseEvent;
  others: ShowcaseEvent[];
  intro: boolean;
  onPhoto(index: number): void;
  onEvent(slug: string): void;
}) {
  const tiles: Tile[] =
    event.status === "past"
      ? event.photos.map((p, i) => ({
          key: p.id,
          src: p.url,
          title: p.caption ?? p.alt,
          label: `Open photo ${i + 1}: ${p.alt}`,
          onClick: () => onPhoto(i),
          cursor: "view",
        }))
      : others.flatMap((o) =>
          o.banner_url ?? o.cover_url
            ? [
                {
                  key: o.slug,
                  src: (o.banner_url ?? o.cover_url) as string,
                  title: o.title,
                  label: `Show ${o.title}`,
                  onClick: () => onEvent(o.slug),
                  cursor: "link" as const,
                },
              ]
            : [],
        );
  if (tiles.length === 0) return null;

  return (
    <ul
      data-ev-leave
      data-no-swipe
      data-lenis-prevent
      aria-label={event.status === "past" ? `Photos from ${event.title}` : "Other events"}
      className={cn(
        "-mx-(--pad) flex gap-2 overflow-x-auto px-(--pad) pt-1 pb-1",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_var(--pad),black_calc(100%-var(--pad)),transparent)]",
      )}
    >
      {tiles.map((t, i) => (
        <li
          key={t.key}
          data-ev-thumb
          className={cn("shrink-0", intro && "animate-slide-up motion-reduce:animate-none")}
          style={
            intro
              ? ({ animationDelay: `${Math.round((EVENTS_MOTION.thumbsAt + i * EVENTS_MOTION.thumbsStagger) * 1000)}ms` } as CSSProperties)
              : undefined
          }
        >
          <button
            type="button"
            onClick={t.onClick}
            aria-label={t.label}
            data-cursor={t.cursor}
            className={cn(
              "group/thumb block w-[120px] text-left outline-none",
              "transition-[width] duration-500 ease-power3 hover:w-[220px] focus-visible:w-[220px] motion-reduce:transition-none",
            )}
          >
            <span className="relative block h-[72px] overflow-hidden rounded-[10px] bg-bg-2 ring-1 ring-text/15 transition-[box-shadow] duration-[350ms] group-focus-visible/thumb:ring-2 group-focus-visible/thumb:ring-text">
              <Image
                src={t.src}
                alt=""
                fill
                sizes="220px"
                className="object-cover transition-transform duration-500 ease-power3 group-hover/thumb:scale-105"
              />
            </span>
            <span className="mt-1.5 block h-4 truncate text-[12px] leading-4 text-text/80 opacity-0 transition-opacity duration-[350ms] group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100">
              {t.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

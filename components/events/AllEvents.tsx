"use client";

import Image from "next/image";
import { MonoLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { eventDate, eventYear, type ShowcaseEvent } from "@/lib/events";
import { StatusBadge } from "./parts";

/**
 * "All events" under the showcase (DESIGN.md §17): smaller cards (poster, title, date, status) grouped by year,
 * newest year first. A click scrolls back up and switches the showcase to that event.
 */
export function AllEvents({ events, active, onPick }: { events: ShowcaseEvent[]; active: string; onPick(slug: string): void }) {
  const years = [...new Set(events.map((e) => eventYear(e.starts_at)))].sort((a, b) => b - a);
  return (
    <section aria-labelledby="all-events-title" className="shell pt-[clamp(5rem,14svh,9rem)] pb-[clamp(5rem,14svh,9rem)]">
      <MonoLabel as="p" index={2}>
        Archive
      </MonoLabel>
      <h2 id="all-events-title" className="mt-4 text-[length:clamp(2.2rem,5vw,4.5rem)] leading-[1.04] font-bold tracking-[-0.04em]">
        All events
      </h2>
      {years.map((year) => {
        const own = events.filter((e) => eventYear(e.starts_at) === year).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
        return (
          <div key={year} className="mt-12 md:mt-16">
            <h3 className="flex items-center gap-4 text-2xl font-bold tracking-[-0.03em] tabular-nums">
              {year}
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
              <MonoLabel>[{String(own.length).padStart(2, "0")}]</MonoLabel>
            </h3>
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
              {own.map((e) => (
                <li key={e.slug}>
                  <button
                    type="button"
                    onClick={() => onPick(e.slug)}
                    data-cursor="view"
                    aria-current={e.slug === active ? "true" : undefined}
                    className="group/card block w-full text-left"
                  >
                    <span
                      className={cn(
                        "relative block aspect-[4/5] overflow-hidden rounded-image bg-bg-2 ring-1 ring-line transition-[box-shadow] duration-[350ms]",
                        e.slug === active && "ring-2 ring-text/70",
                      )}
                    >
                      {(e.cover_url ?? e.banner_url) && (
                        <Image
                          src={(e.cover_url ?? e.banner_url) as string}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 23vw, (min-width: 768px) 30vw, 46vw"
                          className="object-cover transition-transform duration-700 ease-power3 group-hover/card:scale-[1.04]"
                        />
                      )}
                    </span>
                    <span className="mt-4 block text-lg leading-tight font-semibold tracking-[-0.02em] md:text-xl">{e.title}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted">
                      <time dateTime={e.starts_at}>{eventDate(e.starts_at)}</time>
                      <StatusBadge event={e} quiet />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

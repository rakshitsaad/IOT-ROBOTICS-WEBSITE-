import Link from "next/link";
import { EventFeature } from "@/components/shared/EventFeature";
import { EventRow } from "@/components/shared/EventRow";
import { MonoLabel, Photo, SectionHeader } from "@/components/ui";
import { EVENT_TYPE_LABEL, eventDate, eventHref, eventYear, type ShowcaseEvent } from "@/lib/events";

/**
 * /events below its header (DESIGN.md §17): the next event given room, the rest of the calendar as a list, and the
 * archive of past events grouped by year.
 */

export function NextEvent({ event }: { event: ShowcaseEvent }) {
  return (
    <section aria-label="Next event" className="section-y">
      <div className="shell">
        <MonoLabel index={1}>Next up</MonoLabel>
        <div className="mt-8">
          <EventFeature event={event} headingLevel="h2" priority />
        </div>
      </div>
    </section>
  );
}

export function UpcomingList({ events }: { events: ShowcaseEvent[] }) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="upcoming-title" className="section-y border-t border-line">
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <MonoLabel index={2}>Upcoming</MonoLabel>
          <h2 id="upcoming-title" className="type-h2 mt-5">
            Later this season.
          </h2>
        </div>
        <ul className="divide-y divide-line border-y border-line lg:col-span-8">
          {events.map((e) => (
            <li key={e.id}>
              <EventRow event={e} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PastEvents({ events, index }: { events: ShowcaseEvent[]; index: number }) {
  if (events.length === 0) return null;
  const years = [...new Set(events.map((e) => eventYear(e.starts_at)))].sort((a, b) => b - a);
  return (
    <section aria-labelledby="past-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={index}
          label="Archive"
          titleId="past-title"
          title="Previous events."
          intro="Everything we have run, newest first. Events with a journal have their photos in the gallery."
        />
        {years.map((year) => {
          const inYear = events.filter((e) => eventYear(e.starts_at) === year);
          return (
            <div key={year} className="mt-14 md:mt-16">
              <h3 className="flex items-baseline gap-4 border-b border-line pb-4">
                <span className="text-[20px] font-semibold tracking-[-0.02em] tabular-nums">{year}</span>
                <span className="font-mono text-[12px] text-faint">
                  {inYear.length} {inYear.length === 1 ? "event" : "events"}
                </span>
              </h3>
              <ul className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {inYear.map((e) => (
                  <li key={e.id} data-reveal>
                    <PastEventCard event={e} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PastEventCard({ event }: { event: ShowcaseEvent }) {
  return (
    <article className="group/photo relative flex h-full flex-col">
      <Photo src={event.banner_url ?? event.cover_url} alt={`${event.title} banner`} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" ratio="aspect-[16/9]" zoom />
      <p className="mt-5 font-mono text-[11px] tracking-[0.04em] text-faint">
        {eventDate(event.starts_at)} · {EVENT_TYPE_LABEL[event.type]}
      </p>
      <h4 className="type-h3 mt-2">
        <Link href={eventHref(event.slug)} className="after:absolute after:inset-0 after:content-['']">
          {event.title}
        </Link>
      </h4>
      <p className="mt-1.5 text-[14px] text-faint">{event.venue}</p>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{event.summary}</p>
      {event.has_gallery && (
        <Link
          href={`/gallery/${event.slug}`}
          className="relative mt-auto inline-flex w-fit items-center gap-1.5 pt-5 text-[14px] font-semibold text-text transition-colors duration-300 hover:text-text/80"
        >
          View photos
          {event.photos.length > 0 && <span className="font-mono text-[11px] font-normal text-faint">{event.photos.length}</span>}
          <span aria-hidden="true" className="text-faint">
            →
          </span>
        </Link>
      )}
    </article>
  );
}

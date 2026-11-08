import { ArrowLink, Button, Photo, Tag } from "@/components/ui";
import { Countdown } from "@/components/home/Countdown";
import { EVENT_TYPE_LABEL, eventDateRange, eventHref, eventTime } from "@/lib/events";
import type { ClubEvent } from "@/lib/types";

/**
 * An upcoming event given room (DESIGN.md §12, §17): its banner beside the date, time, venue, a short description,
 * a live countdown and the registration link. Used on the home page and at the top of /events.
 */
export function EventFeature({ event, headingLevel = "h3", priority = false }: { event: ClubEvent; headingLevel?: "h2" | "h3"; priority?: boolean }) {
  const Heading = headingLevel;
  return (
    <article className="grid gap-8 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-7">
        <Photo
          src={event.banner_url ?? event.cover_url}
          alt={`${event.title} banner`}
          sizes="(min-width: 1024px) 58vw, 100vw"
          ratio="aspect-[16/9]"
          priority={priority}
        />
      </div>
      <div className="flex flex-col lg:col-span-5">
        <div className="flex flex-wrap gap-2">
          <Tag>{EVENT_TYPE_LABEL[event.type]}</Tag>
          {event.registration_url && <Tag tone="accent">Registrations open</Tag>}
        </div>
        <Heading className="mt-5 text-[clamp(1.75rem,2.8vw,2.375rem)] leading-[1.08] font-semibold tracking-[-0.028em]">{event.title}</Heading>
        <p className="mt-4 text-[17px] leading-relaxed text-text/90">{event.summary}</p>
        <p className="type-body mt-3 text-muted">{event.description}</p>

        <dl className="mt-7 grid grid-cols-[5.5rem_1fr] gap-y-3 border-t border-line pt-6 text-[14px]">
          <dt className="mono-label pt-0.5 text-faint">Date</dt>
          <dd>{eventDateRange(event.starts_at, event.ends_at)}</dd>
          <dt className="mono-label pt-0.5 text-faint">Time</dt>
          <dd>{eventTime(event.starts_at)}</dd>
          <dt className="mono-label pt-0.5 text-faint">Venue</dt>
          <dd>{event.venue}</dd>
        </dl>

        <Countdown to={event.starts_at} className="mt-7 border-t border-line pt-6" />

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          {event.registration_url && (
            <Button href={event.registration_url} arrow>
              Register
            </Button>
          )}
          <ArrowLink href={eventHref(event.slug)}>Event details</ArrowLink>
        </div>
      </div>
    </article>
  );
}

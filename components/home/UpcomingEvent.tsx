import Image from "next/image";
import { IrisButton, MonoLabel, PillButton } from "@/components/ui";
import type { ClubEvent } from "@/lib/types";
import { Countdown } from "./Countdown";
import { ScrollTilt } from "./ScrollTilt";

/**
 * Section E: the next upcoming event (the page renders this only when there
 * is one). Poster on the left, tilted 3° and straightening as it scrolls in;
 * details, a live countdown and the actions on the right. The robot shows
 * its calendar icon while this section is on screen (HomeScroll).
 */

const TZ = "Asia/Kolkata";

/** "Fri 20 Nov 2026 · 14:00 IST" (fixed time zone, so server and client agree). */
function formatWhen(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: TZ,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year} · ${parts.hour}:${parts.minute} IST`;
}

export function UpcomingEvent({ event }: { event: ClubEvent }) {
  const register = event.registration_url ?? `/events/${event.slug}`;
  return (
    <section data-event aria-labelledby="event-title" className="py-[clamp(5rem,14svh,10rem)]">
      <div className="shell grid items-center gap-10 md:grid-cols-12 md:gap-12">
        <ScrollTilt className="md:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-image bg-bg-2 ring-1 ring-line">
            {event.cover_url && (
              <Image
                src={event.cover_url}
                alt={`${event.title} poster`}
                fill
                sizes="(min-width: 768px) 38vw, 92vw"
                className="object-cover"
              />
            )}
          </div>
        </ScrollTilt>

        <div className="md:col-span-7 md:pl-[4vw]">
          <MonoLabel as="p" tone="text">
            Next up / <time dateTime={event.starts_at}>{formatWhen(event.starts_at)}</time>
          </MonoLabel>
          <h2
            id="event-title"
            className="mt-5 text-[length:clamp(2.4rem,5vw,5rem)] leading-[1] font-semibold tracking-[-0.03em]"
          >
            {event.title}
          </h2>
          <p className="mt-4 text-[17px] text-muted">{event.venue}</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
            {[event.type, ...event.tags].map((tag) => (
              <li key={tag} className="mono-label rounded-pill border border-line px-3 py-1.5 text-text">
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-line pt-8">
            <Countdown to={event.starts_at} />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <IrisButton href={register} size="lg" arrow>
              Register
            </IrisButton>
            <PillButton href="/events" variant="ghost" size="lg">
              All events
            </PillButton>
          </div>
        </div>
      </div>
    </section>
  );
}

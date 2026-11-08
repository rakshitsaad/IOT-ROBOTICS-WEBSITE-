import Link from "next/link";
import { Tag } from "@/components/ui";
import { EVENT_TYPE_LABEL, eventDateParts, eventHref } from "@/lib/events";
import type { ClubEvent } from "@/lib/types";

/**
 * One event as a row in a list (DESIGN.md §17): the date block, the title and venue, the type and whether
 * registrations are open. The whole row links to the event's page.
 */
export function EventRow({ event }: { event: ClubEvent }) {
  const d = eventDateParts(event.starts_at);
  const upcoming = event.status === "upcoming";
  return (
    <Link
      href={eventHref(event.slug)}
      className="group/row grid grid-cols-[4.5rem_1fr] items-center gap-x-5 gap-y-3 py-6 transition-colors duration-300 sm:grid-cols-[5.5rem_1fr_auto] md:gap-x-8"
    >
      <span className="flex flex-col leading-none">
        <span className="text-[28px] font-semibold tracking-[-0.03em] tabular-nums">{d.day}</span>
        <span className="mono-label mt-2 text-faint">
          {d.month} {d.year}
        </span>
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-3 text-[18px] leading-snug font-semibold tracking-[-0.015em] md:text-[20px]">
          {event.title}
          <span aria-hidden="true" className="text-faint transition-[transform,color] duration-300 ease-power3 group-hover/row:translate-x-1 group-hover/row:text-red">
            →
          </span>
        </span>
        <span className="mt-1.5 block text-[14px] text-muted">{event.venue}</span>
      </span>
      <span className="col-start-2 flex flex-wrap gap-2 sm:col-start-3 sm:justify-end">
        <Tag>{EVENT_TYPE_LABEL[event.type]}</Tag>
        {upcoming && event.registration_url ? <Tag tone="accent">Registrations open</Tag> : !upcoming && <Tag tone="solid">Completed</Tag>}
      </span>
    </Link>
  );
}

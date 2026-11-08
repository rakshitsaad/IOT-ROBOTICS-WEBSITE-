import { SectionHeader } from "@/components/ui";
import { EventFeature } from "@/components/shared/EventFeature";
import { EventRow } from "@/components/shared/EventRow";
import { sortShowcase } from "@/lib/events";
import type { ClubEvent } from "@/lib/types";

/**
 * Home section 04 (DESIGN.md §12): the next event in full, then a short list of what else is coming and what just
 * happened.
 */
export function HomeEvents({ next, events, index }: { next: ClubEvent | null; events: ClubEvent[]; index?: number }) {
  const others = sortShowcase(events.filter((e) => e.id !== next?.id)).slice(0, 4);
  return (
    <section aria-labelledby="events-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={index}
          label="Events"
          titleId="events-title"
          title={next ? "What's coming up." : "Recent events."}
          intro="Workshops, talks, hackathons and competitions, open to every year and branch."
          action={{ label: "All events", href: "/events" }}
        />

        {next && (
          <div data-reveal className="mt-12 md:mt-16">
            <EventFeature event={next} />
          </div>
        )}

        {others.length > 0 && (
          <div data-reveal className="mt-16 md:mt-20">
            <h3 className="mono-label text-faint">{next ? "Also on the calendar" : "Latest"}</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {others.map((e) => (
                <li key={e.id}>
                  <EventRow event={e} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

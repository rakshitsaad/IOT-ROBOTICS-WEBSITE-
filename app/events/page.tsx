import type { Metadata } from "next";
import { NextEvent, PastEvents, UpcomingList } from "@/components/events/EventSections";
import { FactList, PageHeader } from "@/components/ui";
import { getEventShowcase } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events",
  description: "Workshops, hackathons, talks and competitions run by the club: what's coming up and what we've done.",
};

/** /events (DESIGN.md §17): the next event, the rest of the calendar and the archive. */
export default async function EventsPage() {
  const events = await getEventShowcase();
  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");
  const [next, ...later] = upcoming;

  return (
    <>
      <PageHeader
        label="Events"
        title="Workshops, talks, hackathons and competitions."
        intro="Run by the club and open to every year and branch. Register for what's coming up, or look back at what we've done."
        aside={
          <FactList
            items={[
              { label: "Upcoming", value: upcoming.length },
              { label: "Past", value: past.length },
            ]}
          />
        }
      />
      {next && <NextEvent event={next} />}
      <UpcomingList events={later} />
      <PastEvents events={past} index={later.length > 0 ? 3 : next ? 2 : 1} />
    </>
  );
}

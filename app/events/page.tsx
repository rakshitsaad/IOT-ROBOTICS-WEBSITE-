import type { Metadata } from "next";
import { EventsExperience } from "@/components/events/EventsExperience";
import { getEventShowcase } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events",
  description: "Workshops, hackathons, talks and competitions run by the club: what's coming up and what we've done.",
};

/** /events (DESIGN.md §17): the feature card showcase and the "All events" grid. */
export default async function EventsPage() {
  const events = await getEventShowcase();
  return (
    <>
      <EventsExperience events={events} />
    </>
  );
}

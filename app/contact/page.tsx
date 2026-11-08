import type { Metadata } from "next";
import { ContactFaq } from "@/components/contact/ContactFaq";
import { ContactHero, type HeroBadge } from "@/components/contact/ContactHero";
import { ContactPanel } from "@/components/contact/ContactPanel";
import { getPartners, getSettings, getUpcomingEvent, getUpcomingWorkshop } from "@/lib/data";
import { SENIOR_CORE_TERM } from "@/lib/members";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, collaborations, sponsorships or just a hello: write to the IoT & Robotics club. We usually reply within 48 hours.",
};

/** /contact (DESIGN.md §20): the planet-horizon hero, the contact panel (details, form, map) and the FAQ. */
export default async function ContactPage() {
  const [settings, partners, workshop, next] = await Promise.all([
    getSettings(),
    getPartners(),
    getUpcomingWorkshop(),
    getUpcomingEvent(),
  ]);

  // The badge: recruitment while it's open, else the next workshop (or the next event).
  const upcoming = workshop ?? next;
  const badge: HeroBadge | null = settings.recruitment_open
    ? { label: `Recruitment for ${SENIOR_CORE_TERM.year} is open`, href: settings.join_form_url ?? "/join" }
    : upcoming
      ? { label: `${workshop ? "Workshop" : "Next up"}: ${upcoming.title}`, href: "/events" }
      : null;

  return (
    <>
      <ContactHero email={settings.contact_email} badge={badge} partners={partners} />
      <ContactPanel
        clubName={settings.club_name}
        collegeName={settings.college_name}
        email={settings.contact_email}
        phone={settings.contact_phone}
        address={settings.lab_address}
        mapQuery={settings.map_query}
        instagram={settings.instagram_url}
        linkedin={settings.linkedin_url}
        github={settings.github_url}
      />
      <ContactFaq />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { ContactForm } from "@/components/contact/ContactForm";
import { Accordion, ArrowLink, Button, MonoLabel, PageHeader } from "@/components/ui";
import { CONTACT_FAQ, mapEmbedUrl, mapOpenUrl } from "@/lib/contact";
import { getPartners, getSettings, getUpcomingEvent, getUpcomingWorkshop } from "@/lib/data";
import { SENIOR_CORE_TERM } from "@/lib/members";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, collaborations, sponsorships or just a hello: write to the IoT & Robotics club. We usually reply within 48 hours.",
};

/** /contact (DESIGN.md §20): the ways to reach us beside the message form, the lab on a map, partners and the FAQ. */
export default async function ContactPage() {
  const [settings, partners, workshop, next] = await Promise.all([
    getSettings(),
    getPartners(),
    getUpcomingWorkshop(),
    getUpcomingEvent(),
  ]);

  // A short notice: recruitment while it's open, else the next workshop (or the next event).
  const upcoming = workshop ?? next;
  const notice = settings.recruitment_open
    ? { label: `Recruitment for ${SENIOR_CORE_TERM.year} is open.`, link: "How to apply", href: settings.join_form_url ?? "/join" }
    : upcoming
      ? { label: `${workshop ? "Next workshop" : "Next up"}: ${upcoming.title}.`, link: "Details", href: `/events/${upcoming.slug}` }
      : null;

  return (
    <>
      <PageHeader
        label="Contact"
        title="Get in touch."
        intro="Questions, collaborations, sponsorships or just a hello. We usually reply within 48 hours."
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button href={`mailto:${settings.contact_email}`} variant="secondary">
            Email {settings.contact_email}
          </Button>
          {notice && (
            <p className="flex items-center gap-2 text-[14px] text-muted">
              <span aria-hidden="true" className="size-1.5 rounded-pill bg-red" />
              {notice.label}
              <ArrowLink href={notice.href}>{notice.link}</ArrowLink>
            </p>
          )}
        </div>
      </PageHeader>

      <section aria-label="Contact details and message form" className="section-y">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <ContactDetails
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
          </div>

          <div className="rounded-card border border-line bg-bg-2 p-5 sm:p-8 md:p-10 lg:col-span-7 lg:col-start-6">
            <h2 id="message" className="type-h3">
              Send us a message
            </h2>
            <p className="mt-2 max-w-[48ch] text-[14px] text-muted">
              Tell us who you are and what you have in mind. Someone from the core team will reply.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="lab-title" className="section-y border-t border-line">
        <div className="shell grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="lg:col-span-4">
            <MonoLabel index={1}>Visit</MonoLabel>
            <h2 id="lab-title" className="type-h2 mt-5">
              Find the lab.
            </h2>
            <p className="type-body mt-5 max-w-[36ch] text-muted">{settings.lab_address}</p>
            <ArrowLink href={mapOpenUrl(settings.map_query)} className="mt-6">
              Open in Maps
            </ArrowLink>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-bg-2 sm:aspect-[16/9] lg:col-span-7 lg:col-start-6">
            <iframe
              title={`Map: ${settings.map_query}`}
              src={mapEmbedUrl(settings.map_query)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 size-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)]"
            />
          </div>
        </div>
      </section>

      {partners.length > 0 && (
        <section aria-labelledby="partners-title" className="border-t border-line py-14 md:py-16">
          <div className="shell flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <h2 id="partners-title" className="mono-label shrink-0 text-faint">
              Partners and sponsors
            </h2>
            <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
              {partners.map((p) => {
                const logo = <Image src={p.logo_url} alt={p.name} width={160} height={32} unoptimized className="h-6 w-auto opacity-60 grayscale transition-opacity duration-300 hover:opacity-90 md:h-7" />;
                return (
                  <li key={p.id}>
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer">
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="faq-title" className="section-y border-t border-line">
        <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <MonoLabel index={2}>FAQ</MonoLabel>
            <h2 id="faq-title" className="type-h2 mt-5">
              Common questions.
            </h2>
            <p className="type-body mt-5 max-w-[32ch] text-muted">
              Didn&apos;t find yours? Write to us with the form above.
            </p>
          </div>
          <Accordion items={CONTACT_FAQ} className="lg:col-span-7 lg:col-start-6" />
        </div>
      </section>
    </>
  );
}

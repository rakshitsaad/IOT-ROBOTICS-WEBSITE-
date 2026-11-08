import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaGrid } from "@/components/gallery/MediaGrid";
import { Countdown } from "@/components/home/Countdown";
import { EventRow } from "@/components/shared/EventRow";
import { ArrowLink, Button, MonoLabel, Photo, Tag, TagList } from "@/components/ui";
import { getEvent, getEventShowcase } from "@/lib/data";
import { EVENT_TYPE_LABEL, eventDateRange, eventTime, type ShowcaseEvent } from "@/lib/events";

export async function generateStaticParams() {
  return (await getEventShowcase()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found" };
  return { title: event.title, description: event.summary };
}

/** One event (DESIGN.md §17). Params are read inside <Suspense> (DESIGN.md §9). */
export default function EventPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-svh" />}>
      <EventFromParams params={params} />
    </Suspense>
  );
}

async function EventFromParams({ params }: { params: PageProps<"/events/[slug]">["params"] }) {
  const { slug } = await params;
  const [event, all] = await Promise.all([getEvent(slug), getEventShowcase()]);
  if (!event) notFound();
  return <EventDetail event={event} others={all.filter((e) => e.id !== event.id).slice(0, 3)} />;
}

function EventDetail({ event, others }: { event: ShowcaseEvent; others: ShowcaseEvent[] }) {
  const upcoming = event.status === "upcoming";
  return (
    <article className="pt-header">
      <div className="shell">
        <nav aria-label="Breadcrumb" className="pt-8 md:pt-12">
          <ol className="flex items-center gap-2 text-[13px] text-faint">
            <li>
              <Link href="/events" className="transition-colors duration-300 hover:text-text">
                Events
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-muted">
              {event.title}
            </li>
          </ol>
        </nav>

        <header className="pt-10 pb-10 md:pt-14">
          <div className="flex flex-wrap gap-2">
            <Tag>{EVENT_TYPE_LABEL[event.type]}</Tag>
            {upcoming ? event.registration_url && <Tag tone="accent">Registrations open</Tag> : <Tag tone="solid">Completed</Tag>}
          </div>
          <h1 className="type-h1 mt-6 max-w-[20ch]">{event.title}</h1>
          <p className="type-lead mt-6 max-w-[56ch] text-muted">{event.summary}</p>
        </header>

        <Photo src={event.banner_url ?? event.cover_url} alt={`${event.title} banner`} sizes="(min-width: 1400px) 1320px, 100vw" ratio="aspect-[16/9]" priority />

        <div className="grid gap-12 border-b border-line py-14 md:py-20 lg:grid-cols-12 lg:gap-8">
          <section aria-labelledby="about-event" className="lg:col-span-7">
            <MonoLabel as="h2" id="about-event">
              About the event
            </MonoLabel>
            <p className="mt-5 text-[clamp(1.125rem,1.6vw,1.375rem)] leading-[1.6] text-text/90">{event.description}</p>
            {event.tags.length > 0 && <TagList items={event.tags} className="mt-8" />}
          </section>

          <aside aria-label="Event details" className="lg:col-span-4 lg:col-start-9">
            <dl className="divide-y divide-line border-y border-line text-[14px]">
              <Fact label="Date">{eventDateRange(event.starts_at, event.ends_at)}</Fact>
              <Fact label="Time">{eventTime(event.starts_at)}</Fact>
              <Fact label="Venue">{event.venue}</Fact>
              <Fact label="Type">{EVENT_TYPE_LABEL[event.type]}</Fact>
            </dl>
            {upcoming && <Countdown to={event.starts_at} className="mt-6" />}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {upcoming && event.registration_url && (
                <Button href={event.registration_url} size="lg" arrow>
                  Register
                </Button>
              )}
              {event.has_gallery && <ArrowLink href={`/gallery/${event.slug}`}>Open the journal</ArrowLink>}
            </div>
          </aside>
        </div>

        {event.photos.length > 0 && (
          <section aria-labelledby="event-photos" className="border-b border-line py-14 md:py-20">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <MonoLabel as="h2" id="event-photos">
                Photos · {event.photos.length}
              </MonoLabel>
              <ArrowLink href={`/gallery/${event.slug}`}>Full journal</ArrowLink>
            </div>
            <MediaGrid items={event.photos.slice(0, 12)} title={event.title} slug={event.slug} className="mt-8" />
          </section>
        )}

        {others.length > 0 && (
          <section aria-labelledby="more-events" className="py-14 md:py-20">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="more-events" className="type-h2">
                More events
              </h2>
              <ArrowLink href="/events">All events</ArrowLink>
            </div>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {others.map((e) => (
                <li key={e.id}>
                  <EventRow event={e} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-4 py-4">
      <dt className="mono-label pt-0.5 text-faint">{label}</dt>
      <dd className="text-text/90">{children}</dd>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaGrid } from "@/components/gallery/MediaGrid";
import { ShareButton } from "@/components/gallery/ShareButton";
import { Button } from "@/components/ui";
import { getJournal, getJournals } from "@/lib/data";
import { isMedia, isNote, journalDate } from "@/lib/gallery";

/** Every journal is prerendered; a new event's journal renders on its first visit. */
export async function generateStaticParams() {
  return (await getJournals()).map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const journal = await getJournal(slug);
  if (!journal) return { title: "Journal not found" };
  return {
    title: `${journal.event.title}: photos`,
    description: `Photos, clips and notes from ${journal.event.title}.`,
  };
}

/** A journal (DESIGN.md §14). Params are read inside <Suspense> (DESIGN.md §9). */
export default function JournalPage({ params }: PageProps<"/gallery/[slug]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-svh" />}>
      <JournalFromParams params={params} />
    </Suspense>
  );
}

async function JournalFromParams({ params }: { params: PageProps<"/gallery/[slug]">["params"] }) {
  const { slug } = await params;
  const journal = await getJournal(slug);
  if (!journal) notFound();
  const { event, items } = journal;
  const media = items.filter(isMedia);
  const photos = media.filter((i) => i.type === "photo").length;
  const videos = media.length - photos;
  const notes = items.filter(isNote).length;

  return (
    <article className="pt-header">
      <div className="shell">
        <nav aria-label="Breadcrumb" className="pt-8 md:pt-12">
          <ol className="flex items-center gap-2 text-[13px] text-faint">
            <li>
              <Link href="/gallery" className="transition-colors duration-300 hover:text-text">
                Gallery
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-muted">
              {event.title}
            </li>
          </ol>
        </nav>

        <header className="flex flex-col gap-8 border-b border-line pt-10 pb-10 md:pt-14 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[12px] tracking-[0.04em] text-faint">
              {journalDate(event.starts_at)} · {event.venue}
            </p>
            <h1 className="type-h1 mt-5 max-w-[20ch]">{event.title}</h1>
            <p className="mt-5 text-[15px] text-muted">
              {[
                `${photos} ${photos === 1 ? "photo" : "photos"}`,
                videos > 0 && `${videos} ${videos === 1 ? "video" : "videos"}`,
                notes > 0 && `${notes} ${notes === 1 ? "note" : "notes"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareButton title={`${event.title}: photos`} />
            <Button href={`/events/${event.slug}`} variant="secondary" size="sm" arrow>
              About the event
            </Button>
          </div>
        </header>

        <MediaGrid items={items} title={event.title} slug={event.slug} className="py-10 md:py-14" />
      </div>
    </article>
  );
}

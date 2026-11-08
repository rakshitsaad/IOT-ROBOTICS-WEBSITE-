import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JournalViewer } from "@/components/gallery/JournalViewer";
import { getJournal, getJournals } from "@/lib/data";

/** Every journal on the shelf is prerendered; a new event's journal renders on its first visit. */
export async function generateStaticParams() {
  return (await getJournals()).map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const journal = await getJournal(slug);
  if (!journal) return { title: "Journal not found" };
  return {
    title: `${journal.event.title} journal`,
    description: `${journal.pages.length} pages of photos, clips and notes from ${journal.event.title}.`,
  };
}

/**
 * The params are read inside <Suspense>, so a client navigation from the shelf
 * never waits on them (instant navigation). The fallback holds the viewer's
 * full-screen height, so the footer never flashes up while it streams in.
 */
export default function JournalPage({ params }: PageProps<"/gallery/[slug]">) {
  return (
    <>
      <Suspense fallback={<div aria-hidden="true" className="h-svh" />}>
        <JournalFromParams params={params} />
      </Suspense>
    </>
  );
}

async function JournalFromParams({ params }: { params: PageProps<"/gallery/[slug]">["params"] }) {
  const { slug } = await params;
  const journal = await getJournal(slug);
  if (!journal) notFound();
  return <JournalViewer journal={journal} />;
}

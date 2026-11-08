import type { Metadata } from "next";
import Link from "next/link";
import { FactList, PageHeader, Photo } from "@/components/ui";
import { getJournals } from "@/lib/data";
import { journalDate, type JournalSummary } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo journals from the club's events: expos, hackathons and build nights.",
};

/** /gallery (DESIGN.md §14): one journal per event, grouped by year. */
export default async function GalleryPage() {
  const journals = await getJournals();
  const photos = journals.reduce((sum, j) => sum + j.photos, 0);
  const videos = journals.reduce((sum, j) => sum + j.videos, 0);
  const years = [...new Set(journals.map((j) => j.year))].sort((a, b) => b - a);

  return (
    <>
      <PageHeader
        label="Gallery"
        title="One journal per event."
        intro="The photos, clips and notes we kept from each day. Open a journal to see everything, full screen."
        aside={
          <FactList
            items={[
              { label: "Journals", value: journals.length },
              { label: "Photos", value: photos },
              ...(videos > 0 ? [{ label: "Videos", value: videos }] : []),
            ]}
          />
        }
      />
      <div className="shell pb-8">
        {years.map((year) => {
          const inYear = journals.filter((j) => j.year === year);
          return (
            <section key={year} aria-labelledby={`journals-${year}`} className="pt-14 md:pt-16">
              <h2 id={`journals-${year}`} className="flex items-baseline gap-4 border-b border-line pb-4">
                <span className="text-[20px] font-semibold tracking-[-0.02em] tabular-nums">{year}</span>
                <span className="font-mono text-[12px] text-faint">
                  {inYear.length} {inYear.length === 1 ? "journal" : "journals"}
                </span>
              </h2>
              <ul className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {inYear.map((j, i) => (
                  <li key={j.slug} data-reveal>
                    <JournalCard journal={j} priority={year === years[0] && i < 3} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

function JournalCard({ journal: j, priority }: { journal: JournalSummary; priority: boolean }) {
  const counts = [
    `${j.photos} ${j.photos === 1 ? "photo" : "photos"}`,
    j.videos > 0 && `${j.videos} ${j.videos === 1 ? "video" : "videos"}`,
    j.notes > 0 && `${j.notes} ${j.notes === 1 ? "note" : "notes"}`,
  ].filter(Boolean);
  return (
    <Link href={`/gallery/${j.slug}`} className="group/photo block">
      <Photo src={j.cover_url} alt={`${j.title}, cover photo`} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" ratio="aspect-[3/2]" priority={priority} zoom />
      <p className="mt-5 font-mono text-[11px] tracking-[0.04em] text-faint">{journalDate(j.date)}</p>
      <h3 className="type-h3 mt-2 flex items-center gap-3">
        {j.title}
        <span aria-hidden="true" className="text-faint transition-[transform,color] duration-300 ease-power3 group-hover/photo:translate-x-1 group-hover/photo:text-red">
          →
        </span>
      </h3>
      <p className="mt-1.5 text-[14px] text-muted">{counts.join(" · ")}</p>
    </Link>
  );
}

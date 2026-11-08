import type { Metadata } from "next";
import { GridBackground, MonoLabel } from "@/components/ui";
import { JournalShelf } from "@/components/gallery/JournalShelf";
import { getJournals } from "@/lib/data";
import { pad2 } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo journals from the club's events: expos, hackathons and build nights.",
};

export default async function GalleryPage() {
  const journals = await getJournals();
  const photos = journals.reduce((sum, j) => sum + j.photos, 0);

  return (
    <>
      <GridBackground />
      <section aria-labelledby="journals-title" className="shell pt-header pb-8">
        <div className="pt-14 md:pt-24">
          <MonoLabel as="p">
            [{pad2(journals.length)}] Events / [{pad2(photos)}] Photos
          </MonoLabel>
          <h1
            id="journals-title"
            className="mt-4 text-[length:clamp(3.4rem,11vw,10rem)] leading-[0.9] font-extrabold tracking-[-0.045em]"
          >
            Journals
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] text-muted">
            <strong className="font-semibold text-text">One journal per event.</strong> Open one to flip through
            the photos, clips and notes we kept from the day.
          </p>
        </div>
        <JournalShelf journals={journals} />
      </section>
    </>
  );
}

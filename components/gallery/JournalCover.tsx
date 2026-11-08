import Image from "next/image";
import Link from "next/link";
import { MonoLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { journalDate, pad2, type JournalSummary } from "@/lib/gallery";

/**
 * A journal on the /gallery shelf (DESIGN.md §14): the event's cover photo
 * bound like a notebook (spine shade, elastic band), then the title, the mono
 * date and "[19] PAGES".
 *
 * Hover or focus opens it a little: the cover turns -12° on its spine and three
 * page edges slide out from its right side. Plain CSS, so it works without JS
 * (and is instant under reduced motion, like every transition).
 */

/** How far each page edge slides out, as a share of the cover's width, and its delay. */
const EDGES = [
  { inset: "1.5%", out: "group-hover/journal:translate-x-[7%] group-focus-visible/journal:translate-x-[7%]", delay: "delay-0" },
  { inset: "3%", out: "group-hover/journal:translate-x-[10%] group-focus-visible/journal:translate-x-[10%]", delay: "delay-[40ms]" },
  { inset: "4.5%", out: "group-hover/journal:translate-x-[13%] group-focus-visible/journal:translate-x-[13%]", delay: "delay-[80ms]" },
] as const;

export function JournalCover({ journal, eager = false }: { journal: JournalSummary; eager?: boolean }) {
  return (
    <Link
      href={`/gallery/${journal.slug}`}
      data-cursor="view"
      className="group/journal block rounded-image focus-visible:outline-offset-8"
    >
      <div>
        <div className="relative aspect-[4/5] perspective-[1400px]">
          {/* Page edges, behind the cover (the last one is the deepest). */}
          {[...EDGES].reverse().map((edge) => (
            <span
              key={edge.inset}
              aria-hidden="true"
              style={{ top: edge.inset, bottom: edge.inset }}
              className={cn(
                "absolute inset-x-0 rounded-r-image border-r border-bg/10 bg-white shadow-[0_6px_18px_-8px] shadow-black/60",
                "transition-transform duration-[600ms] ease-power3",
                edge.out,
                edge.delay,
              )}
            />
          ))}

          {/* The cover, hinged on its spine (left edge). */}
          <div
            className={cn(
              "absolute inset-0 origin-left overflow-hidden rounded-image bg-bg-2 shadow-2xl shadow-black/60",
              "transition-transform duration-[600ms] ease-power3",
              "group-hover/journal:-rotate-y-12 group-focus-visible/journal:-rotate-y-12",
            )}
          >
            {journal.cover_url && (
              <Image
                src={journal.cover_url}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                loading={eager ? "eager" : "lazy"}
                className="object-cover transition-transform duration-[600ms] ease-power3 group-hover/journal:scale-[1.03]"
              />
            )}
            {/* Spine shade and crease. */}
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[8%] bg-linear-to-r from-black/55 to-transparent" />
            <span aria-hidden="true" className="absolute inset-y-0 left-[5.5%] w-px bg-white/20" />
            {/* Elastic band. */}
            <span aria-hidden="true" className="absolute inset-y-0 right-[9%] w-[3.2%] bg-bg/85 shadow-[0_0_10px] shadow-black/50" />
            {/* Light catching the cover as it turns. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-[600ms] ease-power3 group-hover/journal:opacity-100"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
        <h2 className="text-[22px] leading-tight font-bold tracking-[-0.02em] md:text-2xl">{journal.title}</h2>
        <MonoLabel className="mt-1.5 shrink-0">[{pad2(journal.pages)}] Pages</MonoLabel>
      </div>
      <MonoLabel as="p" className="mt-2">
        <time dateTime={journal.date}>{journalDate(journal.date)}</time>
      </MonoLabel>
    </Link>
  );
}

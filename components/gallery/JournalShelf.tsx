"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Pill } from "@/components/ui";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { JournalSummary } from "@/lib/gallery";
import { BEZIER, DURATION, STAGGER } from "@/lib/motion";
import { JournalCover } from "./JournalCover";

/**
 * The /gallery shelf (DESIGN.md §14): year filter pills, then a grid of
 * journal covers (1 column on phones, 3 from md). Changing the year fades the
 * covers out and back in place (Motion layout); instant under reduced motion.
 */
export function JournalShelf({ journals }: { journals: JournalSummary[] }) {
  const reduced = useReducedMotion();
  const [year, setYear] = useState<number | null>(null);

  const years = useMemo(() => [...new Set(journals.map((j) => j.year))].sort((a, b) => b - a), [journals]);
  const shown = year === null ? journals : journals.filter((j) => j.year === year);
  const filters: Array<{ label: string; value: number | null }> = [
    { label: "All", value: null },
    ...years.map((y) => ({ label: String(y), value: y })),
  ];

  return (
    <div className="mt-10 md:mt-14">
      <div role="group" aria-label="Filter journals by year" className="flex flex-wrap gap-2">
        {filters.map(({ label, value }) => {
          const on = year === value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => setYear(value)}
              data-cursor="link"
              className="group/pill rounded-pill"
            >
              <Pill
                color={on ? "white" : "raised"}
                className={cn(
                  "block px-4 py-2.5 text-[13px] leading-none font-medium",
                  "transition-[background-color,color] duration-[350ms] ease-power3",
                  !on && "group-hover/pill:bg-text/10",
                )}
              >
                {label}
              </Pill>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {shown.length} {shown.length === 1 ? "journal" : "journals"}
      </p>

      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 md:mt-12 md:grid-cols-3 lg:gap-x-10">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((journal, i) => (
            <motion.li
              key={journal.slug}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: DURATION.fast, ease: BEZIER.out, delay: reduced ? 0 : i * STAGGER }}
            >
              <JournalCover journal={journal} eager={i < 3} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

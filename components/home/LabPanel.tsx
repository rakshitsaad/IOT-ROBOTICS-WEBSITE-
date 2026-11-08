"use client";

import { AnimatePresence, motion } from "motion/react";
import { MonoLabel, PillButton } from "@/components/ui";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { BEZIER, DURATION } from "@/lib/motion";
import type { Accent } from "@/lib/types";
import { useLabStore } from "./lab-store";

/**
 * The pinned lab's live UI (md+): the station counter (top right) and the
 * station card (bottom right). Both follow useLabStore, which HomeScroll
 * updates when the scroll crosses a station boundary. The pip fills
 * ([data-pip-fill]) are scrubbed by HomeScroll's timeline.
 */

export interface LabPanelStation {
  title: string;
  short: string;
  description: string;
  href: string;
  accent: Accent;
}

/** "[02/04] ROBOTICS": the digit and the word roll like an odometer. */
export function LabCounter({ stations }: { stations: LabPanelStation[] }) {
  const station = useLabStore((s) => s.station);
  const total = String(stations.length).padStart(2, "0");
  return (
    <p className="mono-label shrink-0 text-text">
      <span className="sr-only">
        Station {station + 1} of {stations.length}: {stations[station]?.short}
      </span>
      <span aria-hidden="true" className="inline-flex items-start gap-[0.9em]">
        <span>
          [0
          <Roll index={station} items={stations.map((_, i) => String(i + 1))} />/{total}]
        </span>
        <Roll index={station} items={stations.map((s) => s.short)} />
      </span>
    </p>
  );
}

/** A one-line window onto a vertical column of items; changing `index` rolls the column. */
function Roll({ index, items }: { index: number; items: string[] }) {
  return (
    <span className="inline-block h-[1lh] overflow-hidden align-top">
      <span
        className="flex flex-col transition-transform duration-[900ms] ease-expo"
        style={{ transform: `translateY(${(-index * 100) / items.length}%)` }}
      >
        {items.map((item, i) => (
          <span key={i} className="block h-[1lh]">
            {item}
          </span>
        ))}
      </span>
    </span>
  );
}

export function LabCard({ stations }: { stations: LabPanelStation[] }) {
  const station = useLabStore((s) => s.station);
  const reduced = useReducedMotion();
  const s = stations[station] ?? stations[0];

  return (
    <div className="rounded-card border border-line bg-bg-2 p-6 lg:p-7">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={station}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { duration: DURATION.fast, ease: BEZIER.out } }}
          exit={{ opacity: 0, y: -6, transition: { duration: DURATION.micro * 0.6, ease: BEZIER.out } }}
        >
          <MonoLabel tone={s.accent}>
            {s.short}
          </MonoLabel>
          <h3 className="mt-3 text-[1.35rem] leading-tight font-bold tracking-[-0.02em]">{s.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-between gap-4">
        <PillButton href={s.href} variant="ghost" size="sm" arrow>
          See projects
        </PillButton>
        <div aria-hidden="true" className="flex items-center gap-1.5">
          {stations.map((_, i) => (
            <span
              key={i}
              className={cn(
                "relative h-1.5 overflow-hidden rounded-pill bg-text/20 transition-[width] duration-[600ms] ease-expo",
                i === station ? "w-10" : "w-1.5",
              )}
            >
              {/* Inline transform, not a scale-x class: Tailwind's `scale` property would multiply with GSAP's transform. */}
              <span
                data-pip-fill
                className="absolute inset-0 origin-left rounded-pill bg-text"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

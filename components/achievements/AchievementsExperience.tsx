"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { MonoLabel, Pill } from "@/components/ui";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { ACH_FILTERS, ACH_MOTION, matchesFilter, type AchFilter } from "@/lib/achievements";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import { useUIStore } from "@/lib/store";
import type { Achievement } from "@/lib/types";
import { AchievementsList } from "./AchievementsList";
import { AchievementsSlider } from "./AchievementsSlider";

/**
 * The /achievements page (DESIGN.md §19): the full-screen slider with its filters, and the "All achievements" list.
 *
 * - A filter fades the slider out (0.3s), rebuilds it for the filtered list, and fades it in (0.6s) once its first
 *   photo is decoded.
 * - A row of the list scrolls back up (Lenis, 1.2s) and then opens that slide (the card expands). A row outside the
 *   current filter switches to "All" first, and the rebuilt slider starts on it.
 */
export function AchievementsExperience({ items }: { items: Achievement[] }) {
  const lenis = useUIStore((s) => s.lenis);
  const [filter, setFilter] = useState<AchFilter>("all");
  const [initial, setInitial] = useState<string | undefined>(undefined);
  const [request, setRequest] = useState<{ slug: string; key: number } | null>(null);
  const [current, setCurrent] = useState(items[0]?.slug ?? "");
  const list = useMemo(() => items.filter((a) => matchesFilter(a, filter)), [items, filter]);

  const stage = useRef<HTMLDivElement>(null);
  const fading = useRef(false);

  /** Fade out, rebuild for `f` (starting on `start`), fade back in when it is ready. */
  const rebuild = (f: AchFilter, start?: string) => {
    const el = stage.current;
    if (!el || fading.current) return;
    fading.current = true;
    gsap.to(el, {
      opacity: 0,
      duration: ACH_MOTION.filterOut,
      ease: "power2.out",
      onComplete: () => {
        setInitial(start);
        setRequest(null);
        setFilter(f);
      },
    });
  };
  const onReady = useCallback(() => {
    if (!fading.current || !stage.current) return;
    fading.current = false;
    gsap.fromTo(stage.current, { opacity: 0 }, { opacity: 1, duration: ACH_MOTION.filterIn, ease: "power2.out" });
  }, []);

  const changeFilter = (f: AchFilter) => {
    if (f !== filter) rebuild(f);
  };

  const open = (slug: string) => {
    const inList = list.some((a) => a.slug === slug);
    const go = () => (inList ? setRequest((r) => ({ slug, key: (r?.key ?? 0) + 1 })) : rebuild("all", slug));
    if (window.scrollY < 4) return go();
    if (lenis && !prefersReducedMotion()) lenis.scrollTo(0, { duration: 1.2, onComplete: go });
    else {
      window.scrollTo({ top: 0, behavior: "auto" });
      go();
    }
  };

  return (
    <>
      <section aria-labelledby="achievements-title" className="relative overflow-hidden bg-bg md:h-svh md:min-h-[40rem]">
        <div ref={stage} className="relative md:absolute md:inset-0">
          {list.length ? (
            <AchievementsSlider
              key={filter}
              items={list}
              initial={initial}
              request={request}
              onChange={setCurrent}
              onReady={onReady}
            />
          ) : (
            <p className="grid min-h-svh place-items-center text-muted md:absolute md:inset-0 md:min-h-0">Nothing here yet.</p>
          )}
        </div>

        <div className="absolute top-[calc(var(--nav-h)+var(--ann-h)+1.25rem)] left-4 z-30 md:left-[6vw]">
          <MonoLabel as="h1" id="achievements-title" tone="text">
            Achievements / [{String(items.length).padStart(2, "0")}] Total
          </MonoLabel>
          <div role="group" aria-label="Filter achievements" className="mt-3.5 flex flex-wrap gap-2">
            {ACH_FILTERS.map(({ id, label }) => {
              const on = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => changeFilter(id)}
                  data-cursor="link"
                  className="group/pill rounded-pill"
                >
                  <Pill
                    color={on ? "white" : "raised"}
                    className={cn(
                      "block px-4 py-2.5 text-[13px] leading-none font-semibold",
                      "transition-[background-color,color] duration-[350ms] ease-power3",
                      !on && "bg-bg-2/70 backdrop-blur-md group-hover/pill:bg-text/15",
                    )}
                  >
                    {label}
                  </Pill>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <AchievementsList items={items} active={current} onOpen={open} />
    </>
  );
}

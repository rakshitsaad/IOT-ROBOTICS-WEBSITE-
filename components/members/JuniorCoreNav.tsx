"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Pill } from "@/components/ui";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { juniorRowId } from "@/lib/members";
import { DURATION } from "@/lib/motion";
import { useUIStore } from "@/lib/store";
import type { Accent } from "@/lib/types";
import { scrollPageTo, stickyOffset } from "./junior-scroll";

/**
 * Junior Core's sticky row of team pills (DESIGN.md §13). It sticks right
 * under the fixed header for as long as the section is on screen.
 *
 * - Clicking a pill scrolls to that team's row (Lenis, or native scroll),
 *   leaving room for the header and this bar, highlights the row for
 *   HIGHLIGHT_MS and moves focus to the row's heading.
 * - The pill of the row under the bar is filled in its team accent (a scroll
 *   spy on ScrollTriggers, refreshed after Senior Core's pin).
 * - On phones the pills scroll sideways, and the current one is kept in view.
 *
 * The pills are real in-page links, so without JS they still jump to the row
 * (the rows have a scroll-margin for the header and bar).
 */

export interface JuniorCoreNavTeam {
  slug: string;
  name: string;
  accent: Accent;
}

/** How long a row stays highlighted after its pill is clicked (ms). */
const HIGHLIGHT_MS = 1800;
/** Gap between the bar and a row scrolled to by its pill (px). */
const ROW_GAP = 24;

export function JuniorCoreNav({ teams }: { teams: JuniorCoreNavTeam[] }) {
  const lenis = useUIStore((s) => s.lenis);
  const [current, setCurrent] = useState<string | null>(null);
  const strip = useRef<HTMLUListElement>(null);
  const indicator = useRef<HTMLLIElement>(null);
  /** The team the indicator was last placed on (null: hidden). */
  const shown = useRef<string | null>(null);
  /** True while a pill's scroll runs, so the spy doesn't flick through the rows it passes. */
  const steering = useRef(false);
  const highlight = useRef<{ row: HTMLElement; timer: number } | null>(null);

  /* Scroll spy: a row is current while it spans a line 40% down the screen (never above the bar). */
  useGSAP(
    () => {
      const line = () => Math.round(Math.max(stickyOffset() + ROW_GAP * 2, window.innerHeight * 0.4));
      teams.forEach(({ slug }, i) => {
        const row = document.getElementById(juniorRowId(slug));
        if (!row) return;
        ScrollTrigger.create({
          trigger: row,
          start: () => `top ${line()}px`,
          end: () => `bottom ${line()}px`,
          refreshPriority: -1, // below Senior Core's horizontal pin
          onToggle: (self) => {
            if (self.isActive && !steering.current) setCurrent(slug);
          },
          onLeaveBack: i === 0 ? () => !steering.current && setCurrent(null) : undefined,
        });
      });
    },
    { dependencies: [teams] },
  );

  /* Phones: a red pill slides behind the strip to the current team (positions written straight to the DOM). It
     slides only from a pill that was showing; from none it appears in place, and re-measures when pills resize. */
  useEffect(() => {
    const ul = strip.current;
    const ind = indicator.current;
    if (!ul || !ind) return;
    const place = (slide: boolean) => {
      const li = current ? ul.querySelector<HTMLElement>(`[data-team="${current}"]`) : null;
      if (!li) {
        ind.style.opacity = "0";
        return;
      }
      ind.style.transitionProperty = slide ? "" : "opacity";
      ind.style.width = `${li.offsetWidth}px`;
      ind.style.height = `${li.offsetHeight}px`;
      ind.style.transform = `translate(${li.offsetLeft}px, ${li.offsetTop}px)`;
      ind.style.opacity = "1";
    };
    place(shown.current !== null);
    shown.current = current;
    let first = true; // ResizeObserver reports once on observe: skip that, it would cut the slide
    const ro = new ResizeObserver(() => {
      if (first) first = false;
      else place(false);
    });
    ul.querySelectorAll("[data-team]").forEach((li) => ro.observe(li));
    return () => ro.disconnect();
  }, [current]);

  /* Phones: keep the current pill in view inside the sideways-scrolling strip. */
  useEffect(() => {
    const el = strip.current;
    if (!el || !current || el.scrollWidth <= el.clientWidth) return;
    const pill = el.querySelector<HTMLElement>(`[data-team="${current}"]`);
    if (!pill) return;
    const left = pill.offsetLeft - (el.clientWidth - pill.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion() ? "instant" : "smooth" });
  }, [current]);

  useEffect(
    () => () => {
      if (!highlight.current) return;
      window.clearTimeout(highlight.current.timer);
      highlight.current.row.removeAttribute("data-highlight");
    },
    [],
  );

  const go = (e: MouseEvent<HTMLAnchorElement>, slug: string) => {
    const row = document.getElementById(juniorRowId(slug));
    if (!row || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // Lenis handles in-page links itself (anchors: true) but without our offset, so keep the click from it.
    e.stopPropagation();

    // Highlight the row (restarting if it already is).
    if (highlight.current) {
      window.clearTimeout(highlight.current.timer);
      highlight.current.row.removeAttribute("data-highlight");
    }
    row.setAttribute("data-highlight", "");
    highlight.current = {
      row,
      timer: window.setTimeout(() => {
        row.removeAttribute("data-highlight");
        highlight.current = null;
      }, HIGHLIGHT_MS),
    };

    steering.current = true;
    setCurrent(slug);
    const y = row.getBoundingClientRect().top + window.scrollY - stickyOffset() - ROW_GAP;
    scrollPageTo(y, lenis, {
      duration: DURATION.slow,
      done: () => {
        steering.current = false;
      },
    });
    // Keyboard users continue from the row they jumped to.
    row.querySelector<HTMLElement>("[data-jc-row-title]")?.focus({ preventScroll: true });
  };

  return (
    <div
      data-jc-bar
      className="sticky top-(--nav-h) z-20 border-y border-line bg-bg/80 backdrop-blur-xl backdrop-saturate-150"
    >
      <nav aria-label="Junior Core teams">
        <ul
          ref={strip}
          className="shell relative flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Phones: the sliding active pill, behind the strip (-z-10 stays inside the bar's stacking context). */}
          <li
            ref={indicator}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 -z-10 rounded-pill bg-red opacity-0 transition-[transform,width,height,opacity] duration-[600ms] ease-expo motion-reduce:transition-none md:hidden"
          />
          {teams.map(({ slug, name, accent }) => {
            const on = current === slug;
            return (
              <li key={slug} data-team={slug} className="shrink-0">
                <a
                  href={`#${juniorRowId(slug)}`}
                  onClick={(e) => go(e, slug)}
                  aria-current={on ? "true" : undefined}
                  data-cursor="link"
                  className="group/pill block rounded-pill"
                >
                  <Pill
                    color={on ? accent : "raised"}
                    className={cn(
                      "block px-4 py-2.5 text-[13px] leading-none font-medium whitespace-nowrap",
                      "transition-[background-color,color,box-shadow] duration-[350ms] ease-power3",
                      !on && "group-hover/pill:bg-text/10",
                      // Phones: the sliding indicator is the active fill, so the active pill is clear, and the others
                      // are a translucent charcoal (the same tone on the bar) so the indicator shows as it passes.
                      on ? "max-md:bg-transparent" : "max-md:bg-text/6",
                    )}
                  >
                    {name}
                  </Pill>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

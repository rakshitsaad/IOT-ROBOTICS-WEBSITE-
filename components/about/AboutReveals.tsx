"use client";

import { useRef, type ReactNode } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";

/**
 * Reveals for the /about sections below the intro (DESIGN.md §15):
 * - [data-reveal] rises 40px and fades in once at `top 80%`;
 * - [data-reveal-group] does the same for its [data-reveal-item]s, 0.06s apart;
 * - [data-timeline]: the line draws itself (scrubbed) from the list's top at
 *   70% of the viewport to its bottom at 70%; each dot lights up as the line
 *   passes it; each card slides in from its side.
 * Nothing under reduced motion. Every trigger has refreshPriority -1, so it
 * refreshes after the intro's pin above it.
 */
export function AboutReveals({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const q = gsap.utils.selector(root);
      const reveal = { y: 40, opacity: 0, duration: DURATION.base, ease: EASE.out };

      q("[data-reveal]").forEach((el) => {
        gsap.from(el, { ...reveal, scrollTrigger: { trigger: el, start: "top 80%", once: true, refreshPriority: -1 } });
      });
      q("[data-reveal-group]").forEach((group) => {
        gsap.from(group.querySelectorAll("[data-reveal-item]"), {
          ...reveal,
          stagger: STAGGER,
          scrollTrigger: { trigger: group, start: "top 80%", once: true, refreshPriority: -1 },
        });
      });

      const wide = window.matchMedia("(min-width: 768px)").matches;
      q("[data-timeline]").forEach((list) => {
        gsap.fromTo(
          list.querySelector("[data-timeline-line]"),
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: list, start: "top 70%", end: "bottom 70%", scrub: true, refreshPriority: -1 },
          },
        );
        list.querySelectorAll("[data-timeline-dot]").forEach((dot) => {
          ScrollTrigger.create({ trigger: dot, start: "top 70%", toggleClass: "is-lit", refreshPriority: -1 });
        });
        list.querySelectorAll<HTMLElement>("[data-timeline-card]").forEach((card) => {
          gsap.from(card, {
            ...reveal,
            x: wide ? (card.dataset.side === "left" ? -40 : 40) : 0,
            y: wide ? 0 : 30,
            scrollTrigger: { trigger: card, start: "top 80%", once: true, refreshPriority: -1 },
          });
        });
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return <div ref={root}>{children}</div>;
}

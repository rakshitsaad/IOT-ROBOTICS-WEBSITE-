"use client";

import { useRef, type ReactNode } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";

/**
 * Reveals for the /join sections under the hero (DESIGN.md §21):
 * - [data-reveal] rises 40px and fades in once at `top 80%`; [data-reveal-group]'s [data-reveal-item]s do the same,
 *   0.06s apart (the benefit and team cards).
 * - [data-steps]: the line is measured from the first dot to the last (horizontal from md, vertical on phones) and
 *   draws itself as the list scrolls through (scrubbed, from its top at 75% of the screen to its bottom at 55%); each
 *   dot lights up as the line reaches it.
 * Nothing under reduced motion: the line is drawn and every dot is lit (the server HTML's state).
 */
export function JoinReveals({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const q = gsap.utils.selector(root);
      const reveal = { y: 40, opacity: 0, duration: DURATION.base, ease: EASE.out };
      q("[data-reveal]").forEach((el) => {
        gsap.from(el, { ...reveal, scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      });
      q("[data-reveal-group]").forEach((group) => {
        gsap.from(group.querySelectorAll("[data-reveal-item]"), {
          ...reveal,
          stagger: STAGGER,
          scrollTrigger: { trigger: group, start: "top 80%", once: true },
        });
      });

      q("[data-steps]").forEach((list) => {
        const line = list.querySelector<HTMLElement>("[data-steps-line]");
        const track = list.querySelector<HTMLElement>("[data-steps-track]");
        const dots = [...list.querySelectorAll<HTMLElement>("[data-step-dot]")];
        if (!line || !track || dots.length < 2) return;
        let along: number[] = [];
        const wide = () => window.matchMedia("(min-width: 768px)").matches;
        // Place the line and the track between the first and last dot centres, and note where each dot sits along it.
        const measure = () => {
          const l = list.getBoundingClientRect();
          const c = dots.map((d) => {
            const r = d.getBoundingClientRect();
            return { x: r.left + r.width / 2 - l.left, y: r.top + r.height / 2 - l.top };
          });
          const h = wide();
          const a = h ? c.map((p) => p.x) : c.map((p) => p.y);
          const len = a[a.length - 1] - a[0];
          for (const el of [line, track]) {
            el.style.left = `${c[0].x - (h ? 0 : 0.5)}px`;
            el.style.top = `${c[0].y - (h ? 0.5 : 0)}px`;
            el.style.width = h ? `${len}px` : "1px";
            el.style.height = h ? "1px" : `${len}px`;
          }
          line.style.transformOrigin = h ? "0 50%" : "50% 0";
          along = a.map((v) => (v - a[0]) / (len || 1));
        };
        measure();
        const light = (p: number) => dots.forEach((d, i) => d.classList.toggle("is-lit", p >= along[i] - 0.002));
        light(0);
        gsap.fromTo(
          line,
          { scaleX: () => (wide() ? 0 : 1), scaleY: () => (wide() ? 1 : 0) },
          {
            scaleX: 1,
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: list,
              start: "top 75%",
              end: "bottom 55%",
              scrub: true,
              invalidateOnRefresh: true,
              onRefresh: (st) => {
                measure();
                light(st.progress);
              },
              onUpdate: (st) => light(st.progress),
            },
          },
        );
      });
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [reduced] },
  );

  return <div ref={root}>{children}</div>;
}

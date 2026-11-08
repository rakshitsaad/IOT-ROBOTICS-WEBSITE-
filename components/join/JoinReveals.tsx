"use client";

import { useRef, type ReactNode } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";

/**
 * Reveals for the /join sections under the hero (DESIGN.md §21), and nothing else: [data-reveal] fades in and rises
 * 20px once at `top 80%`; [data-reveal-group]'s [data-reveal-item]s do the same, 0.06s apart (the benefit, team and
 * step lists). Nothing under reduced motion.
 */
export function JoinReveals({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const q = gsap.utils.selector(root);
      const reveal = { y: 20, opacity: 0, duration: DURATION.base, ease: EASE.out };
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

      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [reduced] },
  );

  return <div ref={root}>{children}</div>;
}

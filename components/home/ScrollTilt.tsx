"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

/**
 * Starts tilted by `from` degrees and straightens as it scrolls into view
 * (scrubbed, from entering the viewport until its centre reaches the middle).
 * Renders straight, which is also the reduced-motion state.
 */
export function ScrollTilt({ from = 3, className, children }: { from?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.fromTo(
        ref.current,
        { rotation: from },
        {
          rotation: 0,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "center center",
            scrub: true,
            // Refresh after HomeScroll's pins, which sit above this on the page.
            refreshPriority: -1,
          },
        },
      );
    },
    { scope: ref, dependencies: [reduced, from], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

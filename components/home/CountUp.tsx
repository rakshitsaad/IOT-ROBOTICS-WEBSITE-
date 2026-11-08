"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { DURATION, EASE } from "@/lib/motion";

/**
 * A number that counts up from 0 once it scrolls into view. Renders the
 * final value (no JS, reduced motion); the count writes textContent directly,
 * never React state.
 */
export function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (prefersReducedMotion() || !el) return;
      const counter = { v: 0 };
      el.textContent = "0";
      gsap.to(counter, {
        v: value,
        duration: DURATION.slow,
        delay,
        ease: EASE.out,
        onUpdate: () => {
          el.textContent = String(Math.round(counter.v));
        },
        scrollTrigger: { trigger: el, start: "top 85%", once: true, refreshPriority: -1 },
      });
      return () => {
        el.textContent = String(value);
      };
    },
    { scope: ref, dependencies: [reduced, value, delay], revertOnUpdate: true },
  );

  return <span ref={ref}>{value}</span>;
}

"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useUIStore } from "@/lib/store";
import {
  prefersReducedMotion,
  useReducedMotion,
} from "@/hooks/use-reduced-motion";

/**
 * Lenis smooth scrolling, driven by the GSAP ticker so ScrollTrigger and
 * Lenis share one clock. Not created at all under prefers-reduced-motion.
 *
 * Get the instance anywhere with: useUIStore((s) => s.lenis)
 * Opt a scrollable child out with the `data-lenis-prevent` attribute.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const setLenis = useUIStore((s) => s.setLenis);

  useEffect(() => {
    if (reduced || prefersReducedMotion()) return;

    const lenis = new Lenis({
      lerp: 0.1,
      anchors: true,
      stopInertiaOnNavigate: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    setLenis(lenis);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      setLenis(null);
    };
  }, [reduced, setLenis]);

  return <>{children}</>;
}

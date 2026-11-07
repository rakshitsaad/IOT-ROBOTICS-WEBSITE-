"use client";

import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { BEZIER, DURATION } from "@/lib/motion";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Route transition: page content fades in and rises 12px.
 * Rendered by app/template.tsx, which remounts on every navigation.
 *
 * The first (server-rendered) page is NOT animated: its HTML must be visible
 * before JS loads. Only client-side navigations animate. Reduced motion:
 * no animation.
 */
let hasMountedOnce = false;

export function PageTransition({ children }: { children: ReactNode }) {
  const [animate] = useState(() => hasMountedOnce && !prefersReducedMotion());

  useEffect(() => {
    hasMountedOnce = true;
    // New page, new layout: let ScrollTrigger re-measure once it has painted.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.fast, ease: BEZIER.out }}
    >
      {children}
    </motion.div>
  );
}

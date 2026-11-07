"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { BEZIER, DURATION } from "@/lib/motion";
import { SmoothScroll } from "./SmoothScroll";

/**
 * Global client providers.
 * MotionConfig reducedMotion="user" makes every Motion (Framer) animation drop
 * transforms when the OS asks for reduced motion; components still check
 * useReducedMotion() to skip animation entirely and show final states.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.fast, ease: BEZIER.out }}
    >
      <SmoothScroll>{children}</SmoothScroll>
    </MotionConfig>
  );
}

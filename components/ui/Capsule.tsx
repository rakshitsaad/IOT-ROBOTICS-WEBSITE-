"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Accent } from "@/lib/types";
import {
  prefersReducedMotion,
  useReducedMotion,
} from "@/hooks/use-reduced-motion";

/**
 * Tall, fully rounded rectangle used as a decorative parallax shape.
 * Size it with className (default w-20 h-56 / md:w-28 md:h-80).
 *
 * `speed` drives a scrubbed ScrollTrigger parallax: the shape travels
 * speed × 120px in each direction while it crosses the viewport. Negative
 * values move against the scroll. 0 = static. Disabled under reduced motion.
 *
 *   <Capsule tone="iris" speed={0.4} className="w-16 h-48" />
 */
export type CapsuleTone = Accent | "maroon" | "iris" | "iris-line" | "raised" | "outline" | "glass" | "haze";

const TONE: Record<CapsuleTone, string> = {
  red: "bg-red",
  white: "bg-text",
  maroon: "bg-maroon",
  iris: "bg-iris",
  /** Raised fill with a 1px --iris (maroon → red) border. */
  "iris-line": "iris-border bg-bg-2",
  raised: "bg-bg-2 border border-line",
  outline: "border border-text/20",
  glass: "border border-line bg-text/[0.04] backdrop-blur-md",
  /** Near-white at 6%: a faint light shape (cheaper than glass, no blur). */
  haze: "bg-text/[0.06]",
};

interface CapsuleProps {
  tone?: CapsuleTone;
  speed?: number;
  /** Static rotation in degrees. */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
  /** Optional content (e.g. an image) clipped to the capsule. */
  children?: ReactNode;
}

const TRAVEL = 120;

export function Capsule({
  tone = "raised",
  speed = 0,
  rotate = 0,
  className,
  style,
  children,
}: CapsuleProps) {
  const root = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (!speed || prefersReducedMotion() || !inner.current) return;
      gsap.fromTo(
        inner.current,
        { y: -speed * TRAVEL },
        {
          y: speed * TRAVEL,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: root, dependencies: [speed, reduced] },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={cn("pointer-events-none h-56 w-20 shrink-0 md:h-80 md:w-28", className)}
      style={{ rotate: rotate ? `${rotate}deg` : undefined, ...style }}
    >
      <div
        ref={inner}
        className={cn("size-full overflow-hidden rounded-pill will-change-transform", TONE[tone])}
      >
        {children}
      </div>
    </div>
  );
}

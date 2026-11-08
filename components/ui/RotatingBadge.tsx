"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Circular text badge: `items` set in mono caps around a ring, joined by
 * "*", with an x in the centre. It turns slowly (one turn per `period`
 * seconds) and speeds up while the page scrolls, easing back afterwards.
 * Paused while off screen. Static under reduced motion.
 * Size it with className (default size-36, md:size-44); colour follows
 * currentColor (default text-text).
 *
 *   <RotatingBadge items={["IoT & Robotics", "Senior Core", "2026"]} />
 */
interface RotatingBadgeProps {
  items: string[];
  /** Seconds per turn at rest. */
  period?: number;
  /** Accessible name. Without one the badge is decorative (aria-hidden). */
  label?: string;
  className?: string;
}

/** Ring radius in the 200-unit viewBox; the text runs along it. */
const R = 78;
/** Most the scroll can multiply the speed by, and how fast that boost fades per frame (60fps). */
const BOOST_MAX = 7;
const BOOST_DECAY = 0.94;
/** Scroll speed (px/s) that adds 1× to the turning speed. */
const PX_PER_BOOST = 450;

export function RotatingBadge({ items, period = 20, label, className }: RotatingBadgeProps) {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();
  const pathId = useId();
  const text = items.map((t) => `${t.toUpperCase()} * `).join("");

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ring.current || !root.current) return;
      const spin = gsap.to(ring.current, {
        rotation: 360,
        svgOrigin: "100 100",
        duration: period,
        ease: "none",
        repeat: -1,
        paused: true,
      });

      let boost = 0;
      let lastY = window.scrollY;
      let lastT = performance.now();
      const onScroll = () => {
        const now = performance.now();
        const v = (Math.abs(window.scrollY - lastY) / Math.max(8, now - lastT)) * 1000;
        lastY = window.scrollY;
        lastT = now;
        boost = Math.max(boost, Math.min(BOOST_MAX, v / PX_PER_BOOST));
      };
      const tick = (_: number, deltaMs: number) => {
        if (boost < 0.001) return;
        boost *= Math.pow(BOOST_DECAY, deltaMs / 16.67);
        spin.timeScale(1 + boost);
      };

      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) spin.play();
        else spin.pause();
      });
      io.observe(root.current);
      window.addEventListener("scroll", onScroll, { passive: true });
      gsap.ticker.add(tick);
      return () => {
        io.disconnect();
        window.removeEventListener("scroll", onScroll);
        gsap.ticker.remove(tick);
      };
    },
    { scope: root, dependencies: [reduced, period], revertOnUpdate: true },
  );

  return (
    <div
      ref={root}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("pointer-events-none size-36 shrink-0 text-text md:size-44", className)}
    >
      <svg viewBox="0 0 200 200" className="size-full overflow-visible" fill="none">
        <g ref={ring}>
          <path id={pathId} d={`M100,${100 - R} a${R},${R} 0 1,1 0,${2 * R} a${R},${R} 0 1,1 0,${-2 * R}`} />
          <text
            fill="currentColor"
            className="font-mono"
            style={{ fontSize: 13, letterSpacing: "0.1em" }}
          >
            {/* textLength spreads the letters evenly over the whole ring, whatever the text length. */}
            <textPath href={`#${pathId}`} textLength={2 * Math.PI * R - 4} lengthAdjust="spacing">
              {text}
            </textPath>
          </text>
        </g>
        <circle cx="100" cy="100" r="52" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
        <path d="M88 88L112 112M112 88L88 112" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
    </div>
  );
}

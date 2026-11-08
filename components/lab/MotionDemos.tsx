"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { useUIStore } from "@/lib/store";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { MonoLabel } from "@/components/ui/MonoLabel";

/** Live readout of the motion environment. */
export function MotionStatus() {
  const reduced = useReducedMotion();
  const lenis = useUIStore((s) => s.lenis);
  return (
    <dl className="grid grid-cols-2 gap-3 sm:max-w-md">
      <Stat label="prefers-reduced-motion" value={reduced ? "reduce" : "no-preference"} on={!reduced} />
      <Stat label="Lenis" value={lenis ? "running" : "off"} on={Boolean(lenis)} />
    </dl>
  );
}

function Stat({ label, value, on }: { label: string; value: string; on: boolean }) {
  return (
    <div className="rounded-image border border-line bg-bg-2 p-4">
      <dt className="mono-label text-muted">{label}</dt>
      <dd className="mt-2 flex items-center gap-2 text-sm font-semibold">
        <span className={on ? "size-2 rounded-full bg-red" : "size-2 rounded-full bg-muted"} />
        {value}
      </dd>
    </div>
  );
}

/**
 * Reference pattern for scroll-triggered reveals and scrubbed motion.
 * Note the two reduced-motion checks: the hook (dependency) and the
 * synchronous prefersReducedMotion() inside the GSAP callback.
 */
export function RevealDemo() {
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return; // final state: elements stay as rendered

      gsap.from("[data-reveal]", {
        y: 40,
        opacity: 0,
        duration: DURATION.base,
        ease: EASE.out,
        stagger: STAGGER,
        scrollTrigger: { trigger: scope.current, start: "top 80%" },
      });

      gsap.fromTo(
        "[data-scrub]",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: scope.current, start: "top 85%", end: "bottom 40%", scrub: true },
        },
      );
    },
    { scope, dependencies: [reduced] },
  );

  return (
    <div ref={scope} className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["power3.out", "expo.out", "0.6–1.2s", "stagger 0.06"].map((t) => (
          <div key={t} data-reveal className="rounded-image border border-line bg-bg-2 p-4">
            <MonoLabel>{t}</MonoLabel>
          </div>
        ))}
      </div>
      <div>
        <MonoLabel>Scrubbed progress (ScrollTrigger)</MonoLabel>
        <div className="mt-3 h-1 overflow-hidden rounded-pill bg-line">
          <div data-scrub className="h-full origin-left rounded-pill bg-iris" />
        </div>
      </div>
    </div>
  );
}


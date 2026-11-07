"use client";

import { useRef } from "react";
import { MonoLabel } from "@/components/ui";
import { DroneStage, droneState, useDroneStore } from "@/components/drone";
import { cn } from "@/lib/cn";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { globeCaption, MISSION, type MissionStats } from "@/lib/mission";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { MissionDashboard } from "./MissionDashboard";

/**
 * "Mission Control" (DESIGN.md §12): the drone flies over a dashboard of club stats.
 *
 * - The section is 100svh held for MISSION.hold screens (2.5; 1.5 on phones) with CSS sticky, like the lab, so the
 *   page-wide HomeScroll timeline measures it like any other section (no second GSAP pin).
 * - One scrubbed ScrollTrigger (scrub 1) writes the progress through the hold to droneState.progress; the drone's
 *   director turns it into phases (lib/mission.ts): arrive, scan, globe, free flight, dissolve.
 * - The robot never shows with it: HomeScroll fades the robot out before the section and back in after it, and
 *   html[data-mission-on] (set while any part of the section is on screen) hides the robot's stage outright, so a
 *   fast scroll can't catch the two together while the scrub catches up.
 * - Reduced motion: no hold, no canvas; the dashboard with the static drone poster.
 */
export function MissionControl({ stats }: { stats: MissionStats }) {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const globe = useDroneStore((s) => s.globe);

  useGSAP(
    () => {
      const el = section.current;
      if (!el) return;
      const html = document.documentElement;
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        refreshPriority: -1,
        onToggle: (st) => html.toggleAttribute("data-mission-on", st.isActive),
      });
      if (!prefersReducedMotion()) {
        const proxy = { p: 0 };
        gsap.to(proxy, {
          p: 1,
          ease: "none",
          onUpdate: () => {
            droneState.progress = proxy.p;
          },
          scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: MISSION.scrub, refreshPriority: -1 },
        });
      }
      return () => {
        html.removeAttribute("data-mission-on");
        droneState.progress = 0;
      };
    },
    { scope: section, dependencies: [reduced] },
  );

  return (
    <section
      ref={section}
      data-mission
      aria-labelledby="mission-title"
      className="relative bg-bg motion-safe:h-[250svh] md:motion-safe:h-[350svh]"
    >
      <div ref={viewport} className="sticky top-0 isolate flex h-svh flex-col overflow-clip motion-reduce:static motion-reduce:h-auto">
        {/* A faint maroon glow behind the dashboard. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,color-mix(in_oklab,var(--maroon)_42%,transparent),transparent_72%)]"
        />

        <div className="shell flex min-h-0 flex-1 flex-col pt-[calc(var(--nav-h)+clamp(0.5rem,2svh,1.5rem))] pb-[clamp(0.75rem,3svh,2rem)] motion-reduce:pb-24">
          <div className="flex shrink-0 items-end justify-between gap-4">
            <div>
              <MonoLabel index={3}>Mission control</MonoLabel>
              <h2
                id="mission-title"
                className="mt-[clamp(0.25rem,1svh,0.75rem)] text-[length:clamp(1.6rem,min(4.2vw,5.5svh),3.4rem)] leading-none font-bold tracking-[-0.04em]"
              >
                The club, live.
              </h2>
            </div>
            <MonoLabel className="items-center">
              <span className="relative mr-2 inline-block size-2 rounded-full bg-red align-middle">
                <span className="absolute inset-0 animate-pulse-soft rounded-full bg-red motion-reduce:animate-none" />
              </span>
              Live data
            </MonoLabel>
          </div>
          <MissionDashboard
            stats={stats}
            className="mt-[clamp(0.6rem,2.2svh,1.75rem)] flex-1 motion-safe:grid-rows-3 md:motion-safe:grid-rows-2 motion-reduce:[&>*]:min-h-56"
          />
        </div>

        <DroneStage
          root={viewport}
          mode="scroll"
          posterClassName="right-[var(--gutter)] top-[calc(var(--nav-h)-1.5rem)] h-[clamp(7rem,18svh,11rem)] w-[min(40vw,16rem)]"
        />

        {/* Under the globe (desktop): the club's line. */}
        <p
          aria-hidden={!globe}
          className={cn(
            "mono-label pointer-events-none absolute top-[88%] left-1/2 -translate-x-1/2 rounded-pill bg-bg/80 px-4 py-2 whitespace-nowrap text-text ring-1 ring-line backdrop-blur-sm",
            "transition-opacity duration-[600ms] ease-power3 max-md:hidden",
            globe ? "opacity-100" : "opacity-0",
          )}
        >
          {globeCaption(stats)}
        </p>
      </div>
    </section>
  );
}

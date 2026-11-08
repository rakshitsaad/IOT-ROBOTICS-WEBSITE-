"use client";

import { useRef, type ReactNode } from "react";
import { NotifyForm } from "@/components/home/NotifyForm";
import { IrisButton, MonoLabel } from "@/components/ui";
import { gsap, useGSAP } from "@/lib/gsap";
import { JOIN_HERO } from "@/lib/join";

/**
 * The /join hero (DESIGN.md §21): simple and calm. A mono label, a big uppercase headline, one line and one button,
 * over a crowd of small flat figures (`crowd`, the server-rendered <Crowd> SVGs) filling the bottom of the screen, with
 * one soft red glow rising from behind it.
 *
 * - Load (CSS keyframes from the server HTML): the label, headline, line and button fade up 12px, 60ms apart; the crowd
 *   fades in and rises 30px as one layer over 1.2s, just after.
 * - Scroll (scrubbed): the crowd moves at 0.85× the page (it drifts down 0.15× the scroll inside the hero) and fades out
 *   as the hero leaves.
 * - Nothing reacts to the cursor. Reduced motion: no fade-ups and no parallax.
 */
export function JoinHero({ recruitmentOpen, year, crowd }: { recruitmentOpen: boolean; year: number; crowd: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el.querySelector("[data-crowd-scroll]"),
          { y: 0, opacity: 1 },
          {
            y: () => el.offsetHeight * (1 - JOIN_HERO.parallax),
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const delay = (i: number) => ({ animationDelay: `${JOIN_HERO.textDelay + i * JOIN_HERO.textStagger}ms` });
  const fade = "animate-fade-up motion-reduce:animate-none";

  return (
    <section ref={root} aria-labelledby="join-title" className="relative h-svh min-h-[34rem] overflow-hidden bg-bg">
      {/* One soft, wide glow rising from behind the crowd. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[85%] bg-radial-[75%_80%_at_50%_100%] from-red/10 via-red/[0.04] via-55% to-transparent to-85%"
      />

      <div className="relative z-10 flex h-[60%] flex-col items-center justify-center px-6 pt-header text-center md:h-[55%]">
        <p className={fade} style={delay(0)}>
          <MonoLabel tone="text" className="text-text/70">
            Recruitment {year}
          </MonoLabel>
        </p>
        <h1
          id="join-title"
          className={`mt-5 text-[length:clamp(2rem,9vw,2.6rem)] leading-[1.05] font-bold tracking-[0.03em] text-balance text-text uppercase md:mt-6 md:text-[length:clamp(2.6rem,6.5vw,5.5rem)] ${fade}`}
          style={delay(1)}
        >
          Join our community
        </h1>
        <p className={`mt-5 max-w-[480px] text-[15px] leading-relaxed text-muted md:mt-6 md:text-[17px] ${fade}`} style={delay(2)}>
          Build drones, robots and connected things with people who love it as much as you do.
        </p>
        <div className={`mt-8 flex w-full justify-center md:mt-10 ${fade}`} style={delay(3)}>
          {recruitmentOpen ? (
            <IrisButton href="/join/apply" size="lg">
              Apply now
              <span aria-hidden="true" className="transition-transform duration-[350ms] ease-power3 group-hover/iris:translate-x-[3px] group-focus-visible/iris:translate-x-[3px]">
                →
              </span>
            </IrisButton>
          ) : (
            <NotifyForm className="w-full max-w-md" />
          )}
        </div>
      </div>

      {/* The crowd: the bottom 45% (40% on phones), edge to edge, cut off at the bottom. */}
      <div data-crowd-scroll aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] md:h-[45%]">
        <div className="relative size-full animate-crowd-in motion-reduce:animate-none" style={{ animationDelay: `${JOIN_HERO.crowdDelay}ms` }}>
          {crowd}
          {/* The bottom 15% fades into the page. */}
          <div className="absolute inset-x-0 bottom-0 h-[15%] bg-linear-to-t from-bg to-transparent" />
        </div>
      </div>
    </section>
  );
}

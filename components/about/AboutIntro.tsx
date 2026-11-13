"use client";

import { useRef, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ABOUT_INTRO } from "@/lib/about";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { RobotHand, type RobotHandHandle } from "./RobotHand";

/**
 * /about section 1 (DESIGN.md §15): the heading in three pills and two paragraphs on the left, and a card on the right
 * where a robot hand slides in, spreads its fingers, points, grips and leaves as you scroll.
 *
 * One ScrollTrigger drives the hand through `RobotHand.setPose(progress)`:
 * - md+ with motion: the section is pinned for 2.5 screens (scrub 1); the left column stays still.
 * - Phones with motion: no pin. The same sequence plays as the card crosses the screen: entering just before the card is
 *   fully on screen, gripping by the time it reaches the header, gone as it leaves.
 * - Reduced motion: nothing is built. The hand shows its open, reaching pose (the server HTML's).
 *
 * The left column's entrance is CSS keyframes from the server HTML (DESIGN.md §7): each line rises 30px and fades in,
 * 100ms apart, while its pill grows from the left; then the paragraphs fade up.
 */

/** Widest heading line, in em at the heading's font size: the dot, the pill's padding and "The things we" (8.35em in Archivo 600), with a little spare. */
const HEADING_EM = 8.6;

/** One pill (line 1), one serif line (line 3); the rest is plain type. */
const LINES: { text: string; pill?: boolean; serif?: boolean }[] = [
  { text: "The things we", pill: true },
  { text: "always imagined" },
  { text: "students could build", serif: true },
];

export function AboutIntro() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const hand = useRef<RobotHandHandle>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const section = root.current;
      if (!section || !stage.current || !card.current) return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          // matchMedia only calls back while at least one condition matches, so phones need their own.
          phone: "(max-width: 767.98px)",
          desktop: "(min-width: 768px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };
          if (reduce) return;

          const proxy = { p: 0 };
          hand.current?.setPose(0);
          const onUpdate = () => hand.current?.setPose(proxy.p);

          if (desktop) {
            gsap.to(proxy, {
              p: 1,
              ease: "none",
              onUpdate,
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: () => `+=${window.innerHeight * ABOUT_INTRO.pin}`,
                pin: stage.current,
                scrub: ABOUT_INTRO.scrub,
                invalidateOnRefresh: true,
              },
            });
          } else {
            // Phones: 15% of the sequence (the entrance) happens before the card is fully on screen, the open, point and
            // grip (15–85%) while it is, and the rest as it scrolls up under the header.
            const el = card.current!;
            const span = () => {
              const top = el.getBoundingClientRect().top + window.scrollY;
              const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0;
              const fullIn = top - (window.innerHeight - el.offsetHeight); // the card's bottom reaches the screen's bottom
              const atTop = top - nav; // its top reaches the header
              const per = Math.max(1, atTop - fullIn) / 0.7;
              return { start: Math.max(0, fullIn - 0.15 * per), end: atTop + 0.15 * per };
            };
            gsap.to(proxy, {
              p: 1,
              ease: "none",
              onUpdate,
              scrollTrigger: {
                trigger: el,
                start: () => span().start,
                end: () => span().end,
                scrub: ABOUT_INTRO.scrub,
                invalidateOnRefresh: true,
              },
            });
          }

          return () => hand.current?.reset();
        },
      );
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} data-about-intro aria-labelledby="about-title" className="relative">
      <div ref={stage} className="relative bg-bg pt-header md:flex md:h-svh md:items-center">
        <div className="shell grid gap-10 py-10 md:grid-cols-[minmax(0,42fr)_minmax(0,52fr)] md:items-center md:gap-x-[6%] md:py-0">
          {/* Left: the heading and the copy. A size container, so the heading never outgrows the column. */}
          <div className="@container">
            <h1
              id="about-title"
              style={{ "--h-em": HEADING_EM } as CSSProperties}
              className="flex flex-col items-start gap-[0.12em] text-[length:min(clamp(2rem,4vw,3.4rem),calc(100cqw/var(--h-em)))] leading-[1.18] font-semibold tracking-[-0.02em]"
            >
              {LINES.map((line, i) => (
                <span
                  key={line.text}
                  className="flex items-center gap-[0.12em] animate-line-up motion-reduce:animate-none"
                  style={{ animationDelay: `${120 + i * 100}ms` }}
                >
                  {line.pill && (
                    <span
                      aria-hidden="true"
                      className="size-[1.3em] shrink-0 animate-dot-in rounded-full bg-red motion-reduce:animate-none"
                      style={{ animationDelay: `${120 + i * 100}ms` }}
                    />
                  )}
                  {line.pill ? (
                    <span className="relative inline-block px-[0.42em] py-[0.06em] whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 origin-left animate-pill-grow rounded-pill bg-red motion-reduce:animate-none"
                        style={{ animationDelay: `${220 + i * 100}ms` }}
                      />
                      <span className="relative">{line.text}</span>
                    </span>
                  ) : (
                    <span className={cn("whitespace-nowrap", line.serif && "serif-accent leading-[1.1]")}>{line.text}</span>
                  )}
                </span>
              ))}
            </h1>

            <div className="mt-10 max-w-[440px] space-y-4 text-[15px] leading-relaxed text-muted md:mt-12">
              <p className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: "560ms" }}>
                <strong className="font-medium text-text">We build</strong> the intricate, hands-on projects that
                classrooms only describe. Drones that hold their position in the wind, robots that sort, sense and
                respond, and connected devices that run for months on a coin cell.
              </p>
              <p className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: "660ms" }}>
                <strong className="font-medium text-text">Our aim is simple:</strong> give every member the chance to
                turn an idea into a working machine, and the confidence to keep building after college.
              </p>
            </div>
          </div>

          {/* Right: the card the hand lives in. */}
          <div
            ref={card}
            className="relative h-[60svh] overflow-hidden rounded-card border border-line bg-bg-2 md:h-[min(72vh,calc(100svh-var(--nav-h)-var(--ann-h)-4rem))]"
          >
            <RobotHand ref={hand} className="absolute inset-0" />
            {/* Without JS the hand stays in its still pose. */}
            <noscript>
              <style>{"[data-robot-hand]{visibility:visible!important}"}</style>
            </noscript>
          </div>
        </div>
      </div>
    </section>
  );
}

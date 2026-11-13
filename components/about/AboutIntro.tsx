"use client";

import { useRef, type CSSProperties } from "react";
import { MonoLabel } from "@/components/ui";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ABOUT_INTRO } from "@/lib/about";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * /about section 1 (DESIGN.md §15): "About us", the heading and two paragraphs on the left; the right half is left
 * open for the industrial arm behind the page (§22), which reaches in, opens, grips and lifts as you scroll.
 *
 * md+ with motion: the section is pinned for ABOUT_INTRO.pin screens, so the arm can play its intro keys (lib/arm.ts →
 * ARM_SCENES.intro, spread across the pin) while the text stays still. Phones and reduced motion: no pin.
 *
 * The left column's entrance is CSS keyframes from the server HTML (DESIGN.md §7): the label fades up, each heading
 * line rises 30px and fades in, 100ms apart, while its pill grows from the left; then the paragraphs fade up.
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
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (!root.current || !stage.current) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * ABOUT_INTRO.pin}`,
            pin: stage.current,
            invalidateOnRefresh: true,
          },
        });
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} data-about-intro data-arm-scene="intro" aria-labelledby="about-title" className="relative">
      <div ref={stage} className="relative pt-header md:flex md:h-svh md:items-center">
        <div className="shell grid gap-10 py-10 md:grid-cols-[minmax(0,42fr)_minmax(0,52fr)] md:items-center md:gap-x-[6%] md:py-0">
          {/* Left: the label, the heading and the copy. A size container, so the heading never outgrows the column. */}
          <div className="@container">
            <MonoLabel
              as="h1"
              id="about-title"
              tone="text"
              className="animate-fade-up [animation-delay:60ms] motion-reduce:animate-none"
            >
              About us
            </MonoLabel>
            <h2
              style={{ "--h-em": HEADING_EM } as CSSProperties}
              className="mt-6 flex flex-col items-start gap-[0.12em] text-[length:min(clamp(2rem,4vw,3.4rem),calc(100cqw/var(--h-em)))] leading-[1.18] font-semibold tracking-[-0.02em] md:mt-8"
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
            </h2>

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
          {/* Right: open, for the arm behind the page. */}
        </div>
      </div>
    </section>
  );
}

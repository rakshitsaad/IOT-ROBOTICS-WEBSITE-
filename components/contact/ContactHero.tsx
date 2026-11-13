"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useRef, type CSSProperties } from "react";
import { IrisButton, MonoLabel, PillButton } from "@/components/ui";
import { FINE_POINTER } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";
import { CONTACT_MOTION } from "@/lib/contact";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUIStore } from "@/lib/store";
import type { Partner } from "@/lib/types";
import { ContactIcon } from "./icons";
import { scrollToMessage } from "./scroll";

/**
 * The /contact hero (DESIGN.md §20): a centred headline over a planet's glowing horizon.
 *
 * - The planet is CSS: a huge circle (180vw; phones 260vw) whose top edge sits 68% of the way down a full-height hero
 *   (`contact-planet`, `contact-rim`, `contact-streak` in globals.css), a wide glow above the rim and a blurred bright
 *   spot at its apex.
 * - Load (CSS keyframes, from the server HTML): the planet rises 25vh into place over 1.6s (expo) while the rim's glow
 *   fades in; the badge, the headline's words (rising out of masks, 60ms apart), the line and the buttons follow from
 *   300ms. Then the rim breathes (5s) and a light runs along it every 8s.
 * - Cursor (fine pointers, md+): the bright spot leans towards the cursor's x, up to 10vw.
 * - Scroll: the planet moves at 0.6× the page (parallax) and the text fades out by half the hero.
 * - Reduced motion: all of it off; everything in its final place.
 */

export interface HeroBadge {
  label: string;
  href: string;
}

const HEADLINE = "Let's build something together";

/** Tiny stars: fixed positions (the same on the server and the client), 1px, 20–40% opacity, twinkling slowly. */
const STARS = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 46 }, () => ({
    x: rnd() * 100,
    y: rnd() * 64,
    o: 0.2 + rnd() * 0.2,
    big: rnd() > 0.85,
    duration: 3.5 + rnd() * 4,
    delay: -rnd() * 8,
  }));
})();

export function ContactHero({ email, badge, partners }: { email: string; badge: HeroBadge | null; partners: Partner[] }) {
  const root = useRef<HTMLElement>(null);
  const lenis = useUIStore((s) => s.lenis);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const planet = el.querySelector("[data-planet-parallax]");
        const content = el.querySelector("[data-hero-content]");
        // Parallax: as the page scrolls s, the planet moves up 0.6s (so it drifts down 0.4s within the hero).
        gsap.fromTo(
          planet,
          { y: 0 },
          {
            y: () => el.offsetHeight * (1 - CONTACT_MOTION.parallax),
            ease: "none",
            scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
          },
        );
        gsap.fromTo(
          content,
          { opacity: 1 },
          {
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top top", end: () => `+=${el.offsetHeight * CONTACT_MOTION.fadeBy}`, scrub: true, invalidateOnRefresh: true },
          },
        );
      });
      // The glow's brightest spot follows the cursor's x (up to 10vw at the screen's edges).
      mm.add(`(prefers-reduced-motion: no-preference) and (min-width: 768px) and ${FINE_POINTER}`, () => {
        const spots = el.querySelectorAll("[data-glow-follow]");
        const to = [...spots].map((s) => gsap.quickTo(s, "x", { duration: 1.4, ease: "power3.out" }));
        const onMove = (e: PointerEvent) => {
          const x = ((e.clientX / window.innerWidth) * 2 - 1) * window.innerWidth * (CONTACT_MOTION.glowFollow / 100);
          to.forEach((t, i) => t(x * (i === 0 ? 1 : 0.55)));
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const words = HEADLINE.split(" ");
  const t0 = CONTACT_MOTION.textDelay * 1000;
  const wordsEnd = t0 + 100 + words.length * CONTACT_MOTION.wordStagger * 1000;
  const fade = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <section
      ref={root}
      aria-labelledby="contact-title"
      className="relative flex min-h-svh flex-col overflow-x-clip bg-bg pt-header"
    >
      {/* Texture and stars. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="contact-dots absolute inset-0" />
        {STARS.map((s, i) => (
          <span
            key={i}
            className={cn(
              "absolute rounded-full bg-text animate-twinkle motion-reduce:animate-none",
              s.big ? "size-[1.5px]" : "size-px",
            )}
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                opacity: s.o,
                "--o": s.o,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div data-hero-content className="relative z-10 flex flex-1 flex-col items-center px-4">
        <div className="flex w-full max-w-[760px] flex-1 flex-col items-center justify-center py-8 text-center md:py-5">
          {badge && (
            <Link
              href={badge.href}
              data-cursor="link"
              className="group/badge inline-flex animate-fade-up items-center gap-3 rounded-pill bg-bg-2 py-1.5 pr-1.5 pl-4 text-[13px] leading-none text-text/85 ring-1 ring-line transition-colors duration-[350ms] hover:text-text hover:ring-text/25 motion-reduce:animate-none"
              style={fade(t0)}
            >
              {badge.label}
              <span className="grid size-6 place-items-center rounded-full bg-red text-text transition-transform duration-[350ms] ease-power3 group-hover/badge:translate-x-0.5">
                <ContactIcon name="arrow" className="size-3.5 rotate-45" />
              </span>
            </Link>
          )}

          <h1
            id="contact-title"
            className="mt-6 text-[length:clamp(2rem,9vw,2.6rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance md:text-[length:clamp(2.4rem,min(5.5vw,8.5svh),4.5rem)]"
          >
            <span className="sr-only">{HEADLINE}</span>
            <span aria-hidden="true">
              {words.map((w, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span className="-my-[0.08em] inline-block overflow-hidden py-[0.08em] align-top">
                    <span
                      // The last word is the serif accent (set here, not with serif-accent: its line-height 0 would be clipped by the mask).
                      className={`inline-block animate-rise motion-reduce:animate-none ${i === words.length - 1 ? "font-serif text-[1.08em] font-normal tracking-[-0.015em] italic" : ""}`}
                      style={fade(t0 + 100 + i * CONTACT_MOTION.wordStagger * 1000)}
                    >
                      {w}
                    </span>
                  </span>
                </Fragment>
              ))}
            </span>
          </h1>

          <p
            className="mt-4 max-w-[34rem] animate-fade-up text-[15px] leading-relaxed text-muted motion-reduce:animate-none md:mt-5 md:text-[17px]"
            style={fade(wordsEnd + 60)}
          >
            Questions, collaborations, sponsorships or just a hello. We usually reply within 48 hours.
          </p>

          <div
            className="mt-7 flex w-full animate-fade-up flex-col items-center gap-3 motion-reduce:animate-none sm:w-auto sm:flex-row"
            style={fade(wordsEnd + 160)}
          >
            <PillButton href={`mailto:${email}`} variant="ghost" size="lg" className="w-full bg-bg/40 backdrop-blur-sm sm:w-auto">
              <ContactIcon name="mail" />
              Email us
            </PillButton>
            <IrisButton size="lg" className="w-full sm:w-auto" onClick={() => scrollToMessage(lenis)}>
              Send a message
            </IrisButton>
          </div>
        </div>

        {partners.length > 0 && (
          <div
            className="flex w-full max-w-[960px] animate-fade-up flex-col items-center pb-5 motion-reduce:animate-none md:pb-6"
            style={fade(wordsEnd + 360)}
          >
            <MonoLabel as="p" className="text-text/55">
              Trusted by our partners
            </MonoLabel>
            <ul className="mt-3.5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3.5 md:gap-x-12">
              {partners.map((p) => {
                const logo = (
                  <Image
                    src={p.logo_url}
                    alt={p.name}
                    width={160}
                    height={32}
                    unoptimized
                    className="h-5 w-auto opacity-50 grayscale transition-opacity duration-[350ms] hover:opacity-80 md:h-6"
                  />
                );
                return (
                  <li key={p.id}>
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" data-cursor="link">
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* The planet. Its rim is the top edge of this band (the bottom 32% of a full-height hero). */}
      <div aria-hidden="true" className="pointer-events-none relative h-[32svh] shrink-0">
        <div data-planet-parallax className="absolute inset-x-0 top-0">
          <div className="animate-planet-rise motion-reduce:animate-none">
            {/* Glow above the rim: a wide soft one and, at the apex, a blurred bright spot that follows the cursor. */}
            <div className="animate-rim motion-reduce:animate-none">
              {/* Centred on the rim, so past the planet's sides it fades below the rim too (no edge at the rim's height). */}
              <div className="absolute -top-[46svh] left-1/2 h-[92svh] w-[200vw] -translate-x-1/2 bg-radial-[50%_50%_at_50%_50%] from-red/35 via-red/10 via-45% to-transparent to-75% md:w-[140vw]" />
              <div data-glow-follow className="absolute bottom-0 left-1/2 h-0 w-0">
                <div className="absolute -bottom-[7svh] left-1/2 h-[14svh] w-[70vw] -translate-x-1/2 rounded-[50%] bg-red/55 blur-[44px] md:w-[46vw]" />
              </div>
              <div data-glow-follow className="absolute bottom-0 left-1/2 h-0 w-0">
                <div className="absolute -bottom-[4px] left-1/2 h-[8px] w-[22vw] -translate-x-1/2 bg-radial from-text/70 to-transparent to-70% blur-[3px] md:w-[12vw]" />
              </div>
            </div>
            {/* Surface, rim and streak, clipped to a band under the rim that fades out downwards. */}
            <div className="absolute inset-x-0 -top-40 h-[calc(64svh+10rem)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
              <div className="contact-planet absolute top-40 left-1/2 aspect-square w-[260vw] -translate-x-1/2 md:w-[180vw]" />
              <div className="contact-rim absolute top-40 left-1/2 aspect-square w-[260vw] -translate-x-1/2 animate-rim motion-reduce:animate-none md:w-[180vw]" />
              <div className="contact-streak absolute top-40 left-1/2 aspect-square w-[260vw] -translate-x-1/2 animate-streak motion-reduce:animate-none md:w-[180vw]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

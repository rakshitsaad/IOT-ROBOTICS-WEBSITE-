"use client";

import { useRef } from "react";
import { MonoLabel } from "@/components/ui";
import { CONTACT_MOTION, mapEmbedUrl, mapOpenUrl } from "@/lib/contact";
import { gsap, useGSAP } from "@/lib/gsap";
import { ContactDetails, type ContactDetailsProps } from "./ContactDetails";
import { ContactForm } from "./ContactForm";
import { ContactIcon } from "./icons";

/**
 * The contact panel (DESIGN.md §20): a large frosted window rising out of the hero's horizon, laid out like an app:
 * the sidebar (club, ways to reach us), the form, and the map. Phones stack them in that order.
 *
 * Motion (scrubbed from the top of the page until the panel's top reaches 25% of the screen): md+ stands it up, rising
 * 80px and tilting from rotateX(18deg) to flat (perspective 1400px, hinged at its bottom edge); phones only rise.
 * Nothing under reduced motion.
 */
export function ContactPanel(props: ContactDetailsProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const panel = el?.querySelector("[data-panel]");
      if (!el || !panel) return;
      const mm = gsap.matchMedia();
      const scrub = { trigger: panel, start: 0, end: "top 25%", scrub: true, invalidateOnRefresh: true };
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        gsap.fromTo(
          panel,
          { y: CONTACT_MOTION.panelRise, rotateX: CONTACT_MOTION.panelTilt },
          { y: 0, rotateX: 0, ease: "none", scrollTrigger: scrub },
        );
      });
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 767.98px)", () => {
        gsap.fromTo(panel, { y: CONTACT_MOTION.panelRise }, { y: 0, ease: "none", scrollTrigger: scrub });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label="Contact details and form" className="relative z-10 -mt-[18svh] px-4 md:-mt-[16svh] md:px-gutter">
      <div className="mx-auto max-w-[1120px] [perspective:1400px]">
        <div
          data-panel
          className="relative origin-bottom rounded-[24px] bg-bg-2/85 shadow-[0_40px_120px_-40px_black] ring-1 ring-line backdrop-blur-xl will-change-transform"
        >
          {/* An accent glow along the top edge. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] -top-px h-px bg-linear-to-r from-transparent via-red to-transparent" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-[22%] -top-6 h-12 rounded-[50%] bg-red/20 blur-2xl" />

          <div className="grid md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_300px]">
            <aside className="border-b border-line p-5 md:border-r md:border-b-0 lg:p-6">
              <ContactDetails {...props} />
            </aside>

            <div className="p-5 sm:p-7 md:p-8 lg:p-9">
              <MonoLabel as="p" index={1}>
                New message
              </MonoLabel>
              <h2 id="message" className="mt-3 scroll-mt-28 text-[length:clamp(1.6rem,3vw,2.2rem)] leading-tight font-semibold tracking-[-0.03em]">
                Send us a message
              </h2>
              <p className="mt-2 max-w-[44ch] text-[14px] text-muted">
                Tell us who you are and what you have in mind. Someone from the core team will reply.
              </p>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>

            <div className="border-t border-line p-5 md:col-span-2 md:p-6 lg:col-span-1 lg:border-t-0 lg:border-l">
              <MonoLabel as="p">Find the lab</MonoLabel>
              <div className="relative mt-4 h-[220px] overflow-hidden rounded-image bg-bg ring-1 ring-line md:h-[260px] lg:h-[340px]">
                <iframe
                  title={`Map: ${props.mapQuery}`}
                  src={mapEmbedUrl(props.mapQuery)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 size-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.7)]"
                />
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-text/80">{props.address}</p>
              <a
                href={mapOpenUrl(props.mapQuery)}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-text underline decoration-text/30 underline-offset-4 transition-colors duration-[350ms] hover:decoration-text"
              >
                Open in Maps
                <ContactIcon name="arrow" className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

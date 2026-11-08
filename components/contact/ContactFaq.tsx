"use client";

import { Accordion, MonoLabel } from "@/components/ui";
import { CONTACT_FAQ } from "@/lib/contact";
import { useUIStore } from "@/lib/store";
import { scrollToMessage } from "./scroll";

/** The /contact FAQ (DESIGN.md §20): the heading, a link to the form, and the questions in an `<Accordion>` (§5). */
export function ContactFaq() {
  const lenis = useUIStore((s) => s.lenis);

  return (
    <section aria-labelledby="faq-title" className="shell grid gap-10 pt-[clamp(5rem,14svh,9rem)] md:grid-cols-12 md:gap-8">
      <div className="md:col-span-4">
        <MonoLabel as="p" index={2}>
          FAQ
        </MonoLabel>
        <h2 id="faq-title" className="mt-4 text-[length:clamp(2.2rem,5vw,4.5rem)] leading-[1.04] font-bold tracking-[-0.04em]">
          Good questions
        </h2>
        <p className="mt-5 max-w-[30ch] text-[15px] leading-relaxed text-muted">
          Didn&apos;t find yours?{" "}
          <button
            type="button"
            data-cursor="link"
            onClick={() => scrollToMessage(lenis)}
            className="font-semibold text-text underline decoration-text/30 underline-offset-4 transition-colors duration-[350ms] hover:decoration-text"
          >
            Send us a message
          </button>
          .
        </p>
      </div>
      <Accordion items={CONTACT_FAQ} className="md:col-span-8" />
    </section>
  );
}


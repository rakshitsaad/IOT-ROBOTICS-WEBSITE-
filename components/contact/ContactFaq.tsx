"use client";

import { useId, useState } from "react";
import { MonoLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CONTACT_FAQ } from "@/lib/contact";
import { useUIStore } from "@/lib/store";
import { ContactIcon } from "./icons";
import { scrollToMessage } from "./scroll";

/**
 * The /contact FAQ (DESIGN.md §20): an accordion. Each answer opens with a smooth height animation (its row of a grid
 * going from 0fr to 1fr, 500ms power3) while it fades in; any number can be open; the first starts open. A closed
 * answer is `inert`. Instant under reduced motion (the global CSS cuts transitions).
 */
export function ContactFaq() {
  const lenis = useUIStore((s) => s.lenis);
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

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
      <ul className="border-t border-line md:col-span-8">
        {CONTACT_FAQ.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} open={open.has(i)} onToggle={() => toggle(i)} />
        ))}
      </ul>
    </section>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle(): void }) {
  const id = useId();
  return (
    <li className="border-b border-line">
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          data-cursor="link"
          className="group/faq flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
        >
          <span className="text-[17px] leading-snug font-semibold tracking-[-0.01em] transition-colors duration-[350ms] md:text-xl">{q}</span>
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full ring-1 transition-[background-color,color,box-shadow] duration-[350ms]",
              open ? "bg-red text-text ring-red" : "text-text/80 ring-line group-hover/faq:ring-text/30",
            )}
          >
            <ContactIcon name="plus" className={cn("transition-transform duration-500 ease-power3", open && "rotate-45")} />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-power3",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-[62ch] pr-12 pb-6 text-[15px] leading-relaxed text-muted md:pb-7">{a}</p>
        </div>
      </div>
    </li>
  );
}

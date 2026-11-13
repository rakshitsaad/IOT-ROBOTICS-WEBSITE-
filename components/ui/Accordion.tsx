"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Questions on hairlines that open one by one (DESIGN.md §5). A question is a button (`aria-expanded`); its answer
 * opens by its grid row going from 0fr to 1fr while it fades in (500ms power3), and the round + turns into a red ×.
 * Any number can be open; `defaultOpen` lists the ones open at first. Closed answers are `inert`. Instant under reduced
 * motion (the global CSS cuts transitions).
 *
 *   <Accordion items={[{ q: "Who can apply?", a: "Any student." }]} />
 */
export interface AccordionItem {
  q: string;
  a: ReactNode;
}

export function Accordion({
  items,
  defaultOpen = [0],
  className,
}: {
  items: AccordionItem[];
  defaultOpen?: number[];
  className?: string;
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(defaultOpen));
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <ul className={cn("border-t border-line", className)}>
      {items.map((item, i) => (
        <AccordionRow key={item.q} item={item} open={open.has(i)} onToggle={() => toggle(i)} />
      ))}
    </ul>
  );
}

function AccordionRow({ item, open, onToggle }: { item: AccordionItem; open: boolean; onToggle(): void }) {
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
          className="group/acc flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
        >
          <span className="text-[17px] leading-snug font-display font-semibold tracking-[-0.01em] md:text-xl">{item.q}</span>
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full ring-1 transition-[background-color,color,box-shadow] duration-[350ms]",
              open ? "bg-red text-text ring-red" : "text-text/80 ring-line group-hover/acc:ring-text/30",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className={cn("size-4 transition-transform duration-500 ease-power3", open && "rotate-45")}
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
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
          <div className="max-w-[62ch] pr-12 pb-6 text-[15px] leading-relaxed text-muted md:pb-7">{item.a}</div>
        </div>
      </div>
    </li>
  );
}

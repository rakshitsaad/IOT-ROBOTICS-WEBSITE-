"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BEZIER } from "@/lib/motion";

/**
 * Form parts shared by /contact and /join/apply (DESIGN.md §20, §21): a labelled field with its error, the dark input
 * style, and the animated check of a sent form.
 */

export interface FieldA11y {
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  id: string;
}

export function Field({
  label,
  id: fixedId,
  error,
  aside,
  className,
  children,
}: {
  label: string;
  /** A fixed id (the first field: "Send a message" focuses it). */
  id?: string;
  error?: string;
  aside?: ReactNode;
  className?: string;
  children: (p: FieldA11y) => ReactNode;
}) {
  const autoId = useId();
  const id = fixedId ?? autoId;
  const errId = `${id}-error`;
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-semibold text-text/85">
          {label}
        </label>
        {aside}
      </div>
      {children({ id, "aria-invalid": Boolean(error), ...(error ? { "aria-describedby": errId } : {}) })}
      {error && (
        <p id={errId} className="mt-2 flex items-center gap-2 text-[13px] text-text/85">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-red" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Dark fields with a hairline; focus lights the border in the accent with a soft glow; an error keeps it red. */
export const inputClass = (p: FieldA11y) =>
  cn(
    "block h-12 w-full rounded-[14px] bg-bg/70 px-4 text-[15px] text-text ring-1 ring-line outline-none placeholder:text-muted",
    "transition-[box-shadow] duration-[350ms] ease-power3",
    "hover:ring-text/20 focus:ring-red/80 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--red)_16%,transparent),0_0_26px_-6px_var(--red)]",
    p["aria-invalid"] && "ring-red/70",
  );

/** A circle that draws itself, then the tick. */
export function SentCheck({ play, reduced }: { play: boolean; reduced: boolean }) {
  const draw = (delay: number) =>
    reduced
      ? { initial: false as const, animate: { pathLength: play ? 1 : 0 } }
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: play ? 1 : 0 },
          transition: { duration: play ? 0.7 : 0, delay: play ? delay : 0, ease: BEZIER.out },
        };
  return (
    <span className="relative grid size-20 place-items-center rounded-full bg-red/10 text-red">
      <span aria-hidden="true" className="absolute inset-0 rounded-full shadow-[0_0_44px_-8px_var(--red)]" />
      <svg aria-hidden="true" viewBox="0 0 64 64" className="size-20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <motion.circle cx="32" cy="32" r="29" strokeWidth="2" {...draw(0.35)} />
        <motion.path d="M20 33l8 8 16-17" strokeWidth="3" className="text-text" stroke="var(--text)" {...draw(0.85)} />
      </svg>
    </span>
  );
}

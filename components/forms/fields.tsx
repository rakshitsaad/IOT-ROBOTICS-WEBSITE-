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
        <label htmlFor={id} className="text-[13px] font-medium text-text/90">
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

/** Dark fields with a hairline; focus brightens the hairline to warm white; an error turns it red. */
export const inputClass = (p: FieldA11y) =>
  cn(
    "block h-12 w-full rounded-control bg-bg px-4 text-[15px] text-text ring-1 ring-line outline-none placeholder:text-faint",
    "transition-[box-shadow] duration-300 ease-power3",
    "hover:ring-text/25 focus:ring-text/70",
    p["aria-invalid"] && "ring-red/80 focus:ring-red",
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
    <span className="relative grid size-20 place-items-center rounded-full text-red">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="size-20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <motion.circle cx="32" cy="32" r="29" strokeWidth="2" {...draw(0.35)} />
        <motion.path d="M20 33l8 8 16-17" strokeWidth="3" className="text-text" stroke="var(--text)" {...draw(0.85)} />
      </svg>
    </span>
  );
}

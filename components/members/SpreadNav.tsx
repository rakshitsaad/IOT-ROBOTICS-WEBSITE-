"use client";

import { cn } from "@/lib/cn";
import { useSeniorCoreNav } from "./SeniorCoreTrack";

/**
 * Small prev/next arrows on every spread. They ask SeniorCoreTrack to move
 * (horizontal track or stacked scroll), and it moves focus to the same arrow
 * on the spread it lands on, so keyboard users keep their place.
 */
export function SpreadNav({ index, count, prev, next }: { index: number; count: number; prev: string; next: string }) {
  const { go } = useSeniorCoreNav();
  return (
    <div className="flex items-center gap-2">
      <Arrow dir="prev" label={`Previous: ${prev}`} disabled={index <= 0} onClick={() => go(index - 1, "prev")} />
      <Arrow dir="next" label={`Next: ${next}`} disabled={index >= count - 1} onClick={() => go(index + 1, "next")} />
    </div>
  );
}

function Arrow({
  dir,
  label,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      {...{ [`data-sc-${dir}`]: "" }}
      data-cursor="link"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-9 w-12 place-items-center rounded-pill border border-line text-text",
        "transition-[border-color,background-color,opacity] duration-[350ms] ease-power3",
        "hover:border-text/40 hover:bg-text/5 disabled:opacity-30 disabled:hover:border-line disabled:hover:bg-transparent",
      )}
    >
      <svg
        aria-hidden="true"
        width="22"
        height="10"
        viewBox="0 0 22 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        className={dir === "prev" ? "rotate-180" : undefined}
      >
        <path d="M0 5h21M16.5 0.5L21 5l-4.5 4.5" />
      </svg>
    </button>
  );
}

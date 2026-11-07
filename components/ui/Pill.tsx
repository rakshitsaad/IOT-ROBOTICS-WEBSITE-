import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Fill } from "@/lib/tokens";

/**
 * Rounded highlight behind a word or phrase inside running text/headlines.
 * Inherits font size from its parent. Text colour is picked for contrast:
 * warm white on red, maroon, iris and the dark fills (dark, raised); dark
 * text only on the warm white fill. See lib/tokens.ts → textOn().
 *
 *   <h2>We build robots that <Pill color="red">think</Pill>.</h2>
 *
 * `reveal`: a non-wrapping variant built from layers (background, word, and a
 * light copy of the word) so it can play a highlighter reveal with
 * pillReveal() from "@/components/ui/pill-reveal". It renders in its final
 * state, so it looks right without JS and under reduced motion.
 */
export type PillColor = Fill;

const BG: Record<PillColor, string> = {
  red: "bg-red",
  maroon: "bg-maroon",
  white: "bg-text",
  iris: "bg-iris",
  dark: "bg-bg ring-1 ring-inset ring-line",
  raised: "bg-bg-2 ring-1 ring-inset ring-line",
};

const TEXT: Record<PillColor, string> = {
  red: "text-text",
  maroon: "text-text",
  white: "text-bg",
  iris: "text-text",
  dark: "text-text",
  raised: "text-text",
};

interface PillProps {
  color?: PillColor;
  children: ReactNode;
  className?: string;
  /** Layered, non-wrapping variant for pillReveal(). */
  reveal?: boolean;
}

export function Pill({ color = "white", children, className, reveal = false }: PillProps) {
  if (reveal) {
    // The padding grows the pill past the line box; the negative margin keeps line spacing unchanged.
    const pad = "px-[0.38em] py-[0.05em]";
    return (
      <span data-pill className={cn("relative -my-[0.05em] inline-block whitespace-nowrap", className)}>
        <span data-pill-bg aria-hidden="true" className={cn("absolute inset-0 origin-left rounded-pill", BG[color])} />
        <span data-pill-word className={cn("relative block", pad, TEXT[color])}>
          {children}
        </span>
        <span
          data-pill-ghost
          aria-hidden="true"
          className={cn("absolute inset-0 block text-text [clip-path:inset(0%_0%_0%_100%)]", pad)}
        >
          {children}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline rounded-pill px-[0.38em] py-[0.02em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
        BG[color],
        TEXT[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

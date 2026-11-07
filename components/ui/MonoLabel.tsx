import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Accent } from "@/lib/types";

/**
 * Small uppercase technical label: JetBrains Mono, 11px (12px ≥ md),
 * letter-spacing 0.14em. Optional index renders as "[01]".
 *
 *   <MonoLabel index={1}>About the club</MonoLabel>
 */
type Tone = "muted" | "text" | Accent;

const TONE: Record<Tone, string> = {
  muted: "text-muted",
  text: "text-text",
  blue: "text-blue",
  violet: "text-violet",
  coral: "text-coral",
  orange: "text-orange",
  amber: "text-amber",
};

interface MonoLabelProps {
  children: ReactNode;
  /** Number (zero-padded to 2) or preformatted string. */
  index?: number | string;
  tone?: Tone;
  as?: ElementType;
  id?: string;
  className?: string;
}

export function formatIndex(index: number | string): string {
  return typeof index === "number" ? String(index).padStart(2, "0") : index;
}

export function MonoLabel({
  children,
  index,
  tone = "muted",
  as: Tag = "span",
  id,
  className,
}: MonoLabelProps) {
  return (
    <Tag id={id} className={cn("mono-label inline-flex items-baseline gap-[0.9em]", TONE[tone], className)}>
      {index !== undefined && (
        <span className="text-text/70" aria-hidden="true">
          [{formatIndex(index)}]
        </span>
      )}
      <span>{children}</span>
    </Tag>
  );
}

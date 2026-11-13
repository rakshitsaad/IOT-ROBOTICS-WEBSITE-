import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Accent } from "@/lib/types";

/**
 * Small uppercase technical label: IBM Plex Mono, 11px (12px ≥ md),
 * letter-spacing 0.14em. An optional index renders before the label, without brackets ("404 Not found").
 * Section labels are names only: don't number them.
 *
 *   <MonoLabel>About the club</MonoLabel>
 */
type Tone = "muted" | "text" | Accent;

const TONE: Record<Tone, string> = {
  muted: "text-muted",
  text: "text-text",
  red: "text-red",
  white: "text-text",
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
          {formatIndex(index)}
        </span>
      )}
      <span>{children}</span>
    </Tag>
  );
}

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Small uppercase technical label: JetBrains Mono, 11px (12px ≥ md). An optional index renders as "01" followed by a
 * short hairline, so section labels read "01 —— About the club".
 *
 *   <MonoLabel index={1}>About the club</MonoLabel>
 */
type Tone = "faint" | "muted" | "text" | "red";

const TONE: Record<Tone, string> = {
  faint: "text-faint",
  muted: "text-muted",
  text: "text-text",
  red: "text-red",
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

export function MonoLabel({ children, index, tone = "faint", as: Tag = "span", id, className }: MonoLabelProps) {
  return (
    <Tag id={id} className={cn("mono-label inline-flex items-center gap-3", TONE[tone], className)}>
      {index !== undefined && (
        <>
          <span className="text-text" aria-hidden="true">
            {formatIndex(index)}
          </span>
          <span aria-hidden="true" className="h-px w-6 bg-line" />
        </>
      )}
      <span>{children}</span>
    </Tag>
  );
}

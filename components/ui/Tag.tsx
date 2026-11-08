import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A small label for metadata: a category, a technology, a status. Mono, 4px radius, hairline.
 * - default: hairline on transparent (technologies, categories).
 * - accent: red text and a red hairline (a win, "Registrations open", "Hiring"). Keep it to one per item.
 * - solid: a quiet charcoal fill (a status inside a busy row).
 */
type Tone = "default" | "accent" | "solid";

const TONE: Record<Tone, string> = {
  default: "border-line text-muted",
  accent: "border-red/60 text-text",
  solid: "border-transparent bg-bg-3 text-muted",
};

export function Tag({ tone = "default", dot = false, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-tag border px-2 font-mono text-[11px] leading-none tracking-[0.04em]",
        TONE[tone],
        className,
      )}
    >
      {(dot || tone === "accent") && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-pill bg-red" />}
      {children}
    </span>
  );
}

/** A row of tags. */
export function TagList({ items, className, tone }: { items: readonly string[]; className?: string; tone?: Tone }) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => (
        <li key={item}>
          <Tag tone={tone}>{item}</Tag>
        </li>
      ))}
    </ul>
  );
}

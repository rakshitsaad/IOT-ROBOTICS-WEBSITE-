import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MonoLabel } from "./MonoLabel";

/**
 * The top of every inner page: a mono label (the section of the site), the page's h1, a lead paragraph, and optional
 * actions or facts below. It clears the fixed header itself and ends on a hairline, so every page starts the same way.
 */
export function PageHeader({
  label,
  title,
  intro,
  children,
  aside,
  className,
}: {
  label: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  /** Actions or a meta row under the intro. */
  children?: ReactNode;
  /** A column on the right from lg (key facts, counts). */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pt-header", className)}>
      <div className="shell">
        <div className="grid gap-10 border-b border-line pt-[clamp(3rem,8vw,6.5rem)] pb-[clamp(2.5rem,5vw,4rem)] lg:grid-cols-12 lg:gap-8">
          <div className={cn(aside ? "lg:col-span-8" : "lg:col-span-10")}>
            <MonoLabel as="p" className="motion-safe:animate-fade-up">
              {label}
            </MonoLabel>
            <h1 className="type-h1 mt-6 max-w-[18ch] text-balance motion-safe:animate-fade-up [animation-delay:60ms]">{title}</h1>
            {intro && (
              <p className="type-lead mt-6 max-w-[56ch] text-muted motion-safe:animate-fade-up [animation-delay:120ms]">{intro}</p>
            )}
            {children && <div className="mt-8 motion-safe:animate-fade-up [animation-delay:180ms]">{children}</div>}
          </div>
          {aside && (
            <div className="lg:col-span-4 lg:self-end motion-safe:animate-fade-up [animation-delay:200ms]">{aside}</div>
          )}
        </div>
      </div>
    </header>
  );
}

/** A small definition list of key facts, for a PageHeader aside: "Members 41", "Teams 7". */
export function FactList({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line", className)}>
      {items.map((item) => (
        <div key={item.label} className="bg-bg px-5 py-4">
          <dt className="mono-label text-faint">{item.label}</dt>
          <dd className="mt-2 text-[22px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

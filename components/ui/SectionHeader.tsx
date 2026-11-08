import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowLink } from "./ArrowLink";
import { MonoLabel } from "./MonoLabel";

/**
 * The heading block every section starts with: an indexed mono label, an h2 and optionally a short intro and a link.
 * - layout "split" (default): heading on the left, intro and link on the right from lg (a 12-column grid).
 * - layout "stack": everything in one column (narrow sections, sidebars).
 */
export function SectionHeader({
  index,
  label,
  title,
  titleId,
  intro,
  action,
  layout = "split",
  className,
}: {
  index?: number;
  label: string;
  title: ReactNode;
  titleId?: string;
  intro?: ReactNode;
  action?: { label: string; href: string };
  layout?: "split" | "stack";
  className?: string;
}) {
  const split = layout === "split";
  return (
    <header data-reveal className={cn(split && "grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8", className)}>
      <div className={cn(split && "lg:col-span-7")}>
        <MonoLabel index={index}>{label}</MonoLabel>
        <h2 id={titleId} className="type-h2 mt-5 max-w-[22ch] text-balance">
          {title}
        </h2>
      </div>
      {(intro || action) && (
        <div className={cn(split ? "lg:col-span-5 lg:justify-self-end" : "mt-5")}>
          {intro && <p className="type-body max-w-[46ch] text-muted">{intro}</p>}
          {action && (
            <ArrowLink href={action.href} className={intro ? "mt-4" : undefined}>
              {action.label}
            </ArrowLink>
          )}
        </div>
      )}
    </header>
  );
}

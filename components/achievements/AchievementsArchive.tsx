"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Photo, Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ACH_FILTERS, CATEGORY_LABEL, achDate, achYear, isWin, linkLabel, matchesFilter, type AchFilter } from "@/lib/achievements";
import type { Achievement } from "@/lib/types";

/**
 * The /achievements record (DESIGN.md §19): category filters, then every achievement grouped by year, newest first.
 * Each entry shows its photo, the result, the event, place and date, what was achieved, the team and its proof link.
 * `?a=<slug>` (the share link, and the home page's rows) scrolls to that entry and marks it. The page wraps this in
 * <Suspense>; the fallback is the same list without the query.
 */
export function AchievementsArchiveWithParams({ items }: { items: Achievement[] }) {
  return <AchievementsArchive items={items} target={useSearchParams().get("a")} />;
}

export function AchievementsArchive({ items, target = null }: { items: Achievement[]; target?: string | null }) {
  const [filter, setFilter] = useState<AchFilter>("all");
  const shown = items.filter((a) => matchesFilter(a, filter) || a.slug === target);
  const years = [...new Set(shown.map((a) => achYear(a.date)))].sort((a, b) => b - a);

  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    const id = window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => window.clearTimeout(id);
  }, [target]);

  return (
    <div className="shell">
      <div className="flex flex-col gap-4 border-b border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <ul aria-label="Filter by category" className="flex flex-wrap gap-2">
          {ACH_FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-control border px-3.5 text-[13px] font-medium transition-colors duration-300",
                    active ? "border-text bg-text text-bg" : "border-line text-muted hover:border-text/40 hover:text-text",
                  )}
                >
                  {f.label}
                  <span className={cn("font-mono text-[11px]", active ? "text-bg/60" : "text-faint")}>
                    {items.filter((a) => matchesFilter(a, f.id)).length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="font-mono text-[12px] text-faint" aria-live="polite">
          {shown.length} {shown.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {years.map((year) => {
        const inYear = shown.filter((a) => achYear(a.date) === year);
        return (
          <section key={year} aria-labelledby={`year-${year}`} className="grid gap-6 border-b border-line py-12 md:py-16 lg:grid-cols-12 lg:gap-8">
            <h2 id={`year-${year}`} className="lg:col-span-2">
              <span className="block text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{year}</span>
              <span className="mono-label mt-3 block text-faint">
                {inYear.length} {inYear.length === 1 ? "entry" : "entries"}
              </span>
            </h2>
            <ol className="space-y-12 lg:col-span-10 md:space-y-14">
              {inYear.map((a) => (
                <li key={a.id}>
                  <Entry achievement={a} marked={a.slug === target} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function Entry({ achievement: a, marked }: { achievement: Achievement; marked: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}/achievements?a=${a.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <article
      id={a.slug}
      aria-labelledby={`${a.slug}-title`}
      className={cn(
        "grid gap-6 rounded-card md:grid-cols-[minmax(0,18rem)_1fr] md:gap-8",
        marked && "bg-bg-2 p-4 ring-1 ring-text/20 md:p-6",
      )}
    >
      <Photo src={a.image_url} alt={`${a.title}: ${a.event_name}`} sizes="(min-width: 768px) 288px, 100vw" ratio="aspect-[3/2]" />
      <div className="min-w-0">
        <p className="font-mono text-[11px] tracking-[0.04em] text-faint">
          {achDate(a.date)} · {CATEGORY_LABEL[a.category]}
        </p>
        <h3 id={`${a.slug}-title`} className="type-h3 mt-2">
          {a.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Tag tone={isWin(a.result) ? "accent" : "default"}>{a.result}</Tag>
          <span className="text-[14px] text-muted">
            {a.event_name} · {a.location}
          </span>
        </div>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-muted">{a.description}</p>
        {a.team.length > 0 && (
          <p className="mt-4 text-[13px] text-faint">
            <span className="mono-label mr-2">Team</span>
            {a.team.join(", ")}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {a.link && (
            <Button href={a.link} variant="secondary" size="sm" arrow>
              {linkLabel(a)}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={copy} aria-live="polite" className={a.link ? undefined : "-ml-3.5"}>
            {copied ? "Link copied" : "Copy link"}
          </Button>
        </div>
      </div>
    </article>
  );
}

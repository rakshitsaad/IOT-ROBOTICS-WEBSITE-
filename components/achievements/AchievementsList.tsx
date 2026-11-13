import { MonoLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { achDate, achYear } from "@/lib/achievements";
import type { Achievement } from "@/lib/types";
import { ResultBadge } from "./parts";

/**
 * "All achievements" under the slider (DESIGN.md §19): one row per achievement (date, title, result, event), grouped
 * by year, newest first. A row scrolls back up and opens that slide.
 */
export function AchievementsList({
  items,
  active,
  onOpen,
}: {
  items: Achievement[];
  active: string;
  onOpen(slug: string): void;
}) {
  const years = [...new Set(items.map((a) => achYear(a.date)))].sort((a, b) => b - a);
  return (
    <section aria-labelledby="all-achievements-title" className="shell pt-[clamp(5rem,14svh,9rem)] pb-[clamp(5rem,14svh,9rem)]">
      <MonoLabel as="p">
        Record
      </MonoLabel>
      <h2 id="all-achievements-title" className="mt-4 text-[length:clamp(2.2rem,5vw,4.5rem)] leading-[1.04] font-semibold tracking-[-0.03em]">
        All achievements
      </h2>
      {years.map((year) => {
        const own = items.filter((a) => achYear(a.date) === year).sort((a, b) => b.date.localeCompare(a.date));
        return (
          <div key={year} className="mt-12 md:mt-16">
            <h3 className="flex items-center gap-4 text-2xl font-semibold tracking-[-0.02em] tabular-nums">
              {year}
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
              <MonoLabel>{own.length} {own.length === 1 ? "achievement" : "achievements"}</MonoLabel>
            </h3>
            <ul className="mt-4">
              {own.map((a) => {
                const on = a.slug === active;
                return (
                  <li key={a.slug} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => onOpen(a.slug)}
                      aria-current={on ? "true" : undefined}
                      aria-label={`${a.title}, ${a.result}, ${a.event_name}, ${achDate(a.date)}. Show it above`}
                      className={cn(
                        "group/row grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-5 text-left",
                        "transition-colors duration-[350ms] hover:bg-text/[0.03] focus-visible:bg-text/[0.03]",
                        "md:grid-cols-[8.5rem_minmax(0,1.3fr)_minmax(0,1fr)_10rem] md:gap-x-6 md:py-6",
                      )}
                    >
                      <time dateTime={a.date} className="mono-label text-muted">
                        {achDate(a.date)}
                      </time>
                      <span className="col-span-2 row-start-2 flex items-center gap-3 md:col-span-1 md:row-start-auto">
                        <span
                          aria-hidden="true"
                          className={cn("size-1.5 shrink-0 rounded-full bg-red transition-opacity duration-[350ms]", on ? "opacity-100" : "opacity-0")}
                        />
                        <span className="text-xl leading-tight font-display font-semibold tracking-[-0.01em] transition-transform duration-[350ms] ease-power3 group-hover/row:translate-x-1.5 md:text-2xl">
                          {a.title}
                        </span>
                      </span>
                      <span className="col-span-2 row-start-3 pl-[1.125rem] text-[14px] text-muted md:col-span-1 md:row-start-auto md:pl-0">
                        {a.event_name} / {a.location}
                      </span>
                      <span className="col-start-2 row-start-1 justify-self-end md:col-start-auto md:row-start-auto">
                        <ResultBadge result={a.result} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

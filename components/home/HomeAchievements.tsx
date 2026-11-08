import Link from "next/link";
import { ArrowLink, MonoLabel, Tag } from "@/components/ui";
import { achDate, isWin } from "@/lib/achievements";
import type { Achievement } from "@/lib/types";

/**
 * Home section 05 (DESIGN.md §12): the latest results as a compact record, each row linking to its entry on
 * /achievements. Only what the data says: the result, the event, the place and the date.
 */
export function HomeAchievements({ items, index }: { items: Achievement[]; index?: number }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="achievements-title" className="section-y border-t border-line">
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div data-reveal className="lg:col-span-4">
          <MonoLabel index={index}>Achievements</MonoLabel>
          <h2 id="achievements-title" className="type-h2 mt-5 max-w-[14ch]">
            Recent results.
          </h2>
          <p className="type-body mt-5 max-w-[36ch] text-muted">Competitions, papers and grants won by the club&apos;s teams.</p>
          <ArrowLink href="/achievements" className="mt-6">
            Full record
          </ArrowLink>
        </div>

        <ol data-reveal className="divide-y divide-line border-y border-line lg:col-span-8">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/achievements?a=${a.slug}`}
                className="group/row grid gap-x-6 gap-y-2 py-5 sm:grid-cols-[7rem_1fr_auto] sm:items-baseline md:py-6"
              >
                <span className="font-mono text-[12px] text-faint">{achDate(a.date)}</span>
                <span className="min-w-0">
                  <span className="block text-[17px] leading-snug font-semibold tracking-[-0.01em] transition-colors duration-300 group-hover/row:text-text md:text-[18px]">
                    {a.title}
                  </span>
                  <span className="mt-1 block text-[14px] text-muted">
                    {a.event_name} · {a.location}
                  </span>
                </span>
                <span className="sm:justify-self-end">
                  <Tag tone={isWin(a.result) ? "accent" : "default"}>{a.result}</Tag>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

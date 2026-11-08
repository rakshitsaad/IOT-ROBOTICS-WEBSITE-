import { MonoLabel } from "@/components/ui";
import type { HomeStats } from "@/lib/data";
import { STAGGER } from "@/lib/motion";
import { CountUp } from "./CountUp";

/** Section F: four counts computed from the data (lib/data.ts → getHomeStats), counting up in view. */
export function Numbers({ stats }: { stats: HomeStats }) {
  const items = [
    { value: stats.members, label: "Members" },
    { value: stats.projects, label: "Projects built" },
    { value: stats.events, label: "Events hosted" },
    { value: stats.years, label: "Years running" },
  ];
  return (
    <section data-numbers aria-labelledby="numbers-title" className="py-[clamp(4rem,12svh,9rem)]">
      <div className="shell">
        <MonoLabel as="h2" index={5} id="numbers-title">
          By the numbers
        </MonoLabel>
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:mt-14 md:grid-cols-4 md:gap-x-8">
          {items.map((item, i) => (
            <div key={item.label} className="flex flex-col-reverse border-t border-line pt-6">
              <dt className="mono-label mt-4 text-muted">{item.label}</dt>
              <dd className="text-[length:clamp(3.4rem,8vw,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.05em] tabular-nums">
                <CountUp value={item.value} delay={i * STAGGER} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

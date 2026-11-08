import { Button } from "@/components/ui";
import type { HomeStats } from "@/lib/data";
import type { Settings } from "@/lib/types";
import { HeroRobot } from "./HeroRobot";

/**
 * Home hero (DESIGN.md §12): what the club is, in one headline and one sentence, two actions, and four counts taken
 * from the data. The mascot stands in a framed panel on the right (below the text on phones).
 */
export function HomeHero({ settings, stats }: { settings: Settings; stats: HomeStats }) {
  const counts = [
    { value: stats.members, label: "Members" },
    { value: stats.projects, label: "Projects built" },
    { value: stats.events, label: "Events hosted" },
    ...(stats.years > 0 ? [{ value: stats.years, label: "Years running" }] : []),
  ];

  return (
    <section aria-labelledby="hero-title" className="pt-header">
      <div className="shell">
        <div className="grid items-center gap-12 pt-[clamp(2.5rem,7vw,5rem)] pb-[clamp(3.5rem,7vw,6rem)] lg:min-h-[calc(100svh-var(--nav-h)-var(--ann-h))] lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="mono-label text-faint motion-safe:animate-fade-up">
              {settings.college_name}
              {settings.founded_year && <> · Est. {settings.founded_year}</>}
            </p>

            <h1 id="hero-title" className="type-display mt-7 max-w-[12ch] text-balance">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block text-muted motion-safe:animate-rise [animation-delay:80ms]">We don&apos;t just imagine the future.</span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block motion-safe:animate-rise [animation-delay:200ms]">We build it.</span>
              </span>
            </h1>

            <p className="type-lead mt-8 max-w-[48ch] text-muted motion-safe:animate-fade-up [animation-delay:320ms]">
              A community of engineers, builders and curious minds exploring robotics, embedded systems, drones and
              intelligent technology.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 motion-safe:animate-fade-up [animation-delay:400ms]">
              <Button href={settings.join_form_url ?? "/join"} size="lg" arrow>
                Join the club
              </Button>
              <Button href="/projects" variant="secondary" size="lg">
                Explore projects
              </Button>
            </div>

            <dl className="mt-14 grid max-w-[40rem] grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-7 sm:grid-cols-4 motion-safe:animate-fade-up [animation-delay:480ms]">
              {counts.map((c) => (
                <div key={c.label} className="flex flex-col-reverse gap-1.5">
                  <dt className="mono-label text-faint">{c.label}</dt>
                  <dd className="text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="lg:col-span-5 motion-safe:animate-fade-up [animation-delay:200ms]">
            <div className="relative aspect-[5/4] overflow-hidden rounded-card border border-line bg-bg-2 sm:aspect-[4/3] lg:aspect-[4/5]">
              {/* A soft floor light under the robot; the only gradient in the hero. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(60%_55%_at_50%_100%,color-mix(in_oklab,var(--text)_7%,transparent),transparent)]"
              />
              <HeroRobot />
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-4 text-[13px] text-faint">
              <span>ClubBot, the club mascot, modelled in code with three.js.</span>
              <span className="mono-label hidden shrink-0 sm:inline lg:hidden xl:inline">Click to say hi</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

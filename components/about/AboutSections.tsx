import Link from "next/link";
import { ArrowLink, MonoLabel, Photo, SectionHeader } from "@/components/ui";
import { ABOUT_PILLARS, ABOUT_PURPOSE } from "@/lib/about";
import { juniorRowId } from "@/lib/members";
import type { Milestone, Team } from "@/lib/types";

/**
 * /about below its header (DESIGN.md §15). Each section has its own composition: a photo beside the story, mission and
 * vision as two statements, the practice as a numbered list, the history as a ruled timeline, a photo set and the teams.
 */

type HighlightPhoto = { id: string; url: string; alt: string; event_title: string };

/** 01: who we are, beside a photo from the journals. */
export function Story({ photo }: { photo: HighlightPhoto | null }) {
  return (
    <section aria-labelledby="story-title" className="section-y">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
        <figure data-reveal className="lg:col-span-6">
          <Photo src={photo?.url} alt={photo?.alt ?? "Club members at work"} sizes="(min-width: 1024px) 48vw, 100vw" ratio="aspect-[4/3]" priority />
          {photo && (
            <figcaption className="mt-3 text-[13px] text-faint">
              {photo.alt}. {photo.event_title}.
            </figcaption>
          )}
        </figure>
        <div className="lg:col-span-5 lg:col-start-8">
          <div data-reveal>
            <MonoLabel index={1}>Who we are</MonoLabel>
            <h2 id="story-title" className="type-h2 mt-5">
              Sense. Understand. Adapt.
            </h2>
            <p className="type-body mt-5 text-muted">
              Every build starts with a sensor and ends with a machine that responds.{" "}
              <strong className="font-semibold text-text">We start with a soldering iron,</strong> not a slide deck: members
              prototype drones, robots and connected devices, then test them where things actually break.
            </p>
            <p className="type-body mt-4 text-muted">
              <strong className="font-semibold text-text">Every semester brings workshops,</strong> build sprints and
              competitions, plus a research division writing up what we build.
            </p>
          </div>
          <div data-reveal className="mt-10 border-t border-line pt-6">
            <p className="mono-label text-faint">How we build</p>
            <p className="mt-3 text-[19px] leading-snug font-semibold tracking-[-0.015em]">Precision. With feeling.</p>
            <p className="type-body mt-2 text-muted">Engineering discipline, with room for curiosity.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 02: mission and vision, as two statements side by side. */
export function Purpose() {
  return (
    <section aria-labelledby="purpose-title" className="section-y border-t border-line">
      <div className="shell">
        <MonoLabel index={2} id="purpose-title">
          Mission &amp; vision
        </MonoLabel>
        <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-0 md:divide-x md:divide-line">
          {ABOUT_PURPOSE.map((p, i) => (
            <article key={p.label} data-reveal className={i === 0 ? "md:pr-12 lg:pr-16" : "md:pl-12 lg:pl-16"}>
              <h3 className="mono-label text-faint">{p.label}</h3>
              <p className="mt-5 text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.15] font-semibold tracking-[-0.025em]">{p.title}.</p>
              <p className="type-body mt-5 max-w-[48ch] text-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 03: what we do, a numbered list beside a heading that stays in view on wide screens. */
export function Practice() {
  return (
    <section aria-labelledby="practice-title" className="section-y border-t border-line">
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <div data-reveal className="lg:sticky lg:top-[calc(var(--nav-h)+3rem)]">
            <MonoLabel index={3}>What we do</MonoLabel>
            <h2 id="practice-title" className="type-h2 mt-5 max-w-[14ch]">
              Learn it, build it, test it in public.
            </h2>
          </div>
        </div>
        <ol className="border-b border-line lg:col-span-7 lg:col-start-6">
          {ABOUT_PILLARS.map((p, i) => (
            <li key={p.title} data-reveal className="grid gap-3 border-t border-line py-8 sm:grid-cols-[4rem_1fr] md:py-10">
              <span className="font-mono text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="type-h3">{p.title}</h3>
                <p className="type-body mt-3 max-w-[52ch] text-muted">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** 04: the club's history, one ruled row per milestone. */
export function History({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return null;
  return (
    <section aria-labelledby="history-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={4}
          label="Our story"
          titleId="history-title"
          title="How the club got here."
          intro={`From ${milestones[0].year} to today, in ${milestones.length} moments.`}
        />
        <ol className="mt-12 border-b border-line md:mt-16">
          {milestones.map((m) => (
            <li key={m.id} data-reveal className="grid gap-2 border-t border-line py-6 md:grid-cols-12 md:items-baseline md:gap-8 md:py-7">
              <span className="font-mono text-[15px] text-text tabular-nums md:col-span-2">{m.year}</span>
              <h3 className="text-[18px] leading-snug font-semibold tracking-[-0.015em] md:col-span-4 md:text-[20px]">{m.title}</h3>
              <p className="type-body text-muted md:col-span-6">{m.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** 06: photos from the journals, one large and four small. */
export function PhotoSet({ photos }: { photos: HighlightPhoto[] }) {
  if (photos.length === 0) return null;
  const [first, ...rest] = photos;
  return (
    <section aria-labelledby="photos-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={6}
          label="In the lab"
          titleId="photos-title"
          title="From our journals."
          intro="Photos from our events and build nights. Every event has its own journal in the gallery."
          action={{ label: "Open the gallery", href: "/gallery" }}
        />
        <div className="mt-12 grid gap-3 md:mt-16 md:grid-cols-4 md:grid-rows-2">
          <figure data-reveal className="md:col-span-2 md:row-span-2">
            <Photo src={first.url} alt={first.alt} sizes="(min-width: 768px) 50vw, 100vw" ratio="aspect-[4/3] md:aspect-auto md:h-full" />
          </figure>
          {rest.slice(0, 4).map((p, i) => (
            <figure key={p.id} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}>
              <Photo src={p.url} alt={p.alt} sizes="(min-width: 768px) 25vw, 100vw" ratio="aspect-[4/3]" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const COUNT_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** 07: the teams, each linking to its row on /members. */
export function TeamsOverview({ teams }: { teams: Team[] }) {
  const count = COUNT_WORDS[teams.length] ?? String(teams.length);
  return (
    <section aria-labelledby="teams-title" className="section-y border-t border-line">
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div data-reveal className="lg:col-span-4">
          <MonoLabel index={7}>Teams</MonoLabel>
          <h2 id="teams-title" className="type-h2 mt-5 max-w-[14ch]">
            {count} {teams.length === 1 ? "team" : "teams"}, one club.
          </h2>
          <p className="type-body mt-5 max-w-[36ch] text-muted">
            Pick the work you like. Every team builds with the others, and every member has a team.
          </p>
          <ArrowLink href="/members" className="mt-6">
            Meet the team
          </ArrowLink>
        </div>
        <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-8 lg:col-span-8">
          {teams.map((team) => (
            <li key={team.id} data-reveal className="border-b border-line">
              <Link href={`/members#${juniorRowId(team.slug)}`} className="group/row block py-6">
                <span className="flex items-center justify-between gap-4 text-[18px] font-semibold tracking-[-0.015em]">
                  {team.name}
                  <span aria-hidden="true" className="text-faint transition-[transform,color] duration-300 ease-power3 group-hover/row:translate-x-1 group-hover/row:text-red">
                    →
                  </span>
                </span>
                <span className="mt-2 block text-[14px] leading-relaxed text-muted">{team.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { DotGrid, MonoLabel, Pill } from "@/components/ui";
import { ABOUT_PILLARS, ABOUT_PURPOSE } from "@/lib/about";
import { cn } from "@/lib/cn";
import type { Accent, Milestone, Team } from "@/lib/types";
import { PillarIcon } from "./icons";

/**
 * The /about sections below the hands (DESIGN.md §15), in the site's usual
 * style. AboutReveals animates the hooks:
 *   data-reveal              rises 40px and fades in once
 *   data-reveal-group/-item  the items rise in one after another
 *   data-timeline(-line, -dot, -card)  the history line draws, dots light, cards come in
 * Rendered in their final state, so they read the same without JS and under
 * reduced motion.
 */

const SECTION = "shell py-[clamp(4.5rem,13svh,9rem)]";

function SectionHead({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div data-reveal>
      <MonoLabel>{label}</MonoLabel>
      <h2
        id={id}
        className="mt-5 max-w-[18ch] text-[length:clamp(2.2rem,5vw,4.5rem)] leading-[1.04] font-bold tracking-[-0.04em]"
      >
        {children}
      </h2>
    </div>
  );
}

/* ----------------------------------------------------- mission & vision */

export function Purpose() {
  return (
    <section aria-labelledby="purpose-title" className={SECTION}>
      <SectionHead label="Mission & vision" id="purpose-title">
        Why the club exists
      </SectionHead>
      <div data-reveal-group className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-5">
        {ABOUT_PURPOSE.map((card) => (
          <article
            key={card.label}
            data-reveal-item
            className="relative flex min-h-[22rem] flex-col rounded-card border border-line bg-bg-2 p-[clamp(1.75rem,4vw,3.5rem)] md:min-h-[28rem]"
          >
            <MonoLabel tone={card.accent}>{card.label}</MonoLabel>
            <DotGrid rows={3} cols={4} className="absolute top-[clamp(1.75rem,4vw,3.5rem)] right-[clamp(1.75rem,4vw,3.5rem)] text-text/20" />
            <h3 className="mt-auto pt-16 text-[length:clamp(1.75rem,3vw,2.75rem)] leading-[1.08] font-semibold tracking-[-0.03em]">
              {card.title}
            </h3>
            <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-muted md:text-[17px]">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- pillars */

/** Icon circles: red with warm white, or warm white with dark (lib/tokens.ts → textOn). */
const ICON_FILL: Record<Accent, string> = {
  red: "bg-red text-text",
  white: "bg-text text-bg",
};

export function Pillars() {
  return (
    <section aria-labelledby="pillars-title" className={SECTION}>
      <SectionHead label="What we do" id="pillars-title">
        Three ways in
      </SectionHead>
      <ul data-reveal-group className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-5">
        {ABOUT_PILLARS.map((pillar) => (
          <li key={pillar.title} data-reveal-item className="rounded-card border border-line bg-bg-2/70 p-7 md:p-8">
            <div className="flex items-start justify-between">
              <span className={cn("grid size-14 place-items-center rounded-full", ICON_FILL[pillar.accent])}>
                <PillarIcon name={pillar.icon} className="size-7" />
              </span>
            </div>
            <h3 className="mt-10 text-2xl font-semibold tracking-[-0.02em] md:mt-14">{pillar.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{pillar.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------------------------------------- history */

/** Every dot lights red: the line reaching a milestone is the timeline's one active state. */
const ACCENT_CYCLE: Accent[] = ["red"];

/** A dot lights up in its accent once the line reaches it (and always under reduced motion). */
const DOT_LIT: Record<Accent, string> = {
  red: "[&.is-lit]:bg-red motion-reduce:bg-red",
  white: "[&.is-lit]:bg-text motion-reduce:bg-text",
};

export function History({ milestones }: { milestones: Milestone[] }) {
  return (
    <section aria-labelledby="history-title" className={SECTION}>
      <SectionHead label="Our story" id="history-title">
        How we got here
      </SectionHead>
      <ol data-timeline className="relative mt-14 md:mt-20">
        <span aria-hidden="true" className="absolute inset-y-0 left-[7px] w-px bg-line md:left-1/2" />
        <span
          data-timeline-line
          aria-hidden="true"
          className="absolute inset-y-0 left-[7px] w-px origin-top bg-text/70 md:left-1/2"
        />
        {milestones.map((m, i) => {
          const left = i % 2 === 0;
          return (
            <li
              key={m.id}
              className="relative pb-6 pl-10 last:pb-0 md:grid md:grid-cols-2 md:gap-x-24 md:pb-0 md:pl-0 md:not-first:-mt-12"
            >
              <span
                data-timeline-dot
                aria-hidden="true"
                className={cn(
                  "absolute top-9 left-[7px] size-3.5 -translate-x-1/2 rounded-full border border-text/40 bg-bg md:left-1/2",
                  "transition-[background-color,border-color,scale] duration-[350ms] ease-power3 [&.is-lit]:scale-125 [&.is-lit]:border-transparent motion-reduce:border-transparent",
                  DOT_LIT[ACCENT_CYCLE[i % ACCENT_CYCLE.length]],
                )}
              />
              <article
                data-timeline-card
                data-side={left ? "left" : "right"}
                className={cn(
                  "rounded-card border border-line bg-bg-2 p-6 md:p-8",
                  left ? "md:col-start-1 md:text-right" : "md:col-start-2",
                )}
              >
                <p className="text-[length:clamp(2.25rem,4vw,3.5rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
                  {m.year}
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em]">{m.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{m.description}</p>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ----------------------------------------------------------------- teams */

const COUNT_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

export function TeamsOverview({ teams }: { teams: Team[] }) {
  const count = COUNT_WORDS[teams.length] ?? String(teams.length);
  return (
    <section aria-labelledby="teams-title" className={cn(SECTION, "pb-[clamp(6rem,18svh,11rem)]")}>
      <SectionHead label="Teams" id="teams-title">
        {count} {teams.length === 1 ? "team" : "teams"}, one club
      </SectionHead>
      <p data-reveal className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-muted">
        Pick the work you like. Every team builds with the others, and every member has a team.
      </p>
      <ul
        data-reveal-group
        aria-label="Teams"
        className="mt-10 flex flex-wrap gap-x-3 gap-y-4 text-[length:clamp(1.25rem,2.6vw,2.25rem)] font-semibold tracking-[-0.02em] md:mt-14"
      >
        {teams.map((team) => (
          <li key={team.id} data-reveal-item>
            <Link
              href="/members"
              title={team.description}
              className="group/team inline-block rounded-pill transition-transform duration-[350ms] ease-power3 hover:-translate-y-1 focus-visible:outline-offset-4"
            >
              <Pill
                color="raised"
                className="inline-flex items-center gap-[0.3em] px-[0.6em] py-[0.12em] transition-colors duration-[350ms] ease-power3 group-hover/team:bg-red group-focus-visible/team:bg-red"
              >
                {team.name}
                <span
                  aria-hidden="true"
                  className="text-[0.7em] text-red transition-[color,translate] duration-[350ms] ease-power3 group-hover/team:text-text group-focus-visible/team:text-text group-hover/team:translate-x-0.5 group-hover/team:-translate-y-0.5"
                >
                  ↗
                </span>
              </Pill>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

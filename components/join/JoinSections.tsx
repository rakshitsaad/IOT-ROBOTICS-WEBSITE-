import Image from "next/image";
import Link from "next/link";
import { Accordion, IrisButton, MonoLabel, PillButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { JOIN_BENEFITS, JOIN_CHARACTERS, JOIN_FAQ, JOIN_STEPS, characterBySlug } from "@/lib/join";
import type { Team } from "@/lib/types";
import { CharacterAvatar } from "./CharacterAvatar";

/**
 * The /join sections under the hero (DESIGN.md §21): why join, the teams, how it works, the FAQ and the closing card.
 * Reveals and the steps' line are driven by JoinReveals ([data-reveal], [data-reveal-group], [data-steps]).
 */

const HEADING = "mt-4 text-[length:clamp(2.2rem,5vw,4.5rem)] leading-[1.04] font-bold tracking-[-0.04em]";
const SECTION = "shell pt-[clamp(5rem,14svh,9rem)]";

/* ------------------------------------------------------------------ why join */

export function WhyJoin() {
  return (
    <section aria-labelledby="why-title" className={SECTION}>
      <div data-reveal>
        <MonoLabel as="p" index={1}>
          Why join
        </MonoLabel>
        <h2 id="why-title" className={HEADING}>
          More than a club
        </h2>
      </div>
      <ul data-reveal-group className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
        {JOIN_BENEFITS.map((b, i) => (
          <li key={b.title} data-reveal-item className="flex flex-col rounded-card bg-bg-2 p-6 ring-1 ring-line md:p-7">
            <span
              className={cn(
                "grid size-12 place-items-center rounded-full",
                i === 0 ? "bg-red text-text" : "bg-text/[0.07] text-text ring-1 ring-line",
              )}
            >
              <BenefitIcon name={b.icon} />
            </span>
            <h3 className="mt-6 text-xl leading-tight font-semibold tracking-[-0.02em]">{b.title}</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{b.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BenefitIcon({ name }: { name: (typeof JOIN_BENEFITS)[number]["icon"] }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      {name === "chip" && (
        <>
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
        </>
      )}
      {name === "build" && (
        <path d="M14.5 5.5a4 4 0 0 0-5.3 5L4 15.7a1.8 1.8 0 0 0 2.6 2.6L11.8 13a4 4 0 0 0 5-5.3l-2.4 2.4-2.2-.4-.4-2.2 2.7-2z" />
      )}
      {name === "trophy" && (
        <>
          <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
          <path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3M12 13v4M8.5 20h7M10 17h4v3h-4z" />
        </>
      )}
      {name === "people" && (
        <>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.3a4.5 4.5 0 0 1 5 4.7" />
        </>
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------------- teams */

export function TeamsSection({ teams, hiring }: { teams: Team[]; hiring: Record<string, boolean> }) {
  const open = Object.values(hiring).filter(Boolean).length;
  // In the teams' own order (lib/data), each with its character.
  const rows = teams
    .map((t) => ({ team: t, character: characterBySlug(t.slug) }))
    .filter((r): r is { team: Team; character: NonNullable<ReturnType<typeof characterBySlug>> } => Boolean(r.character));
  return (
    <section id="teams" aria-labelledby="teams-title" className={cn(SECTION, "scroll-mt-24")}>
      <div data-reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <MonoLabel as="p" index={2}>
            Teams
          </MonoLabel>
          <h2 id="teams-title" className={HEADING}>
            Seven teams, one crew
          </h2>
        </div>
        <MonoLabel as="p" tone="text">
          [{String(open).padStart(2, "0")}] hiring now
        </MonoLabel>
      </div>
      <ul data-reveal-group className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
        {rows.map(({ team, character }) => {
          const isOpen = hiring[character.slug];
          return (
            <li
              key={team.slug}
              data-reveal-item
              className="group/team flex flex-col rounded-card bg-bg-2 p-6 ring-1 ring-line transition-[box-shadow] duration-[350ms] hover:ring-text/20 md:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <CharacterAvatar
                  character={character}
                  sizes="128px"
                  className="size-16 origin-[50%_85%] ring-1 ring-line group-hover/team:animate-wave motion-reduce:animate-none md:size-[4.5rem]"
                />
                <StatusPill open={isOpen} />
              </div>
              <h3 className="mt-5 text-2xl leading-tight font-semibold tracking-[-0.02em]">{team.name}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{team.description}</p>
              <ul aria-label="Skills" className="mt-4 flex flex-wrap gap-1.5">
                {character.skills.map((s) => (
                  <li key={s} className="rounded-pill bg-text/[0.06] px-2.5 py-1 text-[12px] leading-none text-text/80 ring-1 ring-line">
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                {isOpen ? (
                  <PillButton href={`/join/apply?team=${character.slug}`} variant="ghost" size="sm" arrow>
                    Apply to {team.name}
                  </PillButton>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-9 cursor-not-allowed items-center rounded-pill px-4 text-[13px] font-semibold text-text/45 ring-1 ring-line"
                  >
                    Opens next round
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StatusPill({ open, className }: { open: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 font-mono text-[10px] leading-none tracking-[0.12em] uppercase",
        open ? "bg-red text-text" : "bg-text/10 text-text/60",
        className,
      )}
    >
      {open ? "Hiring" : "Closed"}
    </span>
  );
}

/* --------------------------------------------------------------- how it works */

export function HowItWorks() {
  return (
    <section aria-labelledby="steps-title" className={SECTION}>
      <div data-reveal>
        <MonoLabel as="p" index={3}>
          How it works
        </MonoLabel>
        <h2 id="steps-title" className={HEADING}>
          Four steps in
        </h2>
      </div>
      {/* The line runs from the first dot to the last; JoinReveals measures it and draws it as you scroll. */}
      <ol data-steps className="relative mt-12 grid gap-10 md:mt-16 md:grid-cols-4 md:gap-6">
        <span aria-hidden="true" data-steps-track className="absolute top-3 left-3 h-[calc(100%-1.5rem)] w-px bg-line md:h-px md:w-[calc(75%+18px)]" />
        <span
          aria-hidden="true"
          data-steps-line
          className="absolute top-3 left-3 h-[calc(100%-1.5rem)] w-px origin-top bg-red md:h-px md:w-[calc(75%+18px)] md:origin-left"
        />
        {JOIN_STEPS.map((s, i) => (
          <li key={s.title} className="relative pl-12 md:pt-12 md:pl-0">
            <span
              aria-hidden="true"
              data-step-dot
              className="is-lit group/dot absolute top-0 left-0 grid size-6 place-items-center rounded-full bg-bg ring-1 ring-line transition-[background-color,box-shadow] duration-[350ms] [&.is-lit]:bg-red [&.is-lit]:shadow-[0_0_18px_-2px_var(--red)] [&.is-lit]:ring-red"
            >
              <span className="size-1.5 rounded-full bg-text/40 transition-colors duration-[350ms] group-[.is-lit]/dot:bg-text" />
            </span>
            <MonoLabel as="p">Step {String(i + 1).padStart(2, "0")}</MonoLabel>
            <h3 className="mt-3 text-xl leading-tight font-semibold tracking-[-0.02em] md:text-2xl">{s.title}</h3>
            <p className="mt-2 max-w-[30ch] text-[15px] leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------------ FAQ */

export function JoinFaq() {
  return (
    <section aria-labelledby="join-faq-title" className={cn(SECTION, "grid gap-10 md:grid-cols-12 md:gap-8")}>
      <div data-reveal className="md:col-span-4">
        <MonoLabel as="p" index={4}>
          FAQ
        </MonoLabel>
        <h2 id="join-faq-title" className={HEADING}>
          Before you apply
        </h2>
        <p className="mt-5 max-w-[30ch] text-[15px] leading-relaxed text-muted">
          Something else on your mind?{" "}
          <Link
            href="/contact"
            data-cursor="link"
            className="font-semibold text-text underline decoration-text/30 underline-offset-4 transition-colors duration-[350ms] hover:decoration-text"
          >
            Ask us
          </Link>
          .
        </p>
      </div>
      <div data-reveal className="md:col-span-8">
        <Accordion items={JOIN_FAQ} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- the last call */

const PEEKERS = [
  { slug: "design", left: "4%", size: "clamp(11rem, 26vw, 19rem)", r: -7, delay: 0 },
  { slug: "tech", left: "50%", size: "clamp(13rem, 31vw, 23rem)", r: 1, delay: 0.06 },
  { slug: "pr", left: "96%", size: "clamp(11rem, 26vw, 19rem)", r: 7, delay: 0.12 },
];

export function JoinCta({ open }: { open: boolean }) {
  return (
    <section aria-labelledby="cta-title" className={cn(SECTION, "pb-4")}>
      <div
        data-reveal
        className="group/cta relative isolate flex min-h-[30rem] flex-col items-center overflow-hidden rounded-card bg-bg-2 px-6 pt-14 text-center ring-1 ring-line md:min-h-[34rem] md:pt-20"
      >
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-radial-[70%_70%_at_50%_100%] from-red/22 via-red/6 via-45% to-transparent to-75%" />
        <h2 id="cta-title" className="max-w-[16ch] text-[length:clamp(2.2rem,5vw,4.25rem)] leading-[1.04] font-bold tracking-[-0.04em]">
          Ready to build with us?
        </h2>
        <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-muted md:text-[17px]">
          {open ? "Applications take five minutes. Pick a team, tell us what you want to build." : "Applications open soon. Ask us anything until then."}
        </p>
        <div className="relative z-10 mt-8">
          {open ? (
            <IrisButton href="/join/apply" size="lg" arrow>
              Apply now
            </IrisButton>
          ) : (
            <PillButton href="/contact" variant="ghost" size="lg">
              Ask us anything
            </PillButton>
          )}
        </div>
        {/* Three of the crew peeking up from the bottom edge (cut off by it); they rise a little on hover. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0">
          {PEEKERS.map((p) => {
            const c = characterBySlug(p.slug) ?? JOIN_CHARACTERS[0];
            return (
              <div
                key={p.slug}
                className="absolute bottom-0 aspect-square -translate-x-1/2 translate-y-[48%] transition-transform duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/cta:translate-y-[42%]"
                style={{ left: p.left, width: p.size, transitionDelay: `${p.delay}s` }}
              >
                <Image src={c.image} alt="" fill sizes="(max-width: 767px) 50vw, 24rem" className="object-contain" style={{ rotate: `${p.r}deg` }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { CharacterAvatar } from "@/components/join/CharacterAvatar";
import { Accordion, Button, MonoLabel, SectionHeader, Tag } from "@/components/ui";
import { JOIN_BENEFITS, JOIN_CHARACTERS, JOIN_FAQ, JOIN_STEPS } from "@/lib/join";
import type { Team } from "@/lib/types";

/**
 * /join below its header (DESIGN.md §21): why join, the teams and who is hiring, how the process works, the FAQ and a
 * last call. Calm and plain: hairlines and numbers instead of icons and cards.
 */

export function WhyJoin() {
  return (
    <section aria-labelledby="why-title" className="section-y">
      <div className="shell">
        <SectionHeader index={1} label="Why join" titleId="why-title" title="What you get out of it." />
        <ul className="mt-12 grid border-t border-line md:mt-16 md:grid-cols-2">
          {JOIN_BENEFITS.map((b, i) => (
            <li
              key={b.title}
              data-reveal
              className="grid gap-3 border-b border-line py-8 sm:grid-cols-[3.5rem_1fr] md:py-10 md:odd:border-r md:odd:pr-10 md:even:pl-10"
            >
              <span className="font-mono text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="type-h3">{b.title}</h3>
                <p className="type-body mt-3 max-w-[44ch] text-muted">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function TeamsSection({ teams, hiring }: { teams: Team[]; hiring: Record<string, boolean> }) {
  const open = teams.filter((t) => hiring[t.slug]).length;
  return (
    <section id="teams" aria-labelledby="teams-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={2}
          label="Teams"
          titleId="teams-title"
          title="Pick the work you want to do."
          intro={open > 0 ? `${open} of ${teams.length} teams are taking applications this round.` : "No team is taking applications right now."}
        />
        <ul className="mt-12 border-b border-line md:mt-16">
          {teams.map((team) => {
            const character = JOIN_CHARACTERS.find((c) => c.slug === team.slug);
            const isOpen = hiring[team.slug];
            return (
              <li key={team.id} data-reveal className="grid gap-x-8 gap-y-4 border-t border-line py-7 md:grid-cols-12 md:items-center">
                <div className="flex items-center gap-4 md:col-span-4">
                  {character && <CharacterAvatar character={character} sizes="96px" className="size-12 border border-line" />}
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-[-0.015em]">{team.name}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted md:hidden">{team.description}</p>
                  </div>
                </div>
                <div className="md:col-span-5">
                  <p className="hidden text-[15px] leading-relaxed text-muted md:block">{team.description}</p>
                  {character && (
                    <p className="font-mono text-[11px] tracking-[0.04em] text-faint md:mt-2">{character.skills.join(" / ")}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 md:col-span-3 md:justify-end">
                  {isOpen ? <Tag tone="accent">Hiring</Tag> : <Tag tone="solid">Closed</Tag>}
                  {isOpen ? (
                    <Button href={`/join/apply?team=${team.slug}`} variant="secondary" size="sm" arrow>
                      Apply
                    </Button>
                  ) : (
                    <span className="text-[13px] text-faint">Opens next round</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="steps-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader index={3} label="How it works" titleId="steps-title" title="Four steps, from application to your first project." />
        <ol className="mt-12 grid gap-10 md:mt-16 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {JOIN_STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties} className="border-t border-line pt-6">
              <span className="flex items-center gap-3">
                <span className={i === 0 ? "size-2 rounded-pill bg-red" : "size-2 rounded-pill border border-text/40"} aria-hidden="true" />
                <span className="font-mono text-[12px] text-faint">Step {i + 1}</span>
              </span>
              <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.015em]">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function JoinFaq() {
  return (
    <section aria-labelledby="join-faq-title" className="section-y border-t border-line">
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div data-reveal className="lg:col-span-4">
          <MonoLabel index={4}>FAQ</MonoLabel>
          <h2 id="join-faq-title" className="type-h2 mt-5">
            Before you apply.
          </h2>
        </div>
        <Accordion items={JOIN_FAQ} className="lg:col-span-7 lg:col-start-6" />
      </div>
    </section>
  );
}

export function LastCall({ open, applyHref }: { open: boolean; applyHref: string }) {
  return (
    <section aria-labelledby="last-call-title" className="border-t border-line py-[clamp(4rem,8vw,6.5rem)]">
      <div data-reveal className="shell flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <h2 id="last-call-title" className="max-w-[16ch] text-[clamp(2.25rem,5vw,4rem)] leading-[1.04] font-semibold tracking-[-0.035em]">
          Ready to build with us?
        </h2>
        <div className="flex flex-wrap gap-3">
          {open && (
            <Button href={applyHref} size="lg" arrow>
              Apply now
            </Button>
          )}
          <Button href="/contact" variant="secondary" size="lg">
            Ask us anything
          </Button>
        </div>
      </div>
    </section>
  );
}

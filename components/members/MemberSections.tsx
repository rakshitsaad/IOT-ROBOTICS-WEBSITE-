import Link from "next/link";
import { MonoLabel, SectionHeader } from "@/components/ui";
import type { JuniorCoreTeam } from "@/lib/data";
import { juniorRowId } from "@/lib/members";
import type { Member } from "@/lib/types";
import { MemberSocials, Portrait, memberMeta } from "./MemberParts";

/**
 * /members (DESIGN.md §13). The Senior Core as a two-column list of full profiles (portrait, role, name, year, bio,
 * quote, links); the Junior Core grouped by team, with jump links to each team and a compact card per member. Every
 * portrait is 4:5 at the same width within a group, so the people read as one organisation.
 */

export function SeniorCore({ members, term }: { members: Member[]; term: string }) {
  return (
    <section id="senior-core" aria-labelledby="senior-title" className="section-y">
      <div className="shell">
        <SectionHeader
          index={1}
          label={`Senior Core · ${term}`}
          titleId="senior-title"
          title="Senior Core."
          intro={`The ${members.length} people who keep the lab open, the projects moving and the calendar honest.`}
        />
        <ul className="mt-12 grid gap-x-8 gap-y-14 md:mt-16 lg:grid-cols-2 lg:gap-y-16">
          {members.map((m, i) => (
            <li key={m.id} data-reveal style={{ "--reveal-delay": `${(i % 2) * 80}ms` } as React.CSSProperties}>
              <SeniorProfile member={m} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SeniorProfile({ member: m }: { member: Member }) {
  return (
    <article className="group/photo grid gap-6 border-t border-line pt-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-7">
      <Portrait member={m} sizes="(min-width: 640px) 240px, 100vw" className="max-sm:max-w-[20rem]" />
      <div className="flex min-w-0 flex-col">
        <p className="mono-label text-faint">{m.role}</p>
        <h3 className="type-h3 mt-3">{m.full_name}</h3>
        <p className="mt-1.5 text-[13px] text-faint">{memberMeta(m)}</p>
        {m.bio && <p className="mt-4 text-[15px] leading-relaxed text-muted">{m.bio}</p>}
        {m.quote && (
          <blockquote className="mt-4 border-l-2 border-red pl-4 text-[15px] leading-relaxed text-text/90">“{m.quote}”</blockquote>
        )}
        <MemberSocials member={m} className="mt-auto pt-6" />
      </div>
    </article>
  );
}

export function JuniorCore({ teams }: { teams: JuniorCoreTeam[] }) {
  const total = teams.reduce((n, t) => n + t.members.length, 0);
  return (
    <section id="junior-core" aria-labelledby="junior-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={2}
          label="Junior Core"
          titleId="junior-title"
          title="Junior Core, by team."
          intro={`${total} members across ${teams.length} teams. Jump to a team below.`}
        />

        <nav aria-label="Teams" className="mt-10 border-y border-line py-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {teams.map(({ team, members }) => (
              <li key={team.id}>
                <Link href={`#${juniorRowId(team.slug)}`} className="text-[14px] text-muted transition-colors duration-300 hover:text-text">
                  {team.name} <span className="font-mono text-[11px] text-faint">{members.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6">
          {teams.map(({ team, members }) => (
            <section
              key={team.id}
              id={juniorRowId(team.slug)}
              aria-labelledby={`${juniorRowId(team.slug)}-title`}
              className="grid gap-8 border-b border-line py-12 md:py-14 lg:grid-cols-12 lg:gap-8"
            >
              <div data-reveal className="lg:col-span-3">
                <h3 id={`${juniorRowId(team.slug)}-title`} className="type-h3">
                  {team.name}
                </h3>
                <MonoLabel as="p" className="mt-2">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </MonoLabel>
                <p className="mt-4 max-w-[32ch] text-[14px] leading-relaxed text-muted">{team.description}</p>
              </div>
              <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:col-span-9 xl:grid-cols-4">
                {members.map((m, i) => (
                  <li key={m.id} data-reveal style={{ "--reveal-delay": `${(i % 4) * 50}ms` } as React.CSSProperties}>
                    <JuniorCard member={m} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function JuniorCard({ member: m }: { member: Member }) {
  return (
    <article className="group/photo flex h-full flex-col">
      <Portrait member={m} sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 45vw" />
      <h4 className="mt-4 text-[16px] leading-snug font-semibold tracking-[-0.01em]">{m.full_name}</h4>
      <p className="mt-1 text-[13px] text-muted">{m.role}</p>
      {m.bio && <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-faint">{m.bio}</p>}
      <MemberSocials member={m} className="mt-auto pt-4" />
    </article>
  );
}

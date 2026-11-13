import type { CSSProperties } from "react";
import { MonoLabel } from "@/components/ui";
import type { JuniorCoreTeam } from "@/lib/data";
import { juniorRowId, juniorSectionName } from "@/lib/members";
import { teamAccent } from "@/lib/tokens";
import { JuniorCoreNav } from "./JuniorCoreNav";
import { TeamAccordion } from "./TeamAccordion";

/**
 * Junior Core, below Senior Core on /members (DESIGN.md §13): a sticky row of
 * team pills, then one row per team (in the teams' order) whose cards are an
 * expanding accordion. Archivo, Manrope and mono only; the serif stays in Senior Core.
 * `#junior-core` is where Senior Core's closing spread hands off to.
 */
export function JuniorCore({ teams }: { teams: JuniorCoreTeam[] }) {
  const total = teams.reduce((n, t) => n + t.members.length, 0);

  return (
    <section
      id="junior-core"
      aria-labelledby="junior-core-title"
      className="relative pt-[clamp(5rem,14svh,9rem)] pb-[clamp(4rem,12svh,8rem)]"
    >
      <div className="shell">
        <MonoLabel tone="muted">
          {/* "[33] MEMBERS / [07] TEAMS", counted from the data */}
          <span className="text-text/70">{total}</span> Members /{" "}
          <span className="text-text/70">{teams.length}</span> Teams
        </MonoLabel>
        <h2
          id="junior-core-title"
          className="mt-4 text-[length:clamp(3rem,9vw,8rem)] leading-[0.9] font-bold tracking-[-0.035em]"
        >
          Junior Core
        </h2>
      </div>

      <div className="mt-10 md:mt-14">
        <JuniorCoreNav
          teams={teams.map(({ team }) => ({ slug: team.slug, name: juniorSectionName(team.name), accent: teamAccent(team.name) }))}
        />

        <div className="shell mt-10 flex flex-col gap-14 md:mt-14 md:gap-20">
          {teams.map(({ team, members }) => (
            <div
              key={team.id}
              id={juniorRowId(team.slug)}
              style={{ "--jc-accent": `var(--${teamAccent(team.name)})` } as CSSProperties}
              className="group/row grid scroll-mt-[calc(var(--nav-h)+6rem)] gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8"
            >
              <div className="flex items-baseline justify-between gap-4 lg:flex-col lg:justify-start lg:gap-2.5">
                <div>
                  <h3
                    data-jc-row-title
                    tabIndex={-1}
                    className="text-[length:clamp(1.5rem,2.2vw,2rem)] leading-[1.05] font-semibold tracking-[-0.02em] outline-none transition-colors duration-[350ms] ease-power3 group-data-[highlight]/row:text-(--jc-accent)"
                  >
                    {juniorSectionName(team.name)}
                  </h3>
                  {/* Highlight after a pill click: an accent bar grows under the name. */}
                  <span
                    aria-hidden="true"
                    className="mt-2 block h-0.5 w-10 origin-left scale-x-0 rounded-pill bg-(--jc-accent) transition-transform duration-[600ms] ease-expo group-data-[highlight]/row:scale-x-100"
                  />
                </div>
                <MonoLabel>{members.length} {members.length === 1 ? "Member" : "Members"}</MonoLabel>
              </div>
              <TeamAccordion team={juniorSectionName(team.name)} members={members} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

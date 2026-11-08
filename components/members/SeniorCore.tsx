import { seniorLayout, SENIOR_CORE_TERM } from "@/lib/members";
import type { Member, Settings } from "@/lib/types";
import { SeniorCoreTrack } from "./SeniorCoreTrack";
import { ClosingSpread, IntroSpread, MemberSpread } from "./SeniorSpreads";

/**
 * Senior Core, the top of /members (DESIGN.md §13): an editorial run of
 * full-screen spreads, set in Bodoni Moda (the only place it is used).
 * Intro, one spread per senior (layouts A–D by position), then a closing
 * spread that hands off to Junior Core below. SeniorCoreTrack makes it
 * horizontal on md+ with motion; otherwise the spreads stack.
 */
export function SeniorCore({ members, settings }: { members: Member[]; settings: Settings }) {
  const labels = ["The Senior Core", ...members.map((m) => m.full_name), "Want a seat at this table?"];
  const count = labels.length;
  const nav = (index: number) => ({
    index,
    count,
    prev: labels[index - 1] ?? "",
    next: labels[index + 1] ?? "",
  });

  return (
    <section id="senior-core" aria-labelledby="senior-core-title" className="relative bg-bg">
      <SeniorCoreTrack labels={labels}>
        <IntroSpread
          term={SENIOR_CORE_TERM.label}
          badgeItems={[settings.club_name, "Senior Core", String(SENIOR_CORE_TERM.year)]}
          count={members.length}
          nav={nav(0)}
        />
        {members.map((member, i) => (
          <MemberSpread
            key={member.id}
            member={member}
            layout={seniorLayout(member, i)}
            n={i + 1}
            total={members.length}
            nav={nav(i + 1)}
          />
        ))}
        <ClosingSpread
          joinHref={settings.join_form_url ?? "/join"}
          recruiting={settings.recruitment_open}
          term={SENIOR_CORE_TERM.label}
          nav={nav(count - 1)}
        />
      </SeniorCoreTrack>
    </section>
  );
}

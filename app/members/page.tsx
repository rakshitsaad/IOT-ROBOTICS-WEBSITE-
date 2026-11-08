import type { Metadata } from "next";
import { JuniorCore, SeniorCore } from "@/components/members/MemberSections";
import { JoinCta } from "@/components/shared/JoinCta";
import { Button, FactList, PageHeader } from "@/components/ui";
import { getJuniorCoreByTeam, getMembers, getSeniorCore, getSettings } from "@/lib/data";
import { SENIOR_CORE_TERM } from "@/lib/members";

export const metadata: Metadata = {
  title: "Team",
  description: "The Senior Core and Junior Core of the club, team by team.",
};

/** /members, labelled "Team" in the navigation (DESIGN.md §13). */
export default async function MembersPage() {
  const [settings, seniors, juniorTeams, members] = await Promise.all([getSettings(), getSeniorCore(), getJuniorCoreByTeam(), getMembers()]);
  const juniors = juniorTeams.reduce((n, t) => n + t.members.length, 0);

  return (
    <>
      <PageHeader
        label={`Team · ${SENIOR_CORE_TERM.label}`}
        title="The people behind the builds."
        intro={`${settings.club_name} is run by students: a Senior Core that leads the club, and a Junior Core organised into ${juniorTeams.length} teams.`}
        aside={
          <FactList
            items={[
              { label: "Members", value: members.length },
              { label: "Senior Core", value: seniors.length },
              { label: "Junior Core", value: juniors },
              { label: "Teams", value: juniorTeams.length },
            ]}
          />
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button href="#senior-core" variant="secondary" size="sm">
            Senior Core
          </Button>
          <Button href="#junior-core" variant="secondary" size="sm">
            Junior Core
          </Button>
        </div>
      </PageHeader>
      <SeniorCore members={seniors} term={SENIOR_CORE_TERM.label} />
      <JuniorCore teams={juniorTeams} />
      <JoinCta settings={settings} />
    </>
  );
}

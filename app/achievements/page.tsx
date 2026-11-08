import type { Metadata } from "next";
import { Suspense } from "react";
import { AchievementsArchive, AchievementsArchiveWithParams } from "@/components/achievements/AchievementsArchive";
import { FactList, PageHeader } from "@/components/ui";
import { isWin } from "@/lib/achievements";
import { getAchievements } from "@/lib/data";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Competitions won, papers published and grants awarded by the club's teams.",
};

/** /achievements (DESIGN.md §19): the record, grouped by year. */
export default async function AchievementsPage() {
  const items = await getAchievements();
  return (
    <>
      <PageHeader
        label="Achievements"
        title="Results, on the record."
        intro="Competitions won, papers published and grants awarded by the club's teams, with the event, the place and the people behind each one."
        aside={
          <FactList
            items={[
              { label: "Entries", value: items.length },
              { label: "Wins", value: items.filter((a) => isWin(a.result)).length },
              { label: "Competitions", value: items.filter((a) => a.category === "competition").length },
              { label: "Research", value: items.filter((a) => a.category === "research").length },
            ]}
          />
        }
      />
      <Suspense fallback={<AchievementsArchive items={items} />}>
        <AchievementsArchiveWithParams items={items} />
      </Suspense>
    </>
  );
}

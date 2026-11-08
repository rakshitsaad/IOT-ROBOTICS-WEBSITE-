import type { Metadata } from "next";
import { AchievementsExperience } from "@/components/achievements/AchievementsExperience";
import { GridBackground } from "@/components/ui";
import { getAchievements } from "@/lib/data";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Competitions won, papers published and grants awarded by the club's teams.",
};

/** /achievements (DESIGN.md §19): the full-screen card-expansion slider and the "All achievements" list. */
export default async function AchievementsPage() {
  const items = await getAchievements();
  return (
    <>
      <GridBackground />
      <AchievementsExperience items={items} />
    </>
  );
}

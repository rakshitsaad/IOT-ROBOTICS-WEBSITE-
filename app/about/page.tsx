import type { Metadata } from "next";
import { AboutReveals } from "@/components/about/AboutReveals";
import { History, Pillars, Purpose, TeamsOverview } from "@/components/about/AboutSections";
import { AboutIntro } from "@/components/about/AboutIntro";
import { getMilestones, getTeams } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Who we are, what we build and how the club got here.",
};

export default async function AboutPage() {
  const [teams, milestones] = await Promise.all([getTeams(), getMilestones()]);

  return (
    <>
      {/* Section 1: the robot hand, pinned on md+ (DESIGN.md §15). */}
      <AboutIntro />
      <AboutReveals>
        <Purpose />
        <Pillars />
        <History milestones={milestones} />
        <TeamsOverview teams={teams} />
      </AboutReveals>
    </>
  );
}

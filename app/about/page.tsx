import type { Metadata } from "next";
import { AboutReveals } from "@/components/about/AboutReveals";
import { History, Pillars, Purpose, TeamsOverview } from "@/components/about/AboutSections";
import { AboutIntro } from "@/components/about/AboutIntro";
import { ArmStage } from "@/components/arm/ArmStage";
import { getMilestones, getTeams } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Who we are, what we build and how the club got here.",
};

export default async function AboutPage() {
  const [teams, milestones] = await Promise.all([getTeams(), getMilestones()]);

  return (
    <>
      {/* The industrial arm: one fixed layer behind the whole page, hero to footer (DESIGN.md §22). */}
      <ArmStage />
      {/* Section 1: "About us" and the heading, pinned on md+ while the arm reaches in (DESIGN.md §15). */}
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

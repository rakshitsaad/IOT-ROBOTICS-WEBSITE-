import type { Metadata } from "next";
import { GridBackground } from "@/components/ui";
import { AboutReveals } from "@/components/about/AboutReveals";
import { History, Pillars, Purpose, TeamsOverview } from "@/components/about/AboutSections";
import { HandsSection } from "@/components/about/HandsSection";
import { getMilestones, getSettings, getTeams } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Who we are, what we build and how the club got here.",
};

export default async function AboutPage() {
  const [settings, teams, milestones] = await Promise.all([getSettings(), getTeams(), getMilestones()]);

  return (
    <>
      <GridBackground />
      {/* Section 1: the pinned hands sequence (DESIGN.md §15). */}
      <HandsSection clubName={settings.club_name} />
      <AboutReveals>
        <Purpose />
        <Pillars />
        <History milestones={milestones} />
        <TeamsOverview teams={teams} />
      </AboutReveals>
    </>
  );
}

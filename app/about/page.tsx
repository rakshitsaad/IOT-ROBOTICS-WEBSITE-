import type { Metadata } from "next";
import { History, PhotoSet, Practice, Purpose, Story, TeamsOverview } from "@/components/about/AboutSections";
import { FocusAreas } from "@/components/shared/FocusAreas";
import { JoinCta } from "@/components/shared/JoinCta";
import { FactList, PageHeader } from "@/components/ui";
import { getGalleryHighlights, getHomeStats, getMilestones, getProjects, getSettings, getTeams } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Who we are, what we build and how the club got here.",
};

/** /about (DESIGN.md §15): the club's story, purpose, practice, history, focus areas, photos and teams. */
export default async function AboutPage() {
  const [settings, teams, milestones, projects, stats, photos] = await Promise.all([
    getSettings(),
    getTeams(),
    getMilestones(),
    getProjects(),
    getHomeStats(),
    getGalleryHighlights(6),
  ]);

  return (
    <>
      <PageHeader
        label={`About ${settings.club_name}`}
        title="Built by students, for the real world."
        intro={`We design, solder, code and fly the things we imagine. ${settings.club_name} is ${settings.college_name}'s student club for robotics, embedded systems, drones and the research behind them.`}
        aside={
          <FactList
            items={[
              ...(settings.founded_year ? [{ label: "Founded", value: settings.founded_year }] : []),
              { label: "Teams", value: teams.length },
              { label: "Members", value: stats.members },
              { label: "Projects", value: stats.projects },
            ]}
          />
        }
      />
      <Story photo={photos[0] ?? null} />
      <Purpose />
      <Practice />
      <History milestones={milestones} />
      <FocusAreas projects={projects} index={5} titleId="about-areas-title" />
      <PhotoSet photos={photos.slice(1)} />
      <TeamsOverview teams={teams} />
      <JoinCta settings={settings} />
    </>
  );
}

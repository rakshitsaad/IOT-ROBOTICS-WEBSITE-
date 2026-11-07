import { GridBackground } from "@/components/ui";
import { Featured } from "@/components/home/Featured";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeRobot } from "@/components/home/HomeRobot";
import { HomeScroll } from "@/components/home/HomeScroll";
import { JoinCard } from "@/components/home/JoinCard";
import { Lab } from "@/components/home/Lab";
import { MissionControl } from "@/components/home/MissionControl";
import { Numbers } from "@/components/home/Numbers";
import { Statement } from "@/components/home/Statement";
import { UpcomingEvent } from "@/components/home/UpcomingEvent";
import { getFeaturedProjects, getHomeStats, getMissionStats, getProjects, getSettings, getUpcomingEvent } from "@/lib/data";

export default async function HomePage() {
  const [settings, projects, featured, event, stats, mission] = await Promise.all([
    getSettings(),
    getProjects(),
    getFeaturedProjects(),
    getUpcomingEvent(),
    getHomeStats(),
    getMissionStats(),
  ]);

  return (
    <>
      <GridBackground />

      {/* One scroll sequence (DESIGN.md §12): the robot travels through every section below. */}
      <HomeScroll>
        <HomeHero settings={settings} />
        <HomeRobot />
        <Statement clubName={settings.club_name} />
        <Lab projects={projects} />
        <MissionControl stats={mission} />
        <Featured projects={featured} />
        {event && <UpcomingEvent event={event} />}
        <Numbers stats={stats} />
        <JoinCard settings={settings} />
      </HomeScroll>
    </>
  );
}

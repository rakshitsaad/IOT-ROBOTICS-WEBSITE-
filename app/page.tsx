import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { HomeAchievements } from "@/components/home/HomeAchievements";
import { HomeEvents } from "@/components/home/HomeEvents";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeIntro } from "@/components/home/HomeIntro";
import { FocusAreas } from "@/components/shared/FocusAreas";
import { JoinCta } from "@/components/shared/JoinCta";
import {
  getAchievements,
  getEvents,
  getFeaturedProjects,
  getGalleryHighlights,
  getHomeStats,
  getProjects,
  getSettings,
  getUpcomingEvent,
} from "@/lib/data";

/** Home (DESIGN.md §12): what the club is, what it works on, what it has built, what's next, and how to join. */
export default async function HomePage() {
  const [settings, projects, featured, next, events, achievements, stats, photos] = await Promise.all([
    getSettings(),
    getProjects(),
    getFeaturedProjects(),
    getUpcomingEvent(),
    getEvents(),
    getAchievements(),
    getHomeStats(),
    getGalleryHighlights(1),
  ]);

  return (
    <>
      <HomeHero settings={settings} stats={stats} />
      <HomeIntro tagline={settings.tagline} photo={photos[0] ?? null} />
      <FocusAreas projects={projects} index={2} />
      <FeaturedProjects projects={featured} index={3} />
      <HomeEvents next={next} events={events} index={4} />
      <HomeAchievements items={achievements.slice(0, 4)} index={5} />
      <JoinCta settings={settings} index={6} />
    </>
  );
}

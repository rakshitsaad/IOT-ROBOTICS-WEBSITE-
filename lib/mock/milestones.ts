import type { Milestone } from "@/lib/types";

/**
 * Placeholder history for the /about timeline. The years and lines are
 * stand-ins (the founding year matches the placeholder settings.founded_year);
 * replace them with the club's real story.
 */
const rows: [year: number, title: string, description: string][] = [
  [2019, "The club is founded", "A handful of students, one borrowed soldering station and a lot of ideas."],
  [2020, "Builds go remote", "Kits shipped to hostels and homes for our first online IoT bootcamp."],
  [2022, "First drone in the air", "A scratch-built quadcopter holds a steady hover over the campus lawns."],
  [2023, "A research division", "A team to read, test and write up what the club builds."],
  [2025, "Tech Expo 2025", "Our first public showcase: forty student builds on one floor."],
  [2026, "Hack the Hardware", "Twenty-four hours, thirty teams and a lot of solder."],
  [2026, "Seven teams", "Tech, Research, Design, Multimedia, Social Media, Management and PR."],
];

export const milestones: Milestone[] = rows.map(([year, title, description], i) => ({
  id: `70000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  year,
  title,
  description,
  sort_order: i + 1,
  created_at: "2026-11-01T09:00:00+05:30",
}));

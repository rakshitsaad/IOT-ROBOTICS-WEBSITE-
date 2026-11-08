import type { Metadata } from "next";
import { GridBackground } from "@/components/ui";
import { ProjectsIndex } from "@/components/projects/ProjectsIndex";
import { getProjectsWithTeam, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description: "Drones, robots, connected devices and research the club has built.",
};

/** The plain list (phones: carousel; reduced motion: grid). md+ with motion shows the layout's reel. */
export default async function ProjectsPage() {
  const [projects, settings] = await Promise.all([getProjectsWithTeam(), getSettings()]);
  return (
    <>
      <GridBackground />
      <ProjectsIndex projects={projects} clubName={settings.club_name} />
    </>
  );
}

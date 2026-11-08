import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsBrowser, ProjectsBrowserWithParams } from "@/components/projects/ProjectsBrowser";
import { PageHeader } from "@/components/ui";
import { getProjectsWithTeam } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description: "Drones, robots, connected devices and research the club has built.",
};

/** /projects (DESIGN.md §16): the engineering portfolio. */
export default async function ProjectsPage() {
  const projects = await getProjectsWithTeam();
  const years = projects.map((p) => p.year);
  return (
    <>
      <PageHeader
        label="Projects"
        title="An engineering portfolio, built by students."
        intro={`Drones, robots, connected devices and research: ${projects.length} projects from ${Math.min(...years)} to ${Math.max(...years)}, each with the people and the parts behind it.`}
      />
      <Suspense fallback={<ProjectsBrowser projects={projects} filter="All" />}>
        <ProjectsBrowserWithParams projects={projects} />
      </Suspense>
    </>
  );
}

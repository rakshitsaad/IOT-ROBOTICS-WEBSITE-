import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { getProject, getProjectsWithTeam } from "@/lib/data";
import { projectCategory } from "@/lib/projects";

/** Every project is prerendered; a new one renders on its first visit. */
export async function generateStaticParams() {
  return (await getProjectsWithTeam()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.summary };
}

/**
 * A project's page (DESIGN.md §16). The params are read inside <Suspense> (Next 16 instant navigation, DESIGN.md §9);
 * the fallback holds the page's height so the footer never flashes up.
 */
export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-svh" />}>
      <ProjectFromParams params={params} />
    </Suspense>
  );
}

async function ProjectFromParams({ params }: { params: PageProps<"/projects/[slug]">["params"] }) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProject(slug), getProjectsWithTeam()]);
  if (!project) notFound();
  const category = projectCategory(project)?.toLowerCase();
  const related = all.filter((p) => p.id !== project.id && category && p.tags.some((t) => t.toLowerCase() === category)).slice(0, 3);
  return <ProjectDetail project={project} related={related} />;
}

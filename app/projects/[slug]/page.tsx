import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { getProject, getProjectsWithTeam } from "@/lib/data";

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
 * The plain detail page (phones, reduced motion). md+ with motion shows the
 * layout's gallery strip instead. The params are read inside <Suspense>, so a
 * client navigation from the reel never waits on them (instant navigation).
 */
export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <>
      <Suspense fallback={null}>
        <ProjectFromParams params={params} />
      </Suspense>
    </>
  );
}

async function ProjectFromParams({ params }: { params: PageProps<"/projects/[slug]">["params"] }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}

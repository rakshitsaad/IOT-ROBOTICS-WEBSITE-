import { Suspense } from "react";
import { ProjectsStage } from "@/components/projects/ProjectsStage";
import { getProjectsWithTeam, getSettings } from "@/lib/data";

/**
 * /projects and /projects/[slug] share this layout, so the full-screen stage
 * (md+ with motion: the WebGL reel, the gallery strip) stays mounted across
 * the two routes and animates between them (DESIGN.md §16). The pages render
 * the plain versions (phones, reduced motion, no JS, no WebGL); CSS shows
 * one or the other.
 */
export default async function ProjectsLayout({ children }: LayoutProps<"/projects">) {
  const [projects, settings] = await Promise.all([getProjectsWithTeam(), getSettings()]);

  return (
    <>
      {/* Without JS there is no reel: show the plain pages and the footer. */}
      <noscript>
        <style>{`[data-projects-stage]{display:none!important}[data-projects-plain]{display:block!important}#site-footer{display:block!important}[data-projects-carousel]{display:none!important}[data-projects-grid]{display:block!important}`}</style>
      </noscript>
      {/* The stage reads the open project from the URL segment; a slug unknown at build time resolves at request time. */}
      <Suspense fallback={null}>
        <ProjectsStage projects={projects} clubName={settings.club_name} />
      </Suspense>
      <div data-projects-plain className="md:motion-safe:hidden">
        {children}
      </div>
    </>
  );
}

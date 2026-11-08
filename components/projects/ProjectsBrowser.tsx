"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLink, Photo, Tag, TagList } from "@/components/ui";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { cn } from "@/lib/cn";
import { PROJECT_FILTERS, STATUS_LABEL, matchesFilter, parseFilter, projectCategory, projectHref, type ProjectFilter, type ProjectWithTeam } from "@/lib/projects";

/**
 * The /projects index (DESIGN.md §16): category filters kept in `?tag=`, a spotlight on the first featured project
 * (unfiltered view only), then every matching project as a card. The filter reads the query string, so the page wraps
 * this in <Suspense> with the unfiltered list as its fallback (the rest of the page stays prerendered).
 */
export function ProjectsBrowserWithParams({ projects }: { projects: ProjectWithTeam[] }) {
  const filter = parseFilter(useSearchParams().get("tag"));
  return <ProjectsBrowser projects={projects} filter={filter} />;
}

export function ProjectsBrowser({ projects, filter }: { projects: ProjectWithTeam[]; filter: ProjectFilter }) {
  const shown = projects.filter((p) => matchesFilter(p, filter));
  const spotlight = filter === "All" ? projects.find((p) => p.is_featured && p.cover_url) : undefined;
  const grid = spotlight ? shown.filter((p) => p.id !== spotlight.id) : shown;

  const select = (f: ProjectFilter) => {
    const url = new URL(window.location.href);
    if (f === "All") url.searchParams.delete("tag");
    else url.searchParams.set("tag", f.toLowerCase());
    // Next keeps useSearchParams in sync with history.replaceState, without a navigation.
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="shell">
      <div className="flex flex-col gap-4 border-b border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <ul aria-label="Filter by area" className="flex flex-wrap gap-2">
          {PROJECT_FILTERS.map((f) => {
            const count = projects.filter((p) => matchesFilter(p, f)).length;
            const active = f === filter;
            return (
              <li key={f}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => select(f)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-control border px-3.5 text-[13px] font-medium transition-colors duration-300",
                    active ? "border-text bg-text text-bg" : "border-line text-muted hover:border-text/40 hover:text-text",
                  )}
                >
                  {f}
                  <span className={cn("font-mono text-[11px]", active ? "text-bg/60" : "text-faint")}>{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="font-mono text-[12px] text-faint" aria-live="polite">
          {shown.length} {shown.length === 1 ? "project" : "projects"}
        </p>
      </div>

      {spotlight && <Spotlight project={spotlight} />}

      {grid.length > 0 ? (
        <ul className="grid gap-x-8 gap-y-14 py-14 md:grid-cols-2 md:py-16 lg:grid-cols-3">
          {grid.map((p, i) => (
            <li key={p.id}>
              <ProjectCard project={p} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" priority={!spotlight && i < 3} />
            </li>
          ))}
        </ul>
      ) : (
        !spotlight && (
          <div className="py-24 text-center">
            <p className="text-[17px] font-semibold">No {filter.toLowerCase()} projects yet.</p>
            <button type="button" onClick={() => select("All")} className="mt-4 text-[14px] text-muted underline underline-offset-4 hover:text-text">
              Show all projects
            </button>
          </div>
        )
      )}
    </div>
  );
}

/** The featured project, given the width of the page. */
function Spotlight({ project }: { project: ProjectWithTeam }) {
  const category = projectCategory(project);
  return (
    <article className="group/photo relative grid gap-8 border-b border-line py-12 md:py-16 lg:grid-cols-12 lg:items-center lg:gap-8">
      <div className="lg:col-span-7">
        <Photo src={project.cover_url} alt={`${project.title}, cover photo`} sizes="(min-width: 1024px) 58vw, 100vw" ratio="aspect-[16/10]" priority zoom />
      </div>
      <div className="lg:col-span-4 lg:col-start-9">
        <p className="mono-label text-faint">Featured</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          {category && <Tag>{category}</Tag>}
          <span className="font-mono text-[11px] text-faint">
            {project.year} · {STATUS_LABEL[project.status]}
          </span>
        </div>
        <h2 className="type-h2 mt-4">
          <Link href={projectHref(project.slug)} className="after:absolute after:inset-0 after:content-['']">
            {project.title}
          </Link>
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-text/90">{project.summary}</p>
        <p className="type-body mt-3 text-muted">{project.description}</p>
        {project.tech_stack.length > 0 && <TagList items={project.tech_stack} className="mt-6" />}
        <ArrowLink href={projectHref(project.slug)} className="relative mt-8">
          View project
        </ArrowLink>
      </div>
    </article>
  );
}

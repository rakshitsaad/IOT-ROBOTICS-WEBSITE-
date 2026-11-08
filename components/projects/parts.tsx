import type { Ref } from "react";
import { MonoLabel, Pill, PillButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/gallery";
import { PROJECT_FILTERS, type ProjectFilter, type ProjectWithTeam } from "@/lib/projects";

/** Shared /projects pieces (DESIGN.md §16). Server-compatible. */

/** Top-left "[CLUB] / PROJECTS": the page's h1. */
export function ProjectsLabel({ clubName, className }: { clubName: string; className?: string }) {
  return (
    <h1 className={cn("mono-label text-text", className)}>
      <span className="text-muted">[{clubName}]</span> / Projects
    </h1>
  );
}

/** Top-right "[12] BUILDS". */
export function BuildsCount({ count, className }: { count: number; className?: string }) {
  return (
    <p className={cn("mono-label text-muted", className)} aria-live="polite">
      <span className="text-text">[{pad2(count)}]</span> Builds
    </p>
  );
}

/** The tag filter: All, Drones, Robotics, IoT, Research. */
export function ProjectFilters({
  value,
  onChange,
  className,
}: {
  value: ProjectFilter;
  onChange(filter: ProjectFilter): void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Filter projects by tag" className={cn("flex flex-wrap gap-2", className)}>
      {PROJECT_FILTERS.map((filter) => {
        const on = filter === value;
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(filter)}
            data-cursor="link"
            className="rounded-pill"
          >
            <Pill
              color={on ? "white" : "raised"}
              className={cn(
                "block px-3.5 py-2 text-xs leading-none font-semibold transition-colors duration-[350ms] ease-power3",
                !on && "text-muted hover:text-text",
              )}
            >
              {filter}
            </Pill>
          </button>
        );
      })}
    </div>
  );
}

/** Small mono tag pills. */
export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag} className="mono-label rounded-pill border border-text/20 px-2.5 py-1 text-text">
          {tag}
        </li>
      ))}
    </ul>
  );
}

/**
 * The project's info panel (the gallery's bottom-left card; the top of the
 * plain detail page): year and status, title, tags, description, team, and
 * "Source code" only when the project has a repo.
 */
export function ProjectInfo({
  project,
  headingAs: Heading = "h2",
  headingRef,
  className,
}: {
  project: ProjectWithTeam;
  headingAs?: "h1" | "h2";
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}) {
  return (
    <div className={cn("rounded-image bg-bg-2 p-5 ring-1 ring-inset ring-line md:p-6", className)}>
      <MonoLabel>
        {project.year} / {project.status}
      </MonoLabel>
      <Heading
        ref={headingRef}
        tabIndex={-1}
        className="mt-2.5 text-[clamp(1.6rem,2.4vw,2rem)] leading-[1.05] font-bold tracking-[-0.03em] outline-none"
      >
        {project.title}
      </Heading>
      <TagList tags={project.tags} className="mt-3" />
      <p className="mt-4 text-sm leading-relaxed text-muted">{project.description}</p>
      {project.team.length > 0 && (
        <div className="mt-4">
          <MonoLabel as="p">Team</MonoLabel>
          <p className="mt-1.5 text-sm text-text">{project.team.join(", ")}</p>
        </div>
      )}
      {project.repo_url && (
        <PillButton href={project.repo_url} variant="ghost" size="sm" arrow className="mt-5">
          Source code
        </PillButton>
      )}
    </div>
  );
}

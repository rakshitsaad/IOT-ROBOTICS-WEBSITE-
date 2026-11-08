/**
 * /projects config and pure helpers (DESIGN.md §16). Client-safe.
 */
import type { Project, ProjectImage, ProjectStatus } from "./types";

/** A project with its team's names resolved (lib/data.ts → getProjectsWithTeam). */
export interface ProjectWithTeam extends Project {
  team: string[];
}

/* ------------------------------------------------------------- filters */

/** The category filter. A project matches when one of its tags equals the filter (any case). */
export const PROJECT_FILTERS = ["All", "Drones", "Robotics", "IoT", "Research"] as const;
export type ProjectFilter = (typeof PROJECT_FILTERS)[number];

/** `?tag=drones` → "Drones"; anything unknown → "All". */
export function parseFilter(value: string | null | undefined): ProjectFilter {
  const v = value?.toLowerCase();
  return PROJECT_FILTERS.find((f) => f.toLowerCase() === v) ?? "All";
}

export function matchesFilter(project: Pick<Project, "tags">, filter: ProjectFilter): boolean {
  return filter === "All" || project.tags.some((t) => t.toLowerCase() === filter.toLowerCase());
}

/** The project's category: the first of its tags that is a filter ("Robotics"), else its first tag. */
export function projectCategory(project: Pick<Project, "tags">): string | null {
  const domains = PROJECT_FILTERS.slice(1).map((f) => f.toLowerCase());
  return project.tags.find((t) => domains.includes(t.toLowerCase())) ?? project.tags[0] ?? null;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  ongoing: "In progress",
  completed: "Completed",
  prototype: "Prototype",
};

/** The project's photos: the cover first, then its gallery (without repeating the cover). */
export function projectImages(project: Pick<Project, "title" | "cover_url" | "images">): ProjectImage[] {
  const cover: ProjectImage[] = project.cover_url
    ? [{ url: project.cover_url, width: 1600, height: 1000, alt: `${project.title}, cover photo` }]
    : [];
  return [...cover, ...project.images.filter((i) => i.url !== project.cover_url)];
}

/** The address of a project's page. */
export const projectHref = (slug: string) => `/projects/${slug}`;

import Link from "next/link";
import { Photo, Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
import { STATUS_LABEL, projectCategory, projectHref } from "@/lib/projects";
import type { Project } from "@/lib/types";

/**
 * A project in a grid (DESIGN.md §16): the cover at 4:3, category / year / status, the title, the one-line summary and
 * the first few technologies. The whole card is one link to the project page.
 */
export function ProjectCard({ project, sizes, className, priority = false }: { project: Project; sizes: string; className?: string; priority?: boolean }) {
  const category = projectCategory(project);
  return (
    <article className={cn("group/photo relative", className)}>
      <Photo src={project.cover_url} alt={`${project.title}, cover photo`} sizes={sizes} ratio="aspect-[4/3]" zoom priority={priority} />
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        {category && <Tag>{category}</Tag>}
        <span className="font-mono text-[11px] text-faint">
          {project.year} · {STATUS_LABEL[project.status]}
        </span>
      </div>
      <h3 className="type-h3 mt-3">
        <Link href={projectHref(project.slug)} className="after:absolute after:inset-0 after:content-['']">
          {project.title}
        </Link>
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{project.summary}</p>
      {project.tech_stack.length > 0 && (
        <p className="mt-4 font-mono text-[11px] tracking-[0.04em] text-faint">{project.tech_stack.slice(0, 4).join(" / ")}</p>
      )}
    </article>
  );
}

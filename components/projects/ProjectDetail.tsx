import Link from "next/link";
import { MediaGrid } from "@/components/gallery/MediaGrid";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { Button, MonoLabel, Photo, Tag, TagList } from "@/components/ui";
import { STATUS_LABEL, projectCategory, type ProjectWithTeam } from "@/lib/projects";
import type { GalleryItem } from "@/lib/types";

/**
 * /projects/[slug] (DESIGN.md §16): a project page in the shape of a short case study, using only what the data holds.
 * The overview (summary and description) sits beside a fact sheet (year, status, area, team, links); then the
 * hardware and software used, the photos (opening in the lightbox) and more projects from the same area.
 */
export function ProjectDetail({ project, related }: { project: ProjectWithTeam; related: ProjectWithTeam[] }) {
  const category = projectCategory(project);
  const photos: GalleryItem[] = project.images.map((img, i) => ({
    id: `${project.id}-${i}`,
    event_id: project.id,
    type: "photo",
    url: img.url,
    poster_url: null,
    caption: null,
    alt: img.alt,
    width: img.width,
    height: img.height,
    layout_group: null,
    sort_order: i,
    taken_at: null,
    created_at: project.created_at,
  }));

  return (
    <article className="pt-header">
      <div className="shell">
        <nav aria-label="Breadcrumb" className="pt-8 md:pt-12">
          <ol className="flex items-center gap-2 text-[13px] text-faint">
            <li>
              <Link href="/projects" className="transition-colors duration-300 hover:text-text">
                Projects
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-muted">
              {project.title}
            </li>
          </ol>
        </nav>

        <header className="grid gap-8 pt-10 pb-10 md:pt-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {category && <Tag>{category}</Tag>}
              <span className="font-mono text-[11px] text-faint">
                {project.year} · {STATUS_LABEL[project.status]}
              </span>
            </div>
            <h1 className="type-h1 mt-6">{project.title}</h1>
            <p className="type-lead mt-6 max-w-[52ch] text-muted">{project.summary}</p>
          </div>
        </header>

        <Photo src={project.cover_url} alt={`${project.title}, cover photo`} sizes="(min-width: 1400px) 1320px, 100vw" ratio="aspect-[16/9]" priority />

        <div className="grid gap-12 border-b border-line py-14 md:py-20 lg:grid-cols-12 lg:gap-8">
          <section aria-labelledby="overview-title" className="lg:col-span-7">
            <MonoLabel as="h2" id="overview-title">
              Overview
            </MonoLabel>
            <p className="mt-5 text-[clamp(1.125rem,1.6vw,1.375rem)] leading-[1.6] text-text/90">{project.description}</p>

            {project.tech_stack.length > 0 && (
              <div className="mt-12">
                <MonoLabel as="h2">Hardware &amp; software</MonoLabel>
                <TagList items={project.tech_stack} className="mt-4" />
              </div>
            )}
          </section>

          <aside aria-label="Project facts" className="lg:col-span-4 lg:col-start-9">
            <dl className="divide-y divide-line border-y border-line text-[14px]">
              <Fact label="Year">{project.year}</Fact>
              <Fact label="Status">{STATUS_LABEL[project.status]}</Fact>
              {project.tags.length > 0 && <Fact label="Tags">{project.tags.join(", ")}</Fact>}
              {project.team.length > 0 && (
                <Fact label="Team">
                  <ul>
                    {project.team.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </Fact>
              )}
            </dl>
            {(project.repo_url || project.demo_url) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {project.repo_url && (
                  <Button href={project.repo_url} variant="secondary" arrow>
                    Source code
                  </Button>
                )}
                {project.demo_url && (
                  <Button href={project.demo_url} variant="secondary" arrow>
                    Live demo
                  </Button>
                )}
              </div>
            )}
          </aside>
        </div>

        {photos.length > 0 && (
          <section aria-labelledby="photos-title" className="border-b border-line py-14 md:py-20">
            <div className="flex items-baseline justify-between gap-4">
              <MonoLabel as="h2" id="photos-title">
                Photos
              </MonoLabel>
              <span className="font-mono text-[12px] text-faint">{photos.length}</span>
            </div>
            <MediaGrid items={photos} title={project.title} slug={project.slug} layout="grid" className="mt-8" />
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="py-14 md:py-20">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="related-title" className="type-h2">
                More {category ? category.toLowerCase() : ""} projects
              </h2>
              <Link href="/projects" className="text-[14px] font-semibold text-muted transition-colors duration-300 hover:text-text">
                All projects →
              </Link>
            </div>
            <ul className="mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-4 py-4">
      <dt className="mono-label pt-0.5 text-faint">{label}</dt>
      <dd className="text-text/90">{children}</dd>
    </div>
  );
}

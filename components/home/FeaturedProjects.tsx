import Link from "next/link";
import { ArrowLink, Button, Photo, SectionHeader, Tag, TagList } from "@/components/ui";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { STATUS_LABEL, projectCategory, projectHref } from "@/lib/projects";
import type { Project } from "@/lib/types";

/**
 * Home section 03 (DESIGN.md §12): the featured projects. The first is a lead story (a large photo beside its title,
 * summary, description and stack); up to three more follow in a row of cards.
 */
export function FeaturedProjects({ projects, index }: { projects: Project[]; index?: number }) {
  const withCover = projects.filter((p) => p.cover_url);
  const [lead, ...rest] = withCover;
  if (!lead) return null;
  const category = projectCategory(lead);

  return (
    <section aria-labelledby="featured-title" className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={index}
          label="Featured projects"
          titleId="featured-title"
          title="Selected work from the lab."
          action={{ label: "All projects", href: "/projects" }}
        />

        <article data-reveal className="group/photo relative mt-12 grid gap-8 md:mt-16 lg:grid-cols-12 lg:items-center lg:gap-8">
          <Link href={projectHref(lead.slug)} tabIndex={-1} aria-hidden="true" className="lg:col-span-7">
            <Photo src={lead.cover_url} alt="" sizes="(min-width: 1024px) 58vw, 100vw" ratio="aspect-[16/10]" zoom />
          </Link>
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {category && <Tag>{category}</Tag>}
              <span className="font-mono text-[11px] text-faint">
                {lead.year} · {STATUS_LABEL[lead.status]}
              </span>
            </div>
            <h3 className="mt-4 text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.1] font-semibold tracking-[-0.028em]">{lead.title}</h3>
            <p className="mt-4 text-[17px] leading-relaxed text-text/90">{lead.summary}</p>
            <p className="type-body mt-4 text-muted">{lead.description}</p>
            {lead.tech_stack.length > 0 && (
              <div className="mt-6">
                <p className="mono-label text-faint">Built with</p>
                <TagList items={lead.tech_stack} className="mt-3" />
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button href={projectHref(lead.slug)} variant="secondary" arrow>
                View project
              </Button>
              {lead.repo_url && <ArrowLink href={lead.repo_url}>Source code</ArrowLink>}
            </div>
          </div>
        </article>

        {rest.length > 0 && (
          <ul className="mt-16 grid gap-x-8 gap-y-14 border-t border-line pt-12 md:mt-20 md:grid-cols-2 lg:grid-cols-3">
            {rest.slice(0, 3).map((p, i) => (
              <li key={p.id} data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
                <ProjectCard project={p} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

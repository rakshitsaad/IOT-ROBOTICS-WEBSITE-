import Link from "next/link";
import { Photo, SectionHeader } from "@/components/ui";
import { LAB_STATIONS, stationHref, stationProjects } from "@/lib/home";
import type { Project } from "@/lib/types";

/**
 * The four focus areas as an editorial index (DESIGN.md §12): one row per area with its number, name, project count,
 * a sentence and a photo from one of its projects. Each row links to /projects filtered to that area. Used on the home
 * page and /about.
 */
export function FocusAreas({ projects, index, titleId = "areas-title" }: { projects: Project[]; index?: number; titleId?: string }) {
  return (
    <section aria-labelledby={titleId} className="section-y border-t border-line">
      <div className="shell">
        <SectionHeader
          index={index}
          label="Focus areas"
          titleId={titleId}
          title="Four disciplines, one workbench."
          intro="Every project the club builds belongs to one of these areas. Pick one to see what we have made in it."
        />

        <ol className="mt-12 border-b border-line md:mt-16">
          {LAB_STATIONS.map((station, i) => {
            const own = projects.filter((p) => p.tags.some((t) => t.toLowerCase() === station.domain));
            const photo = stationProjects(projects, station, 1)[0];
            return (
              <li key={station.domain} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties} className="border-t border-line">
                <Link
                  href={stationHref(station)}
                  className="group/photo grid gap-x-8 gap-y-4 py-7 transition-colors duration-300 md:grid-cols-12 md:items-center md:py-8"
                >
                  <span className="font-mono text-[12px] text-faint md:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                  <span className="md:col-span-4">
                    <span className="type-h3 flex items-center gap-3">
                      {station.title}
                      <span aria-hidden="true" className="text-faint transition-[transform,color] duration-300 ease-power3 group-hover/photo:translate-x-1 group-hover/photo:text-red">
                        →
                      </span>
                    </span>
                    <span className="mono-label mt-2 block text-faint">
                      {own.length} {own.length === 1 ? "project" : "projects"}
                    </span>
                  </span>
                  <span className="type-body max-w-[46ch] text-muted md:col-span-4">{station.description}</span>
                  <span className="hidden md:col-span-3 md:block">
                    <Photo
                      src={photo?.cover_url}
                      alt={photo ? `${photo.title}, a ${station.short.toLowerCase()} project` : `${station.title}: no photo yet`}
                      sizes="(min-width: 1280px) 300px, 22vw"
                      ratio="aspect-[16/10]"
                      zoom
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MonoLabel } from "@/components/ui";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  filterFromLocation,
  filterProjects,
  projectHref,
  writeFilterToLocation,
  type ProjectFilter,
  type ProjectWithTeam,
} from "@/lib/projects";
import { ReelTitle } from "./ReelTitle";
import { BuildsCount, ProjectFilters, ProjectsLabel, TagList } from "./parts";

/**
 * /projects for phones and reduced motion (DESIGN.md §16); md+ with motion
 * gets the WebGL stage instead (CSS decides, so nothing flashes).
 *
 * - Phones with motion: a horizontal scroll-snap carousel of covers, each
 *   card turned slightly in 3D towards the centre, with the centred card's
 *   title below it.
 * - Reduced motion (any width), no JS, or no WebGL: a plain grid of cards.
 * Both link to /projects/[slug].
 */
export function ProjectsIndex({ projects, clubName }: { projects: ProjectWithTeam[]; clubName: string }) {
  const [filter, setFilter] = useState<ProjectFilter>("All");
  const list = filterProjects(projects, filter);

  // ?tag=Drones (the home lab links here with one). Read after hydration so the page stays static.
  useEffect(() => {
    const f = filterFromLocation();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the address bar once
    if (f !== "All") setFilter(f);
  }, []);

  const change = (f: ProjectFilter) => {
    setFilter(f);
    writeFilterToLocation(f);
  };

  return (
    <section className="pt-header pb-16">
      <div className="shell flex items-start justify-between gap-4 pt-6">
        <ProjectsLabel clubName={clubName} />
        <BuildsCount count={list.length} />
      </div>
      <ProjectFilters value={filter} onChange={change} className="shell mt-4" />

      <div data-projects-carousel className="motion-reduce:hidden">
        {list.length > 0 && <Carousel key={filter} list={list} />}
      </div>
      <div data-projects-grid className="shell motion-safe:hidden">
        <ProjectGrid list={list} />
      </div>
    </section>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function Carousel({ list }: { list: ProjectWithTeam[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  // Turn each card towards the centre by how far it is from it, and track the centred one.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const centre = box.left + box.width / 2;
      let best = 0;
      let bestD = Infinity;
      cards.current.forEach((card, i) => {
        if (!card) return;
        const r = card.getBoundingClientRect();
        const off = (r.left + r.width / 2 - centre) / r.width;
        if (Math.abs(off) < bestD) {
          bestD = Math.abs(off);
          best = i;
        }
        const inner = card.firstElementChild as HTMLElement | null;
        if (inner) {
          inner.style.transform = prefersReducedMotion()
            ? ""
            : `rotateY(${clamp(-off * 16, -26, 26).toFixed(2)}deg) scale(${(1 - Math.min(Math.abs(off), 1) * 0.06).toFixed(3)})`;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [list, reduced]);

  const project = list[active] ?? list[0];

  return (
    <>
      <div className="relative mt-7 h-[min(97.5vw,58svh)]">
        <div
          ref={scroller}
          data-lenis-prevent
          className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[11vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {list.map((p, i) => (
            <div
              key={p.id}
              ref={(node) => {
                cards.current[i] = node;
              }}
              className="h-full w-[78vw] shrink-0 snap-center [perspective:900px]"
            >
              <Link
                href={projectHref(p.slug)}
                draggable={false}
                data-cursor="view"
                className="relative block size-full overflow-hidden rounded-image bg-bg-2 will-change-transform"
              >
                {/* The carousel shows only on phones with motion: elsewhere a 1px size keeps the
                    eager first cards (the page's largest images) down to 16px thumbnails. */}
                <Image
                  src={p.cover_url!}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 1px, (prefers-reduced-motion: reduce) 1px, 78vw"
                  loading={i < 2 ? "eager" : undefined}
                  draggable={false}
                  className="object-cover"
                />
                <span className="sr-only">{p.title}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
      {project && (
        <ReelTitle
          title={project.title}
          animate={!reduced}
          className="shell mt-5 [--title-fit:calc(100vw-2*var(--gutter))] [--title-max:clamp(1.8rem,9vw,2.6rem)]"
        />
      )}

      {project && (
        <div className="shell mt-4 flex items-start justify-between gap-6">
          <p className="mono-label shrink-0 text-muted" aria-live="polite">
            <span className="text-text">{active + 1}</span> / {list.length}
            <span className="sr-only">: {project.title}</span>
          </p>
          <p className="max-w-[30ch] text-right text-sm leading-snug text-muted">{project.summary}</p>
        </div>
      )}
    </>
  );
}

function ProjectGrid({ list }: { list: ProjectWithTeam[] }) {
  return (
    <ul className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((p) => (
        <li key={p.id}>
          <Link href={projectHref(p.slug)} data-cursor="view" className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-image bg-bg-2">
              <Image
                src={p.cover_url!}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-[-0.01em] underline-offset-4 group-hover:underline">{p.title}</h2>
              <MonoLabel>{p.year}</MonoLabel>
            </div>
            <TagList tags={p.tags} className="mt-2.5" />
            <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.summary}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

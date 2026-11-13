import Image from "next/image";
import type { CSSProperties } from "react";
import { MonoLabel, PillButton } from "@/components/ui";
import { BotHeadIcon } from "@/components/robot/BotHeadIcon";
import { cn } from "@/lib/cn";
import {
  LAB_DEPTHS,
  LAB_PAN,
  LAB_STATIONS,
  stationHref,
  stationProjects,
  type LabDepth,
} from "@/lib/home";
import type { Project } from "@/lib/types";
import { LabCard, LabCounter, type LabPanelStation } from "./LabPanel";

/**
 * Section C, "Inside the lab" (DESIGN.md §12).
 *
 * md+ with motion: the section is (stations + 1) screens tall and two sticky
 * layers hold for one screen per station:
 * - [data-lab-photos]: each station's photos at three depths
 *   ([data-lab-layer]); HomeScroll pans the layers between stations;
 * - [data-lab-ui] (z-35, above the robot's stage): heading, counter, card.
 * The robot (z-30) sits between them, in front of the photos.
 *
 * Phones and reduced motion: four stacked blocks (photos, then the card), no
 * pinning, with a flat robot head showing each station's icon.
 */

interface Frame {
  /** Frame width (viewport widths) and aspect ratio class. */
  w: number;
  aspect: string;
  className?: string;
  /** Rest position per station (cycled): left and top in % of the screen. */
  spots: { x: number; y: number }[];
}

const FRAMES: Record<LabDepth, Frame> = {
  back: {
    w: 15,
    aspect: "aspect-[4/3]",
    className: "opacity-40",
    spots: [
      { x: 30, y: 15 },
      { x: 27, y: 60 },
      { x: 33, y: 17 },
      { x: 26, y: 58 },
    ],
  },
  mid: {
    w: 21,
    aspect: "aspect-[4/3]",
    className: "opacity-80",
    spots: [
      { x: 5, y: 50 },
      { x: 8, y: 45 },
      { x: 4, y: 52 },
      { x: 7, y: 47 },
    ],
  },
  front: {
    w: 18.5,
    aspect: "aspect-[4/5]",
    spots: [
      { x: 74, y: 19 },
      { x: 76, y: 22 },
      { x: 73, y: 18 },
      { x: 75.5, y: 21 },
    ],
  },
};

/** Which photo goes to which depth: the first project is the biggest, nearest one. */
const DEPTH_ORDER: LabDepth[] = ["front", "mid", "back"];

export function Lab({ projects }: { projects: Project[] }) {
  const stations = LAB_STATIONS.map((station) => ({
    station,
    projects: stationProjects(projects, station),
  }));
  const panel: LabPanelStation[] = LAB_STATIONS.map((s) => ({
    title: s.title,
    short: s.short,
    description: s.description,
    href: stationHref(s),
    accent: s.accent,
  }));

  return (
    <section
      data-lab
      aria-label="What we build inside the lab"
      className="relative md:motion-safe:h-(--lab-h)"
      style={{ "--lab-h": `${(LAB_STATIONS.length + 1) * 100}svh` } as CSSProperties}
    >
      {/* md+ with motion: pinned workbench */}
      <div className="hidden h-full md:motion-safe:block">
        <div data-lab-photos className="sticky top-0 h-svh overflow-hidden">
          {DEPTH_ORDER.map((depth) => {
            const frame = FRAMES[depth];
            // Layer widths between stations (in %, which HomeScroll pans with xPercent).
            const stride = LAB_PAN * LAB_DEPTHS[depth] * 100;
            return (
              <div key={depth} data-lab-layer={depth} className="absolute inset-0 will-change-transform">
                {stations.map(({ projects: list }, i) => {
                  const project = list[DEPTH_ORDER.indexOf(depth)];
                  if (!project?.cover_url) return null;
                  const spot = frame.spots[i % frame.spots.length];
                  return (
                    <figure
                      // A project tagged with two domains appears at both stations.
                      key={`${i}-${project.id}`}
                      className={cn("absolute", frame.className)}
                      style={{ left: `${i * stride + spot.x}%`, top: `${spot.y}%`, width: `${frame.w}vw` }}
                    >
                      <div className={cn("relative overflow-hidden rounded-image bg-bg-2 ring-1 ring-line", frame.aspect)}>
                        <Image
                          src={project.cover_url}
                          alt={project.title}
                          fill
                          sizes={`${Math.ceil(frame.w)}vw`}
                          className="object-cover"
                        />
                      </div>
                      {depth !== "back" && (
                        <figcaption className="mono-label mt-2.5 text-muted">
                          {project.title} / {project.year}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div data-lab-ui className="pointer-events-none sticky top-0 z-[35] -mt-[100svh] h-svh">
          <div className="shell relative h-full pt-header">
            <div data-lab-top className="flex items-start justify-between gap-8 pt-6 md:pt-8">
              <LabHeading />
              <LabCounter stations={panel} />
            </div>
            <div
              data-lab-card
              className="pointer-events-auto absolute right-(--gutter) bottom-(--gutter) w-[min(360px,calc(100%-2*var(--gutter)))]"
            >
              <LabCard stations={panel} />
            </div>
          </div>
        </div>
      </div>

      {/* Phones and reduced motion: stacked stations */}
      <div className="shell py-20 md:py-28 md:motion-safe:hidden">
        <LabHeading />
        <ol className="mt-12 space-y-16 md:mt-16 md:space-y-24">
          {stations.map(({ station, projects: list }) => (
            <li key={station.domain} className="md:grid md:grid-cols-12 md:items-end md:gap-8">
              <div className="grid grid-cols-2 gap-3 md:col-span-7">
                {list.map((project, j) => (
                  <div
                    key={project.id}
                    className={cn(
                      "relative overflow-hidden rounded-image bg-bg-2 ring-1 ring-line",
                      j === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/3]",
                      j === 1 && list.length === 2 && "col-span-2 aspect-[16/10]",
                    )}
                  >
                    {project.cover_url && (
                      <Image
                        src={project.cover_url}
                        alt={project.title}
                        fill
                        sizes={j === 0 ? "(min-width: 768px) 55vw, 92vw" : "(min-width: 768px) 28vw, 46vw"}
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-card border border-line bg-bg-2 p-6 md:col-span-5 md:mt-0 md:p-8">
                <MonoLabel tone={station.accent}>
                  {station.short}
                </MonoLabel>
                <div className="mt-4 flex items-center gap-3.5">
                  <BotHeadIcon icon={station.icon} className="size-10" />
                  <h3 className="text-[1.35rem] leading-tight font-semibold tracking-[-0.01em]">{station.title}</h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{station.description}</p>
                <PillButton href={stationHref(station)} variant="ghost" size="sm" arrow className="mt-5">
                  See projects
                </PillButton>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LabHeading() {
  return (
    <h2 className="text-[length:clamp(1.9rem,3.3vw,3.4rem)] leading-[1.14] font-semibold tracking-[-0.02em]">
      <span className="block">What we build</span>
      <span className="serif-accent block leading-[1.05]">inside the lab</span>
    </h2>
  );
}

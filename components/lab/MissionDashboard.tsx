"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { MonoLabel } from "@/components/ui";
import { droneActions, useDroneStore } from "@/components/drone";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE } from "@/lib/motion";
import { MISSION, type MissionCardId, type MissionStats } from "@/lib/mission";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { Countdown } from "@/components/home/Countdown";

/**
 * The drone test bench's dashboard (/lab/drone, DESIGN.md §18): six cards of club stats in HTML/CSS, with small SVG
 * charts, for the drone to fly to and scan.
 * The drone (a canvas layered above) scans them: the scanned card lifts in 3D (translateZ 40px, rotateX 8deg),
 * gets a red border, and its numbers and charts re-count from 0.
 *
 * Layout: phones 2 per row (3 rows); md 3 per row; lg a 12-column grid (5/4/3 over 6/3/3). The grid has the
 * perspective, each card wrapper (`data-mc-card`) keeps its box still (the drone maps to it) and the article lifts.
 */

const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const DATE_LONG = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Kolkata",
});

export function MissionDashboard({ stats, className }: { stats: MissionStats; className?: string }) {
  const { members, projects, events, next, workshops, competitions } = stats;
  return (
    <div
      className={cn(
        "grid min-h-0 grid-cols-2 gap-2.5 [perspective:1200px] md:grid-cols-3 md:gap-3 lg:grid-cols-12 lg:gap-4",
        className,
      )}
    >
      <Card id="members" label="Members" className="lg:col-span-5">
        <Big card="members" value={members.total} />
        <p className="text-muted">
          Joined since {members.growth[0]?.year ?? "—"}
        </p>
        <GrowthChart card="members" growth={members.growth} />
      </Card>

      <Card id="projects" label="Projects built" className="lg:col-span-4">
        <Big card="projects" value={projects.total} />
        <DomainBars card="projects" domains={projects.domains} />
      </Card>

      <Card id="events" label={`Events in ${events.year}`} className="lg:col-span-3">
        <Big card="events" value={events.total} />
        <p className="text-muted">
          {events.done} done · {events.upcoming} coming
        </p>
        <Dots done={events.done} total={events.total} />
      </Card>

      <Card id="next" label="Next event" className="lg:col-span-6">
        {next ? (
          <>
            <p className="text-[length:clamp(1rem,2.6svh,1.6rem)] leading-tight font-semibold tracking-[-0.02em]">
              {next.title}
            </p>
            <p className="mono-label text-muted">
              {DATE_LONG.format(new Date(next.starts_at))} IST · {next.venue}
            </p>
            <Countdown to={next.starts_at} className="mt-auto [&_.mono-label]:text-[10px] md:[&_.mono-label]:text-[11px]" />
          </>
        ) : (
          <p className="text-muted">Nothing scheduled yet.</p>
        )}
      </Card>

      <Card id="workshops" label="Workshops run" className="lg:col-span-3">
        <Big card="workshops" value={workshops.run} />
        <p className="text-muted">
          {workshops.next ? `Next: ${workshops.next.title}, ${DATE.format(new Date(workshops.next.starts_at))}` : "More soon"}
        </p>
      </Card>

      <Card id="competitions" label="Competitions won" className="lg:col-span-3">
        <Big card="competitions" value={competitions.won} />
        <p className="text-muted">
          {competitions.latest ? `Latest: ${competitions.latest.position}, ${competitions.latest.event}` : "Podium finishes"}
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ card */

function Card({ id, label, className, children }: { id: MissionCardId; label: string; className?: string; children: ReactNode }) {
  const scanning = useDroneStore((s) => s.scanning === id);

  // Mouse: hovering a card sends the drone to scan it (during free flight). Touch: a tap does.
  const enter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") droneActions.hoverCard(id);
  };
  const leave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") droneActions.leaveCard(MISSION.linger);
  };
  const tap = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") droneActions.tapCard(id, 3500);
  };

  return (
    <div
      data-mc-card={id}
      data-scanning={scanning || undefined}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onPointerUp={tap}
      className={cn("group/mc min-h-0 [transform-style:preserve-3d]", className)}
    >
      <article
        className={cn(
          "flex h-full min-h-0 flex-col gap-[clamp(0.25rem,0.9svh,0.6rem)] overflow-hidden rounded-image border border-line bg-bg-2 p-[clamp(0.75rem,1.9svh,1.5rem)] text-[12px] md:rounded-card md:text-[13px]",
          "origin-bottom transition-[transform,border-color,box-shadow] duration-[600ms] ease-expo",
          "group-data-[scanning]/mc:[transform:translateZ(40px)_rotateX(8deg)] group-data-[scanning]/mc:border-red",
          "group-data-[scanning]/mc:shadow-[0_0_0_1px_var(--red),0_0_32px_-8px_color-mix(in_oklab,var(--red)_55%,transparent),0_24px_48px_-24px_black]",
        )}
      >
        <MonoLabel as="h3" className="shrink-0 text-[10px] md:text-[11px] lg:text-[12px]">
          {label}
        </MonoLabel>
        {children}
      </article>
    </div>
  );
}

/** A big number that counts up from 0 each time its card is scanned (final value in the HTML). */
function Big({ card, value }: { card: MissionCardId; value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const key = useDroneStore((s) => s.scanKeys[card] ?? 0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !key || prefersReducedMotion()) return;
    const c = { v: 0 };
    const tween = gsap.to(c, {
      v: value,
      duration: DURATION.slow,
      ease: EASE.out,
      onUpdate: () => {
        el.textContent = String(Math.round(c.v));
      },
    });
    return () => {
      tween.kill();
      el.textContent = String(value);
    };
  }, [key, value]);
  return (
    <p className="text-[length:clamp(1.9rem,6svh,4rem)] leading-[0.9] font-extrabold tracking-[-0.05em] tabular-nums">
      <span ref={ref}>{value}</span>
    </p>
  );
}

/* ---------------------------------------------------------------- charts */

/** Members' running total by joining year: a line with a soft area, the latest point in red. Redraws on scan. */
function GrowthChart({ card, growth }: { card: MissionCardId; growth: MissionStats["members"]["growth"] }) {
  const line = useRef<SVGPolylineElement>(null);
  const key = useDroneStore((s) => s.scanKeys[card] ?? 0);
  const W = 240;
  const H = 60;
  const max = Math.max(1, ...growth.map((g) => g.total));
  const pts = growth.map((g, i) => [
    growth.length === 1 ? W / 2 : 8 + (i * (W - 16)) / (growth.length - 1),
    H - 6 - ((H - 14) * g.total) / max,
  ]);
  const path = pts.map((p) => p.join(",")).join(" ");
  const last = pts[pts.length - 1];

  useEffect(() => {
    const el = line.current;
    if (!el || !key || prefersReducedMotion()) return;
    const len = el.getTotalLength();
    const tween = gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: DURATION.slow, ease: EASE.out });
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "strokeDasharray,strokeDashoffset" });
    };
  }, [key]);

  if (pts.length === 0) return null;
  // The line and area stretch to the card (preserveAspectRatio none); dots and labels are HTML so they don't.
  return (
    <div className="mt-auto flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
          <polygon points={`${pts[0][0]},${H} ${path} ${last[0]},${H}`} className="fill-text/[0.06]" />
          <polyline ref={line} points={path} fill="none" className="stroke-text/80" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        </svg>
        {pts.map(([x, y], i) => (
          <span
            key={growth[i].year}
            aria-hidden="true"
            className={cn(
              "absolute -translate-1/2 rounded-full",
              i === pts.length - 1 ? "size-2 bg-red" : "size-1.5 bg-text",
            )}
            style={{ left: `${(100 * x) / W}%`, top: `${(100 * y) / H}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted" aria-hidden="true">
        {growth.map((g) => (
          <span key={g.year}>{g.year}</span>
        ))}
      </div>
    </div>
  );
}

/** Projects per domain: horizontal bars that grow again on each scan. */
function DomainBars({ card, domains }: { card: MissionCardId; domains: MissionStats["projects"]["domains"] }) {
  const key = useDroneStore((s) => s.scanKeys[card] ?? 0);
  const max = Math.max(1, ...domains.map((d) => d.count));
  return (
    <ul className="mt-auto flex min-h-0 flex-col justify-end gap-[clamp(0.2rem,0.7svh,0.45rem)]" aria-label="Projects by domain">
      {domains.map((d, i) => (
        <li key={d.domain} className="grid grid-cols-[4.6rem_1fr_1.2rem] items-center gap-2 md:grid-cols-[5.5rem_1fr_1.5rem]">
          <span className="mono-label truncate text-[10px] text-muted md:text-[11px]">{d.label}</span>
          <span className="h-[clamp(4px,0.9svh,8px)] overflow-hidden rounded-pill bg-text/[0.07]">
            <span
              key={key}
              className={cn("block h-full origin-left rounded-pill bg-text/70", key > 0 && "animate-grow-x motion-reduce:animate-none")}
              style={{ width: `${(100 * d.count) / max}%`, animationDuration: "0.9s", animationDelay: `${i * 0.06}s` }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums">{d.count}</span>
        </li>
      ))}
    </ul>
  );
}

/** The year's events as dots: done ones filled, coming ones outlined. */
function Dots({ done, total }: { done: number; total: number }) {
  return (
    <div className="mt-auto flex flex-wrap gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("size-2.5 rounded-full", i < done ? "bg-text/80" : "border border-text/40")} />
      ))}
    </div>
  );
}

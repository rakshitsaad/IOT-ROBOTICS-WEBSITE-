"use client";

import { useEffect, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { ACCENTS, COLORS } from "@/lib/tokens";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { Button, CrossMark, GridBackground, MonoLabel } from "@/components/ui";
import {
  BOT_FACES,
  BOT_ICONS,
  BOT_ICON_NAMES,
  BotStage,
  botActions,
  botTransform,
  useBotStore,
  useBotSupport,
  type Vec3,
} from "@/components/robot";
import { botDebug } from "@/components/robot/config";

/** World-space points for the lookAt presets (the robot's head is near 0, 1.8, 0.45). */
const LOOK_PRESETS: { label: string; point: Vec3 }[] = [
  { label: "Look left", point: [-3, 1.9, 2.5] },
  { label: "Look right", point: [3, 1.9, 2.5] },
  { label: "Look up", point: [0.4, 4.5, 2.5] },
  { label: "Look down", point: [-0.4, 0.2, 3] },
];

const GLOWS = [
  { name: "red", value: ACCENTS.red, swatch: "bg-red" },
  { name: "maroon", value: COLORS.maroon, swatch: "bg-maroon" },
  { name: "white", value: ACCENTS.white, swatch: "bg-text" },
];

const PLACEMENTS = [
  { label: "Centre", to: { x: 0, y: 0, scale: 1 } },
  { label: "Left · small", to: { x: -0.45, y: 0.25, scale: 0.7 } },
  { label: "Right", to: { x: 0.45, y: 0, scale: 0.9 } },
  { label: "Off stage", to: { x: 3.4, y: 0, scale: 1 } },
];

export function RobotLab() {
  const face = useBotStore((s) => s.face);
  const icon = useBotStore((s) => s.icon);
  const tracking = useBotStore((s) => s.lookAtCursor);
  const setTracking = useBotStore((s) => s.setLookAtCursor);
  const [placement, setPlacement] = useState("Centre");

  // Leave the shared transform as we found it.
  useEffect(
    () => () => {
      gsap.killTweensOf(botTransform);
      Object.assign(botTransform, { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, scale: 1 });
    },
    [],
  );

  const place = (label: string, to: { x: number; y: number; scale: number }) => {
    setPlacement(label);
    gsap.killTweensOf(botTransform);
    if (prefersReducedMotion()) Object.assign(botTransform, to);
    else gsap.to(botTransform, { ...to, duration: 1.2, ease: "expo.out" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* Stage */}
      <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
        <div className="relative isolate h-[min(64vh,560px)] min-h-[380px] overflow-hidden rounded-card border border-line bg-bg-2/60 lg:h-[min(76vh,720px)]">
          <GridBackground fixed={false} fade />
          <BotStage fixed={false} />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 md:p-5">
            <MonoLabel tone="text">ClubBot</MonoLabel>
            <CrossMark size={10} className="text-text/30" />
          </div>
        </div>
        <Stats />
      </div>

      {/* Controls */}
      <div className="space-y-4 md:space-y-5">
        <Group index={1} title="Expressions">
          {BOT_FACES.map((f) => (
            <Toggle key={f} active={!icon && f === face} onClick={() => botActions.setFace(f)}>
              {f}
            </Toggle>
          ))}
        </Group>

        <Group index={2} title="Icons">
          {BOT_ICON_NAMES.map((name) => (
            <Toggle key={name} active={icon === name} onClick={() => botActions.setIcon(name)}>
              <IconGlyph paths={BOT_ICONS[name].paths} />
              {BOT_ICONS[name].label}
            </Toggle>
          ))}
          <Toggle active={!icon} onClick={() => botActions.setIcon(null)}>
            None
          </Toggle>
        </Group>

        <Group index={3} title="Gestures">
          <Toggle onClick={botActions.wave}>Wave</Toggle>
          <Toggle onClick={botActions.nod}>Nod</Toggle>
          <Toggle onClick={botActions.bootUp}>Boot up</Toggle>
          {LOOK_PRESETS.map((p) => (
            <Toggle key={p.label} onClick={() => botActions.lookAt(p.point)}>
              {p.label}
            </Toggle>
          ))}
        </Group>

        <Group index={4} title="Cursor tracking">
          <button
            type="button"
            role="switch"
            aria-checked={tracking}
            onClick={() => setTracking(!tracking)}
            data-cursor="link"
            className="group/switch inline-flex items-center gap-3 rounded-pill border border-line py-1.5 pl-1.5 pr-4 text-[13px] font-semibold transition-colors duration-[350ms] ease-power3 hover:border-text/40"
          >
            <span
              className={cn(
                "relative h-6 w-11 rounded-pill transition-colors duration-[350ms] ease-power3",
                tracking ? "bg-text" : "bg-text/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 size-4 rounded-full transition-transform duration-[350ms] ease-power3",
                  tracking ? "translate-x-5 bg-bg" : "bg-text",
                )}
              />
            </span>
            lookAtCursor: {tracking ? "on" : "off"}
          </button>
          <p className="basis-full text-sm text-muted">
            Head follows the pointer (max 25° yaw, 15° pitch); the body follows at 30%.
          </p>
        </Group>

        <Group index={5} title="Glow colour">
          {GLOWS.map((g) => (
            <button
              key={g.name}
              type="button"
              onClick={() => botActions.glow(g.value)}
              data-cursor="link"
              aria-label={`Glow ${g.name}`}
              className="inline-flex items-center gap-2 rounded-pill border border-line py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold transition-colors duration-[350ms] ease-power3 hover:border-text/40"
            >
              <span className={cn("size-5 rounded-full", g.swatch)} />
              {g.name}
            </button>
          ))}
        </Group>

        <Group index={6} title="botTransform">
          {PLACEMENTS.map((p) => (
            <Toggle key={p.label} active={placement === p.label} onClick={() => place(p.label, p.to)}>
              {p.label}
            </Toggle>
          ))}
          <p className="basis-full text-sm text-muted">
            Tweens the shared transform object. &ldquo;Off stage&rdquo; should switch rendering off in the stats.
          </p>
        </Group>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- parts */

function Group({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-bg/70 p-5 backdrop-blur-[2px] md:p-6">
      <MonoLabel index={index} tone="text" as="h2" className="mb-4 block">
        {title}
      </MonoLabel>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

/** Toggle button; pass `active` for toggles (sets aria-pressed), omit it for one-shot actions. */
function Toggle({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      size="sm"
      variant={active ? "primary" : "secondary"}
      aria-pressed={active}
      onClick={onClick}
      className="gap-1.5 capitalize"
    >
      {children}
    </Button>
  );
}

function IconGlyph({ paths }: { paths: string[] }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function Stats() {
  const support = useBotSupport();
  const [stats, setStats] = useState({ triangles: 0, calls: 0, rendering: false });

  useEffect(() => {
    const id = window.setInterval(() => setStats({ ...botDebug }), 500);
    return () => window.clearInterval(id);
  }, []);

  const is3D = support === "webgl";
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      <Stat label="Mode" value={support.replace("poster:", "poster · ")} on={is3D} />
      <Stat label="Rendering" value={is3D ? (stats.rendering ? "on" : "paused") : "poster"} on={is3D && stats.rendering} />
      <Stat label="Triangles" value={is3D ? stats.triangles.toLocaleString("en") : "–"} on={is3D && stats.triangles < 60000} />
      <Stat label="Draw calls" value={is3D ? String(stats.calls) : "–"} on={is3D} />
    </dl>
  );
}

function Stat({ label, value, on }: { label: string; value: string; on: boolean }) {
  return (
    <div className="rounded-image border border-line bg-bg-2 px-3.5 py-3">
      <dt className="mono-label text-muted">{label}</dt>
      <dd className="mt-1.5 flex items-center gap-2 truncate text-sm font-semibold">
        <span className={cn("size-2 shrink-0 rounded-full", on ? "bg-red" : "bg-muted")} />
        {value}
      </dd>
    </div>
  );
}

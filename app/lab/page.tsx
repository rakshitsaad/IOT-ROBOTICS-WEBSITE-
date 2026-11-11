import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Accordion,
  Capsule,
  CrossMark,
  DotGrid,
  GridBackground,
  IrisButton,
  MonoLabel,
  Pill,
  PillButton,
  RotatingBadge,
  type CapsuleTone,
  type PillColor,
} from "@/components/ui";
import { MotionStatus, PillRevealDemo, RevealDemo } from "@/components/lab/MotionDemos";
import { RobotHandLab } from "@/components/lab/RobotHandLab";
import { BotHeadIcon } from "@/components/robot/BotHeadIcon";
import { BOT_ICON_NAMES } from "@/components/robot/icons";
import { COLORS, TEAM_ACCENT } from "@/lib/tokens";
import type { TeamName } from "@/lib/types";

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

const SURFACES = [
  { name: "bg · matte black", value: COLORS.bg, className: "bg-bg" },
  { name: "bg-2 · charcoal", value: COLORS.bg2, className: "bg-bg-2" },
  { name: "line · border grey", value: COLORS.line, className: "bg-line" },
  { name: "text · warm white", value: COLORS.text, className: "bg-text" },
  { name: "muted · grey", value: COLORS.muted, className: "bg-muted" },
];

const ACCENT_SWATCHES = [
  { name: "red · deep red", value: COLORS.red, className: "bg-red" },
  { name: "red-deep · hover", value: COLORS.redDeep, className: "bg-red-deep" },
  { name: "maroon · dark maroon", value: COLORS.maroon, className: "bg-maroon" },
];

const PILL_COLORS: PillColor[] = ["red", "maroon", "white", "iris", "raised", "dark"];

const CAPSULES: { tone: CapsuleTone; speed: number }[] = [
  { tone: "raised", speed: 0.5 },
  { tone: "iris", speed: -0.35 },
  { tone: "outline", speed: 0.25 },
  { tone: "red", speed: -0.5 },
  { tone: "glass", speed: 0.4 },
  { tone: "maroon", speed: 0 },
  { tone: "iris-line", speed: 0.3 },
  { tone: "haze", speed: -0.25 },
];

export default function LabPage() {
  return (
    <div className="relative pt-header">
      <GridBackground />

      <header className="shell pb-10 pt-12 md:pb-16 md:pt-20">
        <MonoLabel index="LAB">Design system</MonoLabel>
        <h1 className="mt-5 max-w-4xl text-[length:clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
          Every <Pill color="iris">primitive</Pill>, on the grid.
        </h1>
        <p className="mt-6 max-w-xl text-muted">
          A check page for tokens, type, primitives and motion. The source of truth is DESIGN.md at the repo root.
          This page is not indexed.
        </p>
      </header>

      <div className="shell space-y-6 md:space-y-8">
        {/* 01 Tokens */}
        <Section index={1} title="Colour tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SURFACES.map((c) => (
              <Swatch key={c.name} name={c.name} value={c.value} className={c.className} />
            ))}
            {ACCENT_SWATCHES.map((c) => (
              <Swatch key={c.name} name={c.name} value={c.value} className={c.className} />
            ))}
          </div>
          <div className="mt-6">
            <MonoLabel>--iris · maroon → red sheen, use sparingly</MonoLabel>
            <div className="mt-3 h-16 rounded-image bg-iris md:h-20" />
          </div>
        </Section>

        {/* 02 Radius */}
        <Section index={2} title="Radius">
          <div className="flex flex-wrap items-end gap-4">
            <RadiusSample label="pill · 999px" className="h-12 w-40 rounded-pill" />
            <RadiusSample label="card · 28px" className="h-32 w-44 rounded-card" />
            <RadiusSample label="image · 18px" className="h-32 w-44 rounded-image" />
          </div>
        </Section>

        {/* 03 Typography */}
        <Section index={3} title="Typography">
          <div className="space-y-8">
            <div>
              <MonoLabel>Sora · display & body · 500–800</MonoLabel>
              <div className="mt-3 space-y-1">
                <p className="text-[length:clamp(2.25rem,6vw,4.5rem)] font-extrabold leading-none tracking-[-0.045em]">Sense. Think. Move.</p>
                <p className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">Bold 700 headline</p>
                <p className="text-xl font-semibold tracking-[-0.02em]">Semibold 600 subheading</p>
                <p className="max-w-xl text-muted">
                  Medium 500 body. We are a student club that designs, builds and ships connected devices and robots,
                  from first LED blink to competition podiums.
                </p>
              </div>
            </div>
            <div>
              <MonoLabel>JetBrains Mono · labels · 11–12px · 0.14em</MonoLabel>
              <p className="mono-label mt-3 text-text">ESP32-S3 · ROS 2 · LoRaWAN · [04] Projects</p>
            </div>
            <div>
              <MonoLabel tone="red">Bodoni Moda · Senior Core section only</MonoLabel>
              <p className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
                The Senior <em className="italic">Core</em>
              </p>
            </div>
            <div>
              <MonoLabel tone="white">Caveat · handwritten gallery captions only</MonoLabel>
              <p className="mt-3 -rotate-2 font-hand text-3xl text-text/90">3am, 14th attempt, it finally moved</p>
            </div>
            <div>
              <MonoLabel tone="white">Anton · /achievements slide titles only</MonoLabel>
              <p className="mt-3 font-condensed text-5xl leading-[0.95] uppercase md:text-6xl">
                Smart India
                <br />
                Hackathon
              </p>
            </div>
          </div>
        </Section>

        {/* 04 Pill */}
        <Section index={4} title="<Pill color>">
          <p className="text-[length:clamp(1.75rem,4.5vw,3.25rem)] font-bold leading-[1.15] tracking-[-0.035em]">
            We build <Pill color="white">robots</Pill> that <Pill color="raised">sense</Pill>, <Pill color="red">think</Pill>{" "}
            and <Pill color="raised">move</Pill>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-lg font-semibold">
            {PILL_COLORS.map((c) => (
              <Pill key={c} color={c}>
                {c}
              </Pill>
            ))}
          </div>
          <div className="mt-10">
            <MonoLabel>reveal + pillReveal() · highlighter, plays once in view</MonoLabel>
            <PillRevealDemo />
          </div>
        </Section>

        {/* 05 MonoLabel */}
        <Section index={5} title="<MonoLabel>">
          <div className="flex flex-col gap-3">
            <MonoLabel>Plain label</MonoLabel>
            <MonoLabel index={1}>With an index prefix</MonoLabel>
            <MonoLabel index={12} tone="text">Tone: text</MonoLabel>
            <MonoLabel index="A4" tone="red">Custom index, accent tone</MonoLabel>
          </div>
        </Section>

        {/* 06 Buttons */}
        <Section index={6} title="<IrisButton> & <PillButton>">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <IrisButton size="sm">Small</IrisButton>
              <IrisButton>Join us</IrisButton>
              <IrisButton size="lg" arrow>
                Apply for core team
              </IrisButton>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PillButton variant="light">Contact</PillButton>
              <PillButton variant="ghost" arrow>
                View projects
              </PillButton>
              <PillButton variant="ghost" size="sm">
                Ghost small
              </PillButton>
            </div>
          </div>
        </Section>

        {/* 07 Capsule */}
        <Section index={7} title="<Capsule> · scroll to see parallax">
          <div className="grid grid-cols-3 justify-items-center gap-y-20 overflow-hidden py-14 sm:flex sm:items-center sm:justify-start sm:gap-8 sm:py-16 md:gap-12">
            {CAPSULES.map(({ tone, speed }, i) => (
              <div key={tone} className="flex flex-col items-center gap-3">
                <Capsule
                  tone={tone}
                  speed={speed}
                  className="h-36 w-10 sm:h-56 sm:w-16 md:h-72 md:w-24"
                  rotate={i === 1 ? 8 : 0}
                />
                <span className="mono-label text-muted">
                  {tone} <span className="text-text/60">{speed}</span>
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* 08 DotGrid & CrossMark */}
        <Section index={8} title="<DotGrid> & <CrossMark>">
          <div className="flex flex-wrap items-center gap-8 md:gap-12">
            <DotGrid />
            <DotGrid rows={2} cols={6} className="text-red" />
            <DotGrid rows={4} cols={4} size={2} gap={8} className="text-text/40" />
            <DotGrid rows={3} cols={8} size={4} gap={14} className="text-text/40" />
            <CrossMark />
            <CrossMark size={16} className="text-red" />
            <CrossMark size={24} strokeWidth={1.5} className="text-text" />
          </div>
        </Section>

        {/* 09 Cursor */}
        <Section index={9} title="Cursor states · mouse/trackpad only">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["view", "drag", "link"] as const).map((v) => (
              <div
                key={v}
                data-cursor={v}
                className="flex h-36 items-end rounded-card border border-line bg-bg-2 p-5 md:h-44"
              >
                <span className="mono-label text-text">
                  data-cursor=&quot;{v}&quot;
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* 10 Team accents */}
        <Section index={10} title="Team accent map">
          <ul className="flex flex-wrap gap-2 text-base font-semibold md:text-lg">
            {(Object.keys(TEAM_ACCENT) as TeamName[]).map((team) => (
              <li key={team}>
                <Pill color={TEAM_ACCENT[team]}>{team}</Pill>
              </li>
            ))}
          </ul>
        </Section>

        {/* 11 Motion */}
        <Section index={11} title="Motion">
          <div className="space-y-6">
            <MotionStatus />
            <RevealDemo />
          </div>
        </Section>

        {/* 12 Active border */}
        <Section index={12} title="iris-border · active state">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card border border-line bg-bg-2 p-6">
              <MonoLabel>Default card</MonoLabel>
            </div>
            <div className="iris-border rounded-card bg-bg-2 p-6">
              <MonoLabel tone="text">Active card</MonoLabel>
            </div>
          </div>
        </Section>

        {/* 13 Robot head icon */}
        <Section index={13} title="<BotHeadIcon> · flat robot head">
          <ul className="flex flex-wrap items-end gap-6 md:gap-8">
            {[null, ...BOT_ICON_NAMES].map((icon) => (
              <li key={icon ?? "face"} className="flex flex-col items-center gap-3">
                <BotHeadIcon icon={icon} />
                <span className="mono-label text-muted">{icon ?? "eyes"}</span>
              </li>
            ))}
            <li className="flex flex-col items-center gap-3">
              <BotHeadIcon icon="drone" className="size-20" />
              <span className="mono-label text-muted">size-20</span>
            </li>
          </ul>
        </Section>

        {/* 14 animate-grow-x */}
        <Section index={14} title="animate-grow-x · slider indicator">
          <div className="flex items-center gap-2">
            <span className="relative h-2 w-10 overflow-hidden rounded-pill bg-text/25">
              <span className="absolute inset-0 origin-left animate-grow-x rounded-pill bg-text [animation-iteration-count:infinite]" />
            </span>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-pill bg-text/25" />
            ))}
          </div>
        </Section>

        {/* 15 RotatingBadge */}
        <Section index={15} title="<RotatingBadge> · turns faster while you scroll">
          <div className="flex flex-wrap items-center gap-8 md:gap-12">
            <RotatingBadge items={["IoT & Robotics", "Senior Core", "2026"]} />
            <RotatingBadge items={["Sense", "Think", "Move"]} period={12} className="size-28 text-red md:size-28" />
            <RotatingBadge items={["Static under reduced motion"]} period={40} className="size-24 text-muted md:size-24" />
          </div>
        </Section>

        {/* 16 paper / paper-ruled */}
        <Section index={16} title="paper & paper-ruled · gallery journal pages">
          <div className="flex flex-wrap items-start gap-6 md:gap-10">
            <div className="paper grid aspect-[4/5] w-48 place-items-center rounded-image p-[6px] shadow-2xl shadow-black/60 md:w-56">
              <span className="paper -rotate-3 rounded-[3px] px-3 py-1.5 font-hand text-xl text-bg shadow-lg shadow-black/40">
                a caption tag
              </span>
            </div>
            <div className="paper aspect-[4/5] w-48 rounded-image p-[6px] shadow-2xl shadow-black/60 md:w-56">
              <div className="paper-ruled size-full rounded-[12px] pt-8 pr-5 pl-[19%] [--rule:1.6rem]">
                <p className="font-hand text-2xl leading-[1.6rem] text-bg/85">A note page: Caveat on the rules.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 17 /about robot hand + ambient loops */}
        <Section index={17} title="<RobotHand> · the /about intro · float, breathe, orbit, pulse-soft, fade-up">
          <RobotHandLab />
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              ["float", "animate-float"],
              ["breathe", "animate-breathe"],
              ["orbit", "animate-orbit"],
              ["pulse-soft", "animate-pulse-soft"],
              ["fade-up", "animate-fade-up"],
            ].map(([name, cls]) => (
              <li key={name} className="grid justify-items-center gap-3 rounded-image border border-line p-5">
                <span className={`block size-10 rounded-[10px] bg-iris motion-reduce:animate-none ${cls}`} />
                <MonoLabel>{name}</MonoLabel>
              </li>
            ))}
          </ul>
        </Section>

        <Section index={18} title="<Accordion> · FAQs (/contact, /join)">
          <Accordion
            items={[
              { q: "Does it animate its height?", a: "Yes: the answer's grid row goes from 0fr to 1fr over 500ms while it fades in." },
              { q: "Can several be open?", a: "Yes. The first one starts open; pass defaultOpen to change that." },
              { q: "What about reduced motion?", a: "It opens instantly, like every transition." },
            ]}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-bg/70 p-5 backdrop-blur-[2px] sm:p-8 md:p-10">
      <div className="mb-6 flex items-center justify-between gap-4 md:mb-8">
        <MonoLabel index={index} tone="text" as="h2">
          {title}
        </MonoLabel>
        <CrossMark size={10} className="text-text/30" />
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, value, className }: { name: string; value: string; className: string }) {
  return (
    <div className="overflow-hidden rounded-image border border-line">
      <div className={`h-16 md:h-20 ${className}`} />
      <div className="bg-bg-2 px-3 py-2.5">
        <p className="text-sm font-semibold">{name}</p>
        <p className="mono-label mt-0.5 truncate text-muted">{value}</p>
      </div>
    </div>
  );
}

function RadiusSample({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`border border-line bg-bg-2 ${className}`} />
      <span className="mono-label text-muted">{label}</span>
    </div>
  );
}

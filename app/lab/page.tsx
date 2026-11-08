import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Accordion,
  ArrowLink,
  Button,
  FactList,
  MonoLabel,
  PageHeader,
  Photo,
  SectionHeader,
  Tag,
  TagList,
} from "@/components/ui";
import { MotionStatus, RevealDemo } from "@/components/lab/MotionDemos";
import { BotHeadIcon } from "@/components/robot/BotHeadIcon";
import { BOT_ICON_NAMES } from "@/components/robot/icons";
import { COLORS } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  { name: "bg · background", value: COLORS.bg, className: "bg-bg" },
  { name: "bg-2 · surface", value: COLORS.bg2, className: "bg-bg-2" },
  { name: "bg-3 · elevated", value: COLORS.bg3, className: "bg-bg-3" },
  { name: "line · border", value: COLORS.line, className: "bg-line" },
  { name: "text · primary", value: COLORS.text, className: "bg-text" },
  { name: "muted · secondary", value: COLORS.muted, className: "bg-muted" },
  { name: "faint · metadata", value: COLORS.faint, className: "bg-faint" },
  { name: "red · accent", value: COLORS.red, className: "bg-red" },
  { name: "red-deep · accent hover", value: COLORS.redDeep, className: "bg-red-deep" },
];

const TYPE = [
  { name: "type-display", note: "Home hero only", className: "type-display", text: "We build it." },
  { name: "type-h1", note: "Inner page headings", className: "type-h1", text: "One journal per event." },
  { name: "type-h2", note: "Section headings", className: "type-h2", text: "Selected work from the lab." },
  { name: "type-h3", note: "Card and item headings", className: "type-h3", text: "Robotics & Mechatronics" },
  { name: "type-lead", note: "Page intros (+ text-muted)", className: "type-lead text-muted", text: "Workshops, talks, hackathons and competitions." },
  { name: "type-body", note: "Body copy (+ text-muted)", className: "type-body text-muted", text: "Members prototype drones, robots and connected devices, then test them where things actually break." },
  { name: "mono-label", note: "Labels and metadata", className: "mono-label text-faint", text: "Featured projects" },
];

/** /lab: the design system's check page (DESIGN.md). Not linked, not indexed. */
export default function LabPage() {
  return (
    <>
      <PageHeader
        label="Lab · design system"
        title="Every primitive, in one place."
        intro="A check page for tokens, type, primitives and motion. The source of truth is DESIGN.md at the repo root. This page is not indexed."
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/lab/robot" variant="secondary" size="sm" arrow>
            Robot controls
          </Button>
          <Button href="/lab/drone" variant="secondary" size="sm" arrow>
            Drone bench
          </Button>
        </div>
      </PageHeader>

      <div className="shell space-y-6 py-12 md:space-y-8 md:py-16">
        <Section index={1} title="Colour tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SWATCHES.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-card border border-line">
                <div className={`h-20 ${c.className}`} />
                <div className="bg-bg px-3 py-2.5">
                  <p className="text-[13px] font-medium">{c.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-faint">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section index={2} title="Type scale">
          <dl className="divide-y divide-line">
            {TYPE.map((t) => (
              <div key={t.name} className="grid gap-3 py-5 md:grid-cols-[12rem_1fr] md:gap-8">
                <dt>
                  <p className="font-mono text-[12px] text-text">{t.name}</p>
                  <p className="mt-1 text-[12px] text-faint">{t.note}</p>
                </dt>
                <dd className={t.className}>{t.text}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section index={3} title="Buttons and links">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button arrow>Join the club</Button>
            <Button href="https://example.com" arrow>
              Register
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button size="lg" arrow>
              Large
            </Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-6">
            <ArrowLink href="/projects">All projects</ArrowLink>
            <ArrowLink href="https://github.com">Source code</ArrowLink>
          </div>
        </Section>

        <Section index={4} title="Tags and labels">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>Robotics</Tag>
            <Tag tone="accent">Winner</Tag>
            <Tag tone="accent">Registrations open</Tag>
            <Tag tone="solid">Completed</Tag>
            <TagList items={["ESP32-S3", "ESP-NOW", "C++"]} />
          </div>
          <div className="mt-6 flex flex-wrap gap-8">
            <MonoLabel index={1}>About the club</MonoLabel>
            <MonoLabel>Featured</MonoLabel>
            <MonoLabel tone="text">Recruitment 2026</MonoLabel>
          </div>
        </Section>

        <Section index={5} title="Section header">
          <SectionHeader
            index={3}
            label="Featured projects"
            title="Selected work from the lab."
            intro="The split layout: heading on the left, intro and link on the right from lg."
            action={{ label: "All projects", href: "/projects" }}
          />
        </Section>

        <Section index={6} title="Photo and facts">
          <div className="grid gap-6 md:grid-cols-3">
            <Photo src="/achievements/tryst-line-follower.jpg" alt="Line follower on its track" sizes="33vw" />
            <Photo src={null} alt="No photo yet" sizes="33vw" />
            <FactList
              items={[
                { label: "Members", value: 41 },
                { label: "Teams", value: 7 },
              ]}
            />
          </div>
        </Section>

        <Section index={7} title="Accordion">
          <Accordion
            items={[
              { q: "Who can apply?", a: "Any student, from any year and any branch." },
              { q: "Do I need experience?", a: "No. Curiosity and follow-through matter more." },
            ]}
          />
        </Section>

        <Section index={8} title="Robot screen icons">
          <ul className="flex flex-wrap gap-4">
            {[null, ...BOT_ICON_NAMES].map((icon) => (
              <li key={icon ?? "face"} className="flex flex-col items-center gap-2">
                <BotHeadIcon icon={icon} className="size-14" />
                <span className="font-mono text-[11px] text-faint">{icon ?? "face"}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section index={9} title="Motion">
          <MotionStatus />
          <RevealDemo />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["First", "Second", "Third"].map((label, i) => (
              <div
                key={label}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                className="rounded-card border border-line bg-bg-2 p-6 text-[14px] text-muted"
              >
                data-reveal · {label}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line p-5 md:p-8">
      <MonoLabel index={index} as="h2">
        {title}
      </MonoLabel>
      <div className="mt-6">{children}</div>
    </section>
  );
}

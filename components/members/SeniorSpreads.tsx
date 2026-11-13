import Image from "next/image";
import type { ReactNode } from "react";
import { IrisButton, MonoLabel, PillButton, RotatingBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { nameLines, type SeniorLayout } from "@/lib/members";
import type { Member } from "@/lib/types";
import {
  Blob,
  ConnectLink,
  Kicker,
  emStyle,
  MaskedLetters,
  NAME_SIZE,
  NAME_TYPE,
  Portrait,
  SpreadFooter,
} from "./parts";

/**
 * The Senior Core spreads (DESIGN.md §13): intro, one per senior in layout
 * A (split), B (vertical), C (cutout) or D (stacked), and the closing spread.
 * Mobile first: below md every spread stacks portrait, name, then text; from
 * md each one is a full-viewport composition (in a row while the section is
 * horizontal, stacked under reduced motion).
 */

export interface SpreadNavInfo {
  index: number;
  count: number;
  prev: string;
  next: string;
}

/** Common frame: full width, one screen tall, its own stacking context and container. */
function Spread({ labelledBy, className, children }: { labelledBy: string; className?: string; children: ReactNode }) {
  return (
    <article
      data-sc-spread
      aria-labelledby={labelledBy}
      className={cn(
        "@container relative isolate w-full shrink-0 overflow-x-clip",
        "min-h-svh md:h-svh md:min-h-0",
        // In the horizontal row, blobs may bleed into the neighbours (the viewport clips the edges).
        "group-data-[mode=h]/sc:overflow-visible",
        className,
      )}
    >
      {children}
    </article>
  );
}

/** Mobile padding (clears the header); md+ layouts set their own. */
const MOBILE_PAD = "px-gutter pt-[calc(var(--nav-h)+1.5rem)] pb-12";

/* ------------------------------------------------------------------ intro */

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen"];

export function IntroSpread({
  term,
  badgeItems,
  count,
  nav,
}: {
  term: string;
  badgeItems: string[];
  count: number;
  nav: SpreadNavInfo;
}) {
  const word = NUMBER_WORDS[count] ?? String(count);
  return (
    <Spread labelledBy="senior-core-title" className={cn("flex flex-col", MOBILE_PAD, "pt-header md:px-gutter md:pb-(--gutter)")}>
      <Blob speed={-0.5} className="top-[30%] left-[5%] w-[85vw] md:top-[20%] md:left-[16%] md:w-[44vw]" />

      <div className="flex items-start justify-between gap-4 pt-6 md:pt-10">
        <MonoLabel tone="text">
          Senior Core / {term}
        </MonoLabel>
        <MonoLabel className="hidden sm:inline-flex">{count} people</MonoLabel>
      </div>

      <h1 id="senior-core-title" className="relative mt-auto pt-16 font-serif font-normal uppercase md:pt-0">
        <span className="sr-only">The Senior Core</span>
        <span aria-hidden="true" className="block overflow-hidden pl-[0.12em] text-[length:clamp(2rem,4.2vw,4.2rem)] leading-none normal-case">
          <span className="inline-block animate-rise italic motion-reduce:animate-none" style={{ animationDelay: "150ms" }}>
            The
          </span>
        </span>
        {/* "CORE" is 2.64em wide: 34% of the spread fills the width (capped by height). */}
        <span
          aria-hidden="true"
          className="-mt-[0.04em] block overflow-hidden text-[length:min(34cqw,48svh)] leading-[0.84] tracking-[-0.01em]"
        >
          {Array.from("CORE").map((ch, i) => (
            <span
              key={i}
              className="inline-block animate-rise motion-reduce:animate-none"
              style={{ animationDelay: `${230 + i * 60}ms` }}
            >
              {ch}
            </span>
          ))}
        </span>
      </h1>

      <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
        <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted">
          <strong className="font-medium text-text">{word} people</strong> who keep the lab open, the projects moving and the
          calendar honest.
        </p>
        <SpreadFooter nav={nav}>
          <MonoLabel tone="text">Meet them</MonoLabel>
        </SpreadFooter>
      </div>

      <RotatingBadge
        items={badgeItems}
        className="absolute top-[calc(var(--nav-h)+var(--ann-h)+4.5rem)] right-(--gutter) size-28 md:top-[24%] md:right-[9%] md:size-44"
      />
    </Spread>
  );
}

/* ---------------------------------------------------------------- closing */

export function ClosingSpread({
  joinHref,
  recruiting,
  term,
  nav,
}: {
  joinHref: string;
  recruiting: boolean;
  term: string;
  nav: SpreadNavInfo;
}) {
  return (
    <Spread labelledBy="sc-closing-title" className={cn("flex flex-col", MOBILE_PAD, "md:px-gutter md:pt-[calc(var(--nav-h)+2.5rem)] md:pb-(--gutter)")}>
      <Blob speed={0.6} className="top-[28%] right-[-10%] w-[70vw] md:right-[6%] md:w-[36vw]" />
      <MonoLabel tone="text" className="pt-2">
        {recruiting ? "Applications open" : "Next intake"} / {term}
      </MonoLabel>

      <h2
        id="sc-closing-title"
        className="mt-auto pt-16 font-serif text-[length:min(12cqw,17svh)] leading-[0.95] font-normal tracking-[-0.02em] md:pt-0"
      >
        <MaskedLetters lines={["Want a seat"]} />
        <MaskedLetters lines={["at this"]} lineClassName="pl-[1.2em]" />
        <span className="block overflow-hidden italic">
          {Array.from("table?").map((ch, i) => (
            <span key={i} data-sc-rise="" className="inline-block">
              {ch}
            </span>
          ))}
        </span>
      </h2>

      <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div data-sc-fade className="flex flex-wrap items-center gap-3">
          <IrisButton href={joinHref} size="lg" arrow>
            Join the club
          </IrisButton>
          <PillButton href="#junior-core" variant="ghost" size="lg">
            Junior Core <span aria-hidden="true">↓</span>
          </PillButton>
        </div>
        <SpreadFooter nav={nav} />
      </div>
    </Spread>
  );
}

/* ---------------------------------------------------------------- members */

export interface MemberSpreadProps {
  member: Member;
  layout: SeniorLayout;
  nav: SpreadNavInfo;
}

export function MemberSpread(props: MemberSpreadProps) {
  switch (props.layout) {
    case "vertical":
      return <VerticalSpread {...props} />;
    case "cutout":
      return <CutoutSpread {...props} />;
    case "stacked":
      return <StackedSpread {...props} />;
    default:
      return <SplitSpread {...props} />;
  }
}

const titleId = (m: Member) => `sc-${m.id}`;
const alt = (m: Member) => `Portrait of ${m.full_name}`;

function Footer({ member, nav, className }: MemberSpreadProps & { className?: string }) {
  return <SpreadFooter member={member} nav={nav} className={className} />;
}

function Quote({ quote, className }: { quote: string | null; className?: string }) {
  if (!quote) return null;
  return (
    <blockquote data-sc-fade className={cn("font-serif leading-[1.3] text-text italic", className)}>
      <p>&ldquo;{quote}&rdquo;</p>
    </blockquote>
  );
}

function Bio({ bio, className }: { bio: string | null; className?: string }) {
  if (!bio) return null;
  return (
    <p data-sc-fade className={cn("text-[14px] leading-[1.65] text-muted", className)}>
      {bio}
    </p>
  );
}

function Meta({ member, className }: { member: Member; className?: string }) {
  return (
    <p data-sc-fade className={cn("mono-label text-muted", className)}>
      {member.role} / {member.branch}
    </p>
  );
}

/** A: portrait fills the left half; kicker, giant name and quote on the right. */
function SplitSpread(props: MemberSpreadProps) {
  const { member: m } = props;
  // A one-word name stays on one line here (nameLines would split it in half).
  const name = m.full_name.trim();
  const lines = /\s/.test(name) ? nameLines(name) : [name];
  return (
    <Spread labelledBy={titleId(m)} className={cn("flex flex-col", MOBILE_PAD, "md:grid md:grid-cols-2 md:p-0")}>
      <Blob speed={0.7} className="top-[12%] left-[25%] w-[75vw] md:top-[16%] md:left-[36%] md:w-[32vw]" />
      {m.photo_url && (
        <Portrait
          src={m.photo_url}
          alt={alt(m)}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-[4/5] w-full rounded-image md:aspect-auto md:h-full md:rounded-none"
        />
      )}
      <div className="flex flex-1 flex-col pt-8 [--col:calc(100cqw-2*var(--gutter))] md:min-h-0 md:px-gutter md:pt-[calc(var(--nav-h)+1.75rem)] md:pb-(--gutter) md:[--col:calc(50cqw-2*var(--gutter))]">
        {m.kicker && <Kicker>{m.kicker}</Kicker>}
        <h2 id={titleId(m)} className={cn(NAME_SIZE, NAME_TYPE, "mt-5 md:mt-[2svh]")} style={emStyle(lines)}>
          <span className="sr-only">{m.full_name}</span>
          <span aria-hidden="true">
            <MaskedLetters lines={lines} />
          </span>
        </h2>
        {/* Gaps are tight so a 200-character quote (5 lines) fits a 720px-tall screen. */}
        <div data-sc-fade aria-hidden="true" className="relative mt-6 h-px w-full bg-line md:mt-[2.5svh]">
          {/* Phones: a short red accent on the hairline, drawn in by the mobile reveal. */}
          <span data-sc-accent className="absolute inset-y-0 left-0 w-12 origin-left bg-red/80 md:hidden" />
        </div>
        <Quote quote={m.quote} className="mt-6 max-w-[32ch] text-[length:clamp(1.25rem,1.8vw,1.7rem)] md:mt-[2.5svh]" />
        <Meta member={m} className="mt-4" />
        <ConnectLink member={m} className="mt-6 md:mt-[2.5svh]" />
        <Footer {...props} className="mt-auto pt-8" />
      </div>
    </Spread>
  );
}

/**
 * B: the name set vertically in two columns either side of a medium
 * portrait (offset upward, an iris rectangle on its corner); heading and bio
 * on the left. Phones: the name is horizontal, under the portrait.
 */
function VerticalSpread(props: MemberSpreadProps) {
  const { member: m } = props;
  const lines = nameLines(m.full_name);
  // Size before NAME_TYPE: tailwind-merge drops a leading-* that comes before a font-size class.
  const column = cn(
    // Vertical: the column's height is the width to fit, and no height cap applies.
    "text-[length:min(clamp(4rem,11vw,12rem),calc(var(--col)/var(--em)))]",
    NAME_TYPE,
    "hidden overflow-hidden [writing-mode:vertical-rl] rotate-180 self-stretch md:block",
    "[--col:calc(100svh-var(--nav-h)-2.5rem-var(--gutter))]",
  );
  return (
    <Spread
      labelledBy={titleId(m)}
      className={cn(
        "flex flex-col",
        MOBILE_PAD,
        "md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,24cqw)_auto_minmax(0,1fr)] md:gap-x-[clamp(1rem,2.4vw,2.75rem)]",
        "md:px-gutter md:pt-[calc(var(--nav-h)+2.5rem)] md:pb-(--gutter)",
      )}
    >
      <Blob speed={-0.6} className="top-[6%] left-[10%] w-[70vw] md:top-[10%] md:left-[34%] md:w-[30vw]" />
      <h2 id={titleId(m)} className="sr-only">
        {m.full_name}
      </h2>

      {/* Left: heading and bio (md+: column 1, bottom). Phones: after the portrait. */}
      <div className="order-2 flex flex-col pt-8 [--col:calc(100cqw-2*var(--gutter))] md:order-none md:col-start-1 md:row-start-1 md:self-end md:pt-0">
        {m.kicker && <Kicker>{m.kicker}</Kicker>}
        <p aria-hidden="true" className={cn(NAME_SIZE, NAME_TYPE, "mt-5 md:hidden")} style={emStyle(lines)}>
          <MaskedLetters lines={lines} />
        </p>
        <p data-sc-fade className="mt-6 font-serif text-[length:clamp(1.75rem,2.6vw,2.6rem)] leading-[1.05] italic md:mt-6">
          {m.role}
        </p>
        <Meta member={m} className="mt-3" />
        <Bio bio={m.bio} className="mt-6 max-w-[34ch]" />
        <Quote quote={m.quote} className="mt-5 max-w-[30ch] text-[17px] md:hidden" />
        <ConnectLink member={m} className="mt-7" />
      </div>

      <p aria-hidden="true" className={cn(column, "md:col-start-2 md:row-start-1")} style={emStyle(lines)}>
        <MaskedLetters lines={[lines[0]]} axis="x" />
      </p>

      {/* Portrait, offset upward, with an iris rectangle on its lower corner. */}
      <div className="relative order-1 w-[80%] md:order-none md:col-start-3 md:row-start-1 md:mt-[2svh] md:w-full md:self-start">
        {m.photo_url && (
          <Portrait src={m.photo_url} alt={alt(m)} sizes="(min-width: 768px) 24vw, 80vw" className="aspect-[4/5] w-full rounded-image" />
        )}
        <div
          data-sc-fade
          aria-hidden="true"
          className="pointer-events-none absolute -right-[14%] -bottom-[10%] aspect-square w-[42%] bg-iris opacity-25"
        />
      </div>

      <p aria-hidden="true" className={cn(column, "text-end md:col-start-4 md:row-start-1")} style={emStyle(lines)}>
        <MaskedLetters lines={[lines[1]]} axis="x" />
      </p>

      <div className="order-3 mt-auto flex flex-col items-end gap-8 pt-10 md:order-none md:col-start-5 md:row-start-1 md:justify-end md:pt-0">
        <Quote quote={m.quote} className="hidden max-w-[24ch] text-right text-[length:clamp(1.1rem,1.5vw,1.4rem)] md:block" />
        <Footer {...props} />
      </div>
    </Spread>
  );
}

/**
 * C, the signature spread: the name in two giant lines across the width, the
 * cutout standing between them. Line 1 sits behind the person; line 2's fill
 * sits behind too, with an outline copy in front, so it passes partly behind.
 */
function CutoutSpread(props: MemberSpreadProps) {
  const { member: m } = props;
  const lines = nameLines(m.full_name);
  const big = cn(
    // Fits the full width (larger than the other layouts), capped by height.
    "text-[length:min(calc(var(--col)/var(--em)),26svh,20rem)]",
    NAME_TYPE,
    "absolute whitespace-nowrap leading-[0.84]",
  );
  return (
    <Spread
      labelledBy={titleId(m)}
      className={cn("flex flex-col [--col:calc(100cqw-2*var(--gutter))]", MOBILE_PAD, "md:block md:p-0")}
    >
      <h2 id={titleId(m)} className="sr-only">
        {m.full_name}
      </h2>
      {m.kicker && <Kicker className="md:absolute md:top-[calc(var(--nav-h)+2rem)] md:left-(--gutter)">{m.kicker}</Kicker>}

      {/* The stage: phones a 72svh block, md+ the whole spread. */}
      <div className="relative mt-6 h-[72svh] md:absolute md:inset-0 md:mt-0 md:h-auto">
        <Blob speed={0.5} className="bottom-[8%] left-1/2 w-[80vw] -translate-x-1/2 md:bottom-[6%] md:w-[38vw]" />
        <p
          aria-hidden="true"
          className={cn(big, "top-[4%] left-0 md:top-[calc(var(--nav-h)+4.5rem)] md:left-(--gutter) md:portrait:top-[26%]")}
          style={emStyle(lines)}
        >
          <MaskedLetters lines={[lines[0]]} />
        </p>
        <p
          aria-hidden="true"
          className={cn(big, "top-[46%] right-0 md:top-[50%] md:right-(--gutter) md:portrait:top-[52%]")}
          style={emStyle(lines)}
        >
          <MaskedLetters lines={[lines[1]]} />
        </p>
        {m.cutout_url && (
          <div
            data-sc-portrait
            className="absolute bottom-0 left-1/2 z-10 aspect-[9/14] h-full max-w-full -translate-x-1/2 md:h-[min(84svh,62cqw)] md:portrait:h-[74svh]"
          >
            <Image
              src={m.cutout_url}
              alt={`${m.full_name}, cut out`}
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              draggable={false}
              className="object-contain object-bottom select-none"
            />
          </div>
        )}
        {/* Line 2's outline, in front of the person. */}
        <p
          aria-hidden="true"
          className={cn(
            big,
            "pointer-events-none top-[46%] right-0 z-20 text-transparent [-webkit-text-stroke:1px_var(--text)] md:top-[50%] md:right-(--gutter) md:portrait:top-[52%]",
          )}
          style={emStyle(lines)}
        >
          <MaskedLetters lines={[lines[1]]} />
        </p>
      </div>

      <div className="relative z-30 mt-8 flex max-w-[30ch] flex-col md:absolute md:bottom-(--gutter) md:left-(--gutter) md:mt-0 md:max-w-[min(26ch,28cqw)]">
        <Quote quote={m.quote} className="text-[length:clamp(1.15rem,1.6vw,1.5rem)]" />
        <Meta member={m} className="mt-4" />
        <ConnectLink member={m} className="mt-6" />
      </div>
      <Footer {...props} className="relative z-30 mt-auto pt-10 md:absolute md:right-(--gutter) md:bottom-(--gutter) md:mt-0 md:pt-0" />
    </Spread>
  );
}

/**
 * D: the name stacked in three short lines (first, last, the role in
 * italics), a small square portrait bottom left, the rotating badge on the
 * right and the bio in two small columns.
 */
function StackedSpread(props: MemberSpreadProps) {
  const { member: m } = props;
  const lines = nameLines(m.full_name);
  return (
    <Spread
      labelledBy={titleId(m)}
      className={cn(
        "flex flex-col",
        MOBILE_PAD,
        "md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)_auto] md:gap-x-(--gutter) md:gap-y-[4svh]",
        "md:px-gutter md:pt-[calc(var(--nav-h)+2.5rem)] md:pb-(--gutter)",
      )}
    >
      <Blob speed={0.8} className="bottom-[30%] left-[0%] w-[70vw] md:bottom-[2%] md:left-[2%] md:w-[26vw]" />

      <div className="relative order-1 w-[62%] md:order-none md:col-start-1 md:row-start-2 md:w-auto md:self-end">
        {m.photo_url && (
          <Portrait
            src={m.photo_url}
            alt={alt(m)}
            sizes="(min-width: 768px) 16vw, 62vw"
            className="aspect-square w-full rounded-image md:w-[clamp(8rem,min(16vw,26svh),15rem)]"
          />
        )}
      </div>
      <RotatingBadge
        items={[m.full_name, m.role, "Senior Core"]}
        className="absolute top-[calc(var(--nav-h)+2.5rem)] right-(--gutter) size-28 md:static md:col-start-2 md:row-start-1 md:size-[clamp(8rem,13vw,12rem)] md:place-self-center"
      />

      <div className="order-2 flex flex-col pt-8 [--col:calc(100cqw-2*var(--gutter))] md:order-none md:col-start-1 md:row-start-1 md:pt-0 md:[--col:calc(58cqw-var(--gutter))]">
        {m.kicker && <Kicker>{m.kicker}</Kicker>}
        <h2 id={titleId(m)} className={cn(NAME_SIZE, NAME_TYPE, "mt-5 md:mt-8")} style={emStyle(lines)}>
          <span className="sr-only">{m.full_name}</span>
          <span aria-hidden="true">
            <MaskedLetters lines={lines} />
            <span className="block overflow-hidden pl-[1.6em] text-[0.42em] leading-[1.15] tracking-normal normal-case italic">
              <span data-sc-rise="" className="inline-block">
                the {m.role.toLowerCase()}
              </span>
            </span>
          </span>
        </h2>
      </div>

      <div className="order-3 flex flex-col pt-6 md:order-none md:col-start-1 md:row-start-2 md:ml-[calc(clamp(8rem,min(16vw,26svh),15rem)+var(--gutter))] md:self-end md:pt-0">
        <Bio bio={m.bio} className="max-w-[34rem] gap-8 lg:columns-2" />
        <ConnectLink member={m} className="mt-6" />
      </div>

      <Footer {...props} className="order-4 mt-auto pt-10 md:order-none md:col-start-2 md:row-start-2 md:mt-0 md:self-end md:pt-0" />
    </Spread>
  );
}

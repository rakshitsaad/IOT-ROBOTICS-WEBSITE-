"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { CrossMark } from "@/components/ui";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { chunk, firstName, initials, JUNIOR_CORE, socialLinks } from "@/lib/members";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { useUIStore } from "@/lib/store";
import type { Member } from "@/lib/types";
import { scrollPageTo, stickyOffset } from "./junior-scroll";
import { SocialIcon } from "./SocialIcon";

/**
 * One team's Junior Core accordion (DESIGN.md §13). Exactly one card is open:
 * the first to start with, then whichever was last clicked, tapped, chosen
 * with Enter/Space, or hovered (mouse, md and up).
 *
 * - md and up: a row of tall pills; the open card widens to a 460px card.
 *   Past JUNIOR_CORE.perLine members the row continues on a second line of
 *   the same accordion (fixed lines, so cards never jump between them).
 * - Phones: a vertical list of 72px pills; the open card grows to 380px.
 *
 * Sizes are CSS variables on the list, in container units, so eight cards
 * with one open always fit the column (see `SIZES`). The resize runs on CSS
 * transitions (JUNIOR_CORE_MOTION, a named exception to the house timing,
 * DESIGN.md §7). The entrance is a GSAP ScrollTrigger, skipped under reduced
 * motion, where the open card also switches instantly.
 */

export const JUNIOR_CORE_MOTION = {
  /** Width (md+) or height (phones) and radius, together (s). */
  duration: 0.55,
  bezier: [0.22, 1, 0.36, 1] as [number, number, number, number],
  /** The text starts this long after the card has finished resizing (s). */
  textDelay: 0.15,
  /** A hovered card opens after this long, so sweeping across a row doesn't open every card (ms). */
  hoverIntent: 80,
  /** Entrance: the cards rise this far (px), STAGGER apart, once, when the row reaches `revealAt`. */
  rise: 30,
  revealAt: "top 80%",
  /** Phone card heights (px), closed and open. Keep in sync with CARD below. */
  phone: { closed: 72, open: 380 },
} as const;

const M = JUNIOR_CORE_MOTION;
const DESKTOP = "(min-width: 768px)";

/**
 * Sizes, resolved against the accordion's own width (`@container`): at full
 * width a closed card is 76px, an open one 460px and the gap 12px (8 cards with
 * one open = 1076px); narrower columns scale all three down together.
 */
const SIZES =
  "[--jc-closed:clamp(44px,6.6cqw,76px)] [--jc-open:clamp(280px,42cqw,460px)] [--jc-gap:clamp(8px,1.1cqw,12px)] [--jc-h:440px]";

/** The accordion's resize transition: 550ms, cubic-bezier(0.22, 1, 0.36, 1). */
const RESIZE = "duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const CARD = cn(
  "group/card iris-border relative isolate shrink-0 bg-line",
  // The iris ring (iris-border's ::before) shows on the open card only.
  "before:opacity-0 before:transition-opacity before:duration-[550ms] before:ease-[cubic-bezier(0.22,1,0.36,1)] data-active:before:opacity-100",
  // Phones: a 72px full-width pill that grows to 380px. Phone-only states use max-md: (data-* variants
  // sort after md:, so an unscoped data-active: class would also win on desktop).
  "h-[72px] w-full rounded-[36px] max-md:data-active:h-[380px] max-md:data-active:rounded-card",
  // md+: a pill as wide as --jc-closed (radius = half its width, so it reads as 999px but can animate) that widens to --jc-open.
  "md:h-(--jc-h) md:w-(--jc-closed) md:rounded-[calc(var(--jc-closed)/2)] md:data-active:w-(--jc-open) md:data-active:rounded-card",
  "transition-[width,height,border-radius,box-shadow]",
  RESIZE,
  // A faint glow in the team's accent (--jc-accent, set on the team row): kept low so red stays a hint.
  "data-active:shadow-[0_0_28px_-10px_color-mix(in_oklab,var(--jc-accent)_35%,transparent),0_30px_80px_-30px_color-mix(in_oklab,var(--jc-accent)_45%,transparent)]",
);

/** Photo frame: a 56px circle on a closed phone pill, the whole card otherwise. */
const MEDIA = cn(
  "absolute top-2 left-2 size-14 overflow-hidden rounded-[28px]",
  "max-md:group-data-active/card:top-0 max-md:group-data-active/card:left-0 max-md:group-data-active/card:size-full",
  "md:top-0 md:left-0 md:size-full md:rounded-none",
  "transition-[top,left,width,height]",
  RESIZE,
);

/** No photo: initials in an iris ring, in the circle slot (phones) or high in the card (md+). */
const AVATAR = cn(
  "absolute top-2 left-2 size-14 text-[18px]",
  "max-md:group-data-active/card:top-[40%] max-md:group-data-active/card:left-1/2 max-md:group-data-active/card:size-32 max-md:group-data-active/card:-translate-1/2 max-md:group-data-active/card:text-[40px]",
  "md:top-[36%] md:left-[calc(var(--jc-closed)/2)] md:size-[calc(var(--jc-closed)-20px)] md:-translate-1/2 md:text-[length:calc(var(--jc-closed)*0.28)]",
  "md:group-data-active/card:left-1/2 md:group-data-active/card:size-36 md:group-data-active/card:text-[44px]",
  "transition-[top,left,width,height,font-size,translate]",
  RESIZE,
);

/** Labels of the closed card: they leave at once when it opens and come back as it closes. */
const CLOSED_LABEL =
  "pointer-events-none transition-opacity duration-[350ms] motion-safe:delay-[250ms] group-data-active/card:opacity-0 group-data-active/card:duration-[120ms] motion-safe:group-data-active/card:delay-0";

/** Details of the open card: fade in and rise 8px, 150ms after the resize ends; leave at once. */
const DETAILS = cn(
  "pointer-events-none absolute bottom-0 left-0 z-20 w-full p-5 md:w-(--jc-open) md:p-6",
  "translate-y-2 opacity-0 transition-[opacity,translate] duration-[120ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
  "group-data-active/card:translate-y-0 group-data-active/card:opacity-100 group-data-active/card:duration-[450ms]",
  "motion-safe:group-data-active/card:delay-[700ms]",
);

export function TeamAccordion({ team, members }: { team: string; members: Member[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const hoverTimer = useRef(0);
  const reduced = useReducedMotion();
  const lenis = useUIStore((s) => s.lenis);

  useEffect(() => {
    const timer = hoverTimer;
    return () => window.clearTimeout(timer.current);
  }, []);

  const triggers = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>("[data-jc-trigger]") ?? []);

  /** Phones: opening a card resizes the list above it, so keep the opened card on screen. */
  const keepInView = useCallback(
    (index: number, previous: number) => {
      const card = root.current?.querySelectorAll<HTMLElement>("[data-jc-card]")[index];
      if (!card) return;
      const grow = M.phone.open - M.phone.closed;
      const rect = card.getBoundingClientRect();
      // Where the card will be once the transition ends: the old open card above it shrinks.
      const top = rect.top - (previous < index ? grow : 0);
      const bottom = top + M.phone.open;
      const min = stickyOffset() + 12;
      const max = window.innerHeight - 12;
      let dy = 0;
      if (top < min) dy = top - min;
      else if (bottom > max) dy = Math.min(bottom - max, top - min);
      if (Math.abs(dy) < 4) return;
      scrollPageTo(window.scrollY + dy, lenis, { duration: M.duration + 0.15 });
    },
    [lenis],
  );

  const open = useCallback(
    (index: number, source: "click" | "hover") => {
      window.clearTimeout(hoverTimer.current);
      const previous = activeRef.current;
      if (index === previous) return;
      activeRef.current = index;
      setActive(index);
      if (source === "click" && !window.matchMedia(DESKTOP).matches) keepInView(index, previous);
    },
    [keepInView],
  );

  const onHover = (index: number, pointerType: string) => {
    if (pointerType !== "mouse" || !window.matchMedia(DESKTOP).matches) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => open(index, "hover"), M.hoverIntent);
  };

  /** ← / → (and Home / End) move focus between the cards; Enter / Space opens one (native button). */
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const last = members.length - 1;
    const to =
      e.key === "ArrowRight" ? Math.min(last, index + 1)
      : e.key === "ArrowLeft" ? Math.max(0, index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (to < 0) return;
    e.preventDefault(); // also keeps Senior Core's arrow keys out of it
    triggers()[to]?.focus();
  };

  /* Entrance: when the row scrolls into view its cards rise 30px, 60ms apart. */
  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      gsap.from(el.querySelectorAll("[data-jc-card]"), {
        y: M.rise,
        opacity: 0,
        duration: DURATION.base,
        ease: EASE.out,
        stagger: STAGGER,
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: el,
          start: M.revealAt,
          once: true,
          // Below Senior Core's horizontal pin: refresh after it.
          refreshPriority: -1,
        },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  const lines = chunk(members, JUNIOR_CORE.perLine);

  return (
    <div className="@container">
      <div
        ref={root}
        role="list"
        aria-label={`${team} team`}
        className={cn(SIZES, "flex flex-col gap-2 [overflow-anchor:none] md:gap-(--jc-gap)")}
      >
        {lines.map((line, l) => (
          <div key={l} role="none" className="flex flex-col gap-2 md:flex-row md:gap-(--jc-gap)">
            {line.map((member, k) => {
              const index = l * JUNIOR_CORE.perLine + k;
              return (
                <Card
                  key={member.id}
                  member={member}
                  active={index === active}
                  onOpen={() => open(index, "click")}
                  onHover={(pointerType) => onHover(index, pointerType)}
                  onHoverEnd={() => window.clearTimeout(hoverTimer.current)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({
  member,
  active,
  onOpen,
  onHover,
  onHoverEnd,
  onKeyDown,
}: {
  member: Member;
  active: boolean;
  onOpen: () => void;
  onHover: (pointerType: string) => void;
  onHoverEnd: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const panelId = `jc-panel-${member.id}`;
  const links = socialLinks(member);

  return (
    <div
      role="listitem"
      data-jc-card
      data-active={active ? "" : undefined}
      className={CARD}
      onPointerEnter={(e) => onHover(e.pointerType)}
      onPointerLeave={onHoverEnd}
    >
      {/* The card's control: covers the card, under the links (z-10 vs the details' z-20). It comes first so
          Tab goes button → that card's links → next button. Its outline follows the card's radius. */}
      <button
        type="button"
        data-jc-trigger
        data-cursor="link"
        aria-expanded={active}
        aria-controls={panelId}
        onClick={onOpen}
        onKeyDown={onKeyDown}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
      >
        <span className="sr-only">
          {member.full_name}, {member.role}
        </span>
      </button>

      <div className="absolute inset-px overflow-hidden rounded-[inherit] bg-bg-2">
        {member.photo_url ? (
          <div className={MEDIA}>
            <Image
              src={member.photo_url}
              alt=""
              fill
              sizes="(min-width: 768px) 460px, 100vw"
              draggable={false}
              style={{ objectPosition: member.focal_point } as CSSProperties}
              className={cn(
                "object-cover select-none",
                "brightness-80 grayscale-40 group-data-active/card:brightness-100 group-data-active/card:grayscale-0",
                "transition-[filter]",
                RESIZE,
              )}
            />
          </div>
        ) : (
          <div aria-hidden="true" className={AVATAR}>
            <div className="iris-border grid size-full place-items-center rounded-full bg-bg leading-none font-display font-semibold tracking-[-0.03em] text-text">
              {initials(member.full_name)}
            </div>
          </div>
        )}

        {/* Bottom gradient: transparent to 85% black, under the details (and the closed card's label on md+). */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/85 to-transparent opacity-0 md:h-3/5 md:opacity-60",
            "group-data-active/card:opacity-100 md:group-data-active/card:opacity-100",
            "transition-opacity",
            RESIZE,
          )}
        />

        {/* Closed, md+: the first name runs up the bottom of the pill. */}
        <span
          aria-hidden="true"
          className={cn(
            "mono-label absolute bottom-6 left-[calc(var(--jc-closed)/2)] hidden -translate-x-1/2 rotate-180 whitespace-nowrap text-[11px] text-text/60 [writing-mode:vertical-rl] md:block md:text-[11px]",
            CLOSED_LABEL,
          )}
        >
          {firstName(member.full_name)}
        </span>

        {/* Closed, phones: name and role beside the circle, and a plus. */}
        <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 flex h-[72px] items-center gap-3 pr-6 pl-20 md:hidden", CLOSED_LABEL)}>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] leading-tight font-display font-semibold tracking-[-0.01em]">{member.full_name}</span>
            <span className="mono-label mt-1 block truncate text-muted">{member.role}</span>
          </span>
          <CrossMark size={12} className="rotate-45 text-text/50" />
        </span>

        {/* Open: name, role, bio and links. Inert while closed, so its links are out of the tab order. */}
        <div id={panelId} inert={!active} className={DETAILS}>
          <p aria-hidden="true" className="text-[24px] leading-[1.15] font-display font-semibold tracking-[-0.01em] text-text">
            {member.full_name}
          </p>
          <p aria-hidden="true" className="mono-label mt-1.5 text-[11px] text-text/70 md:text-[11px]">
            {member.role}
          </p>
          {member.bio && (
            <p className="mt-3 line-clamp-4 max-w-[60ch] text-[13px] leading-[1.55] text-text/75 md:line-clamp-3 lg:line-clamp-2">
              {member.bio}
            </p>
          )}
          {links.length > 0 && (
            <ul className="mt-4 flex gap-2" aria-label={`${member.full_name} online`}>
              {links.map((link) => (
                <li key={link.network}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="link"
                    aria-label={`${member.full_name} on ${link.label}`}
                    className={cn(
                      "pointer-events-auto grid size-9 place-items-center rounded-full border border-text/20 bg-black/40 text-text backdrop-blur-sm",
                      "transition-colors duration-[350ms] ease-power3 hover:border-text hover:bg-text hover:text-bg",
                    )}
                  >
                    <SocialIcon network={link.network} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

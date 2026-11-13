import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { capsWidth, primarySocial, socialLinks } from "@/lib/members";
import type { Member } from "@/lib/types";
import { SpreadNav } from "./SpreadNav";

/**
 * Building blocks of the Senior Core spreads (DESIGN.md §13). Server
 * components; the data-sc-* hooks are animated by SeniorCoreTrack:
 *   data-sc-rise      a letter/line that rises out of its mask ("x": sideways, for vertical text)
 *   data-sc-portrait  revealed with clip-path inset(100% 0 0 0) → inset(0)
 *   data-sc-fade      rises 24px and fades in
 *   data-sc-blob      an iris blob; the value is its drift speed
 *   data-sc-accent    phones only: a red line that draws in (scaleX 0 → 1)
 * Everything renders in its final state (no JS, reduced motion).
 */

/**
 * Name size: the house clamp, but never wider than the column. `--col` is
 * the column's width (set by each layout) and `--em` the widest line's width
 * in em (capsWidth() in lib/members.ts). Capped at 17svh so two lines leave
 * room for the text below them.
 */
/** Put it before NAME_TYPE in cn(): tailwind-merge drops a leading-* class that precedes a font-size class. */
export const NAME_SIZE = "text-[length:min(clamp(4rem,11vw,12rem),calc(var(--col)/var(--em)),17svh)]";

/** Instrument Serif capitals (its one weight), tight leading. */
export const NAME_TYPE = "font-serif font-normal uppercase leading-[0.86] tracking-[-0.01em]";

/** Sets --em for NAME_SIZE from the name's lines. */
export function emStyle(lines: readonly string[]): CSSProperties {
  return { "--em": capsWidth(lines).toFixed(3) } as CSSProperties;
}

/** Lines in overflow-clipped masks, one [data-sc-rise] span per letter. */
export function MaskedLetters({
  lines,
  axis = "y",
  lineClassName,
}: {
  lines: readonly string[];
  axis?: "x" | "y";
  lineClassName?: string;
}) {
  return lines.map((line, li) => (
    <span key={li} className={cn("block overflow-hidden", lineClassName)}>
      {Array.from(line).map((ch, ci) =>
        ch === " " ? (
          " "
        ) : (
          <span key={ci} data-sc-rise={axis === "x" ? "x" : ""} className="inline-block">
            {ch}
          </span>
        ),
      )}
    </span>
  ));
}

/** The role line above a name ("THE PRESIDENT"): a mono label. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      data-sc-fade
      className={cn(
        "mono-label text-text/70",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A senior's portrait, always in full colour. */
export function Portrait({
  src,
  alt,
  sizes,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div data-sc-portrait className={cn("relative overflow-hidden bg-bg-2", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        draggable={false}
        className={cn(
          "object-cover select-none",
          imgClassName,
        )}
      />
    </div>
  );
}

/** A soft iris blob (a blurred maroon → red circle at 30%), behind the spread's content. Size and place it with className. */
export function Blob({ speed, className }: { speed: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-sc-blob={speed}
      className={cn(
        "pointer-events-none absolute -z-10 aspect-square rounded-full bg-iris opacity-30 blur-[clamp(48px,7vw,110px)] will-change-transform",
        className,
      )}
    />
  );
}

/** "Connect" with a long arrow line, to the member's first profile link. */
export function ConnectLink({ member, className }: { member: Member; className?: string }) {
  const link = primarySocial(member);
  if (!link) return null;
  return (
    <a
      data-sc-fade
      data-cursor="link"
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Connect with ${member.full_name} on ${link.label}`}
      className={cn(
        "group/connect mono-label inline-flex w-fit items-center gap-4 text-text",
        className,
      )}
    >
      Connect
      <span
        aria-hidden="true"
        className="relative h-px w-20 bg-text/50 transition-[width,background-color] duration-[350ms] ease-power3 group-hover/connect:w-28 group-hover/connect:bg-text md:w-28 md:group-hover/connect:w-36"
      >
        <span className="absolute top-1/2 right-0 size-2 -translate-y-1/2 rotate-45 border-t border-r border-current" />
      </span>
    </a>
  );
}

/** Mono "LI / GH / IG" links (only the networks the member has). */
export function SocialLinks({ member, className }: { member: Member; className?: string }) {
  const links = socialLinks(member);
  if (!links.length) return null;
  return (
    <ul className={cn("mono-label flex items-center gap-2 text-muted", className)} aria-label={`${member.full_name} online`}>
      {links.map((s, i) => (
        <li key={s.short} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            aria-label={`${member.full_name} on ${s.label}`}
            className="text-text/80 transition-colors duration-[350ms] hover:text-text"
          >
            {s.short}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Bottom-right of every spread: socials and prev/next arrows. */
export function SpreadFooter({
  member,
  nav,
  className,
  children,
}: {
  member?: Member;
  nav: { index: number; count: number; prev: string; next: string };
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex items-end justify-end gap-5 md:gap-7", className)}>
      <div data-sc-fade className="flex flex-col items-end gap-3">
        {member && <SocialLinks member={member} />}
        {children}
        <SpreadNav {...nav} />
      </div>
    </div>
  );
}

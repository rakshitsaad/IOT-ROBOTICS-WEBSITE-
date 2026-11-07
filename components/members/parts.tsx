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
 *   data-sc-odo       an odometer digit column (data-from / data-to, in digits)
 *   data-sc-blob      an iris blob; the value is its drift speed
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

/** Bodoni Moda capitals, tight leading. */
export const NAME_TYPE = "font-serif font-medium uppercase leading-[0.86] tracking-[-0.01em]";

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

/** "T H E   P R E S I D E N T": Sora 500, 11px, tracked 0.6em. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      data-sc-fade
      className={cn(
        "text-[11px] leading-none font-medium tracking-[0.6em] text-text/80 uppercase [word-spacing:0.5em]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Black-and-white portrait (grayscale + contrast) that turns to colour on hover over 600ms. */
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
          "object-cover grayscale contrast-110 select-none",
          "transition-[filter] duration-[600ms] ease-power3 hover:grayscale-0 hover:contrast-100",
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
        "group/connect inline-flex w-fit items-center gap-4 text-[12px] font-semibold tracking-[0.3em] text-text uppercase",
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

/**
 * "*01" in Sora 700. Each digit is a column of 0–9 twice over; entering the
 * spread rolls it like an odometer from the previous number (the ones digit
 * spins a full turn). Rendered at its final digit.
 */
export function Counter({ value, from, total }: { value: number; from: number; total: number }) {
  const to = String(value).padStart(2, "0");
  const was = String(from).padStart(2, "0");
  return (
    <p className="text-[length:clamp(3rem,6.5vw,6rem)] leading-none font-bold tracking-[-0.04em] tabular-nums">
      <span className="sr-only">
        {value} of {total}
      </span>
      <span aria-hidden="true" className="inline-flex">
        <span className="text-muted">*</span>
        {Array.from(to).map((d, k) => {
          const last = k === to.length - 1;
          const end = Number(d) + (last ? 10 : 0);
          return (
            <span key={k} className="inline-block h-[1em] overflow-hidden">
              <span
                data-sc-odo
                data-from={Number(was[k])}
                data-to={end}
                className="flex flex-col"
                style={{ transform: `translateY(${-end * 5}%)` }}
              >
                {Array.from({ length: 20 }, (_, n) => (
                  <span key={n} className="block h-[1em]">
                    {n % 10}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </p>
  );
}

/** Bottom-right of every spread: socials and prev/next arrows, then the counter. */
export function SpreadFooter({
  member,
  counter,
  nav,
  className,
  children,
}: {
  member?: Member;
  counter?: { value: number; from: number; total: number };
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
      {counter && <Counter {...counter} />}
    </div>
  );
}

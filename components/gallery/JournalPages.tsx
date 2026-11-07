"use client";

import Image from "next/image";
import { memo, useEffect, useRef, type CSSProperties } from "react";
import { MonoLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { journalDate, seeded, type JournalPage, type JournalSticker } from "@/lib/gallery";
import type { GalleryItem } from "@/lib/types";
import { JournalIcon } from "./icons";

/**
 * What is printed on a journal page (DESIGN.md §14). The page itself (4:5,
 * 6px off-white print border, shadow, 3D transform) is the fan's; these fill it.
 * Sizes inside use cqw (each page is an inline-size container), so the tag,
 * tape and handwriting scale with the page.
 *
 * - photo: full bleed; a caption becomes a handwritten paper tag, rotated -3°.
 * - video: a muted loop that plays only while centred; its poster otherwise.
 *   The <video> (and so its source) exists only within 1 page of the centre.
 * - collage: 2–3 photos at slight seeded rotations, tape on their corners, one sticker.
 * - note: ruled paper with the caption handwritten large.
 */

/** next/image sizes for a full page and for a collage photo. */
export const PAGE_SIZES = "(min-width: 768px) 480px, 80vw";
const COLLAGE_SIZES = "(min-width: 768px) 300px, 50vw";

export interface JournalPageContentProps {
  page: JournalPage;
  /** Load images now (the centre and its neighbours), not lazily. */
  eager: boolean;
  /** Preload the first image (the page the viewer opens on). */
  preload: boolean;
  /** Videos: mount the <video> (within 1 of the centre). */
  loadVideo: boolean;
  /** Videos: play now (centred, journal view, motion allowed). */
  playing: boolean;
  muted: boolean;
  /** The event's start, for the note's date. */
  date: string;
}

export const JournalPageContent = memo(function JournalPageContent(props: JournalPageContentProps) {
  switch (props.page.kind) {
    case "photo":
      return <PhotoPage {...props} item={props.page.items[0]} />;
    case "video":
      return <VideoPage {...props} item={props.page.items[0]} />;
    case "collage":
      return <CollagePage {...props} />;
    case "note":
      return <NotePage item={props.page.items[0]} date={props.date} />;
  }
});

function PhotoPage({ item, eager, preload }: JournalPageContentProps & { item: GalleryItem }) {
  return (
    <div className="relative size-full overflow-hidden rounded-[12px] bg-bg-2">
      <Image
        src={item.url!}
        alt={item.alt}
        fill
        sizes={PAGE_SIZES}
        preload={preload}
        loading={eager || preload ? "eager" : "lazy"}
        draggable={false}
        className="object-cover"
      />
      {item.caption && <CaptionTag text={item.caption} />}
    </div>
  );
}

function VideoPage({ item, eager, preload, loadVideo, playing, muted }: JournalPageContentProps & { item: GalleryItem }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing, loadVideo]);

  // `muted` as a React prop only sets the initial attribute, so keep the property in sync.
  useEffect(() => {
    if (video.current) video.current.muted = muted;
  }, [muted, loadVideo]);

  return (
    <div className="relative size-full overflow-hidden rounded-[12px] bg-bg-2">
      {item.poster_url && (
        <Image
          src={item.poster_url}
          alt={loadVideo ? "" : item.alt}
          fill
          sizes={PAGE_SIZES}
          preload={preload}
          loading={eager || preload ? "eager" : "lazy"}
          draggable={false}
          className="object-cover"
        />
      )}
      {loadVideo && (
        <video
          ref={video}
          src={item.url!}
          poster={item.poster_url ?? undefined}
          aria-label={item.alt}
          muted
          loop
          playsInline
          preload={playing ? "auto" : "metadata"}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[4cqw] left-[4cqw] grid size-[9cqw] place-items-center rounded-full bg-bg/70 text-text backdrop-blur-sm",
          "transition-opacity duration-[350ms] ease-power3",
          playing && "opacity-0",
        )}
      >
        <JournalIcon name="play" className="size-[4.4cqw] translate-x-[0.3cqw]" />
      </span>
      {item.caption && <CaptionTag text={item.caption} />}
    </div>
  );
}

/** A handwritten caption on a small paper tag, rotated -3°, in the bottom-left corner. */
function CaptionTag({ text }: { text: string }) {
  return (
    <span
      className={cn(
        "paper absolute bottom-[5cqw] left-[5cqw] flex max-w-[76%] -rotate-3 items-center gap-[2.4cqw] rounded-[0.8cqw]",
        "py-[1.8cqw] pr-[3.4cqw] pl-[2.4cqw] shadow-[0_1.5cqw_4cqw_-1cqw] shadow-black/55",
      )}
    >
      <span aria-hidden="true" className="size-[1.9cqw] shrink-0 rounded-full bg-bg/55 ring-[0.5cqw] ring-bg/10" />
      <span className="font-hand text-[length:6.6cqw] leading-[1.02] text-bg">{text}</span>
    </span>
  );
}

/* --------------------------------------------------------------- collage */

interface Slot {
  /** Box in % of the page. */
  l: number;
  t: number;
  w: number;
  h: number;
  /** Base rotation, degrees (a seeded ±1.2° is added). */
  r: number;
}

const SLOTS: Record<2 | 3, Slot[]> = {
  2: [
    { l: 6, t: 6, w: 64, h: 47, r: -4 },
    { l: 30, t: 47, w: 64, h: 46, r: 3 },
  ],
  3: [
    { l: 5, t: 4, w: 58, h: 37, r: -3 },
    { l: 38, t: 31, w: 56, h: 36, r: 4 },
    { l: 7, t: 60, w: 55, h: 35, r: -2 },
  ],
};

const STICKER_SPOT: Record<2 | 3, { l: number; t: number }> = {
  2: { l: 75, t: 9 },
  3: { l: 73, t: 74 },
};

function CollagePage({ page, eager, preload }: JournalPageContentProps) {
  const count = page.items.length >= 3 ? 3 : 2;
  const slots = SLOTS[count];
  const spot = STICKER_SPOT[count];

  return (
    <div className="paper relative size-full overflow-hidden rounded-[12px]">
      {page.items.slice(0, 3).map((item, i) => {
        const slot = slots[i];
        const rotate = slot.r + (seeded(item.id, 1) - 0.5) * 2.4;
        const style: CSSProperties = {
          left: `${slot.l}%`,
          top: `${slot.t}%`,
          width: `${slot.w}%`,
          height: `${slot.h}%`,
          transform: `rotate(${rotate.toFixed(2)}deg)`,
        };
        return (
          <div
            key={item.id}
            data-flip-id={item.id}
            style={style}
            className="absolute bg-white p-[1.6cqw] shadow-[0_1.6cqw_4cqw_-1.2cqw] shadow-black/50"
          >
            <div className="relative size-full overflow-hidden bg-bg-2">
              <Image
                src={item.url!}
                alt={item.alt}
                fill
                sizes={COLLAGE_SIZES}
                preload={preload && i === 0}
                loading={eager || preload ? "eager" : "lazy"}
                draggable={false}
                className="object-cover"
              />
            </div>
            <Tape corner={i % 2 === 0 ? "tl" : "tr"} seed={item.id} />
            <Tape corner={i % 2 === 0 ? "br" : "bl"} seed={item.id} salt={2} />
          </div>
        );
      })}
      <Sticker
        kind={page.sticker ?? "star"}
        style={{
          left: `${spot.l}%`,
          top: `${spot.t}%`,
          transform: `rotate(${((seeded(page.key, 3) - 0.5) * 40).toFixed(1)}deg)`,
        }}
      />
    </div>
  );
}

const TAPE_CORNER = {
  tl: "-top-[2.6cqw] -left-[5cqw] -rotate-[38deg]",
  tr: "-top-[2.6cqw] -right-[5cqw] rotate-[38deg]",
  bl: "-bottom-[2.6cqw] -left-[5cqw] rotate-[38deg]",
  br: "-bottom-[2.6cqw] -right-[5cqw] -rotate-[38deg]",
} as const;

/** A strip of translucent tape across a photo's corner. */
function Tape({ corner, seed, salt = 1 }: { corner: keyof typeof TAPE_CORNER; seed: string; salt?: number }) {
  const width = 17 + seeded(seed, salt + 10) * 6;
  return (
    <span
      aria-hidden="true"
      style={{ width: `${width.toFixed(1)}cqw` }}
      className={cn(
        "absolute h-[5.6cqw] bg-white/45 shadow-[0_0.3cqw_0.8cqw] shadow-black/15 backdrop-blur-[1px]",
        "[clip-path:polygon(2%_0,98%_6%,100%_100%,0_94%)]",
        TAPE_CORNER[corner],
      )}
    />
  );
}

/** The collage's one sticker: a star, a spark or the club logo, die-cut with a white edge. */
function Sticker({ kind, style }: { kind: JournalSticker; style: CSSProperties }) {
  if (kind === "logo") {
    return (
      <span
        aria-hidden="true"
        style={style}
        className="absolute grid size-[15cqw] place-items-center rounded-full bg-white p-[1.4cqw] shadow-[0_1cqw_2.4cqw_-0.6cqw] shadow-black/50"
      >
        <Image src="/logo.svg" alt="" width={64} height={64} unoptimized className="size-full" draggable={false} />
      </span>
    );
  }
  const path =
    kind === "star"
      ? "M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5-4.8-4.5 6.5-.8z"
      : "M12 2c.6 5.2 2.8 7.4 8 8-5.2.6-7.4 2.8-8 8-.6-5.2-2.8-7.4-8-8 5.2-.6 7.4-2.8 8-8z";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={style}
      className={cn(
        "absolute size-[16cqw] drop-shadow-md drop-shadow-black/40",
        kind === "star" ? "text-red" : "text-maroon",
      )}
    >
      <path d={path} fill="currentColor" strokeWidth="1.6" strokeLinejoin="round" paintOrder="stroke" className="stroke-white" />
    </svg>
  );
}

/* ------------------------------------------------------------------ note */

function NotePage({ item, date }: { item: GalleryItem; date: string }) {
  return (
    <div className="paper-ruled relative flex size-full flex-col overflow-hidden rounded-[12px] pt-[11cqw] pr-[8cqw] pb-[8cqw] pl-[17cqw] [--rule:9cqw]">
      <MonoLabel className="absolute top-[4.2cqw] right-[7cqw] text-[length:2.6cqw] tracking-[0.14em] text-bg/45">
        {journalDate(date)}
      </MonoLabel>
      <p className="font-hand text-[length:8.6cqw] leading-[9cqw] text-bg/85 [text-wrap:pretty]">{item.caption}</p>
    </div>
  );
}

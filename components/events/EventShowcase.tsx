"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Countdown } from "@/components/home/Countdown";
import { IrisButton, PillButton } from "@/components/ui";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { EVENT_BANNER, EVENTS_MOTION as M, type ShowcaseEvent } from "@/lib/events";
import { gsap } from "@/lib/gsap";
import { EventThumbs } from "./EventThumbs";
import { DetailsLine, EventIcon, SplitTitle } from "./parts";

/**
 * The /events feature card (DESIGN.md §17). One event at a time:
 *
 * - The banner fills the card. Its box is computed in CSS (container units) instead of object-cover, so the
 *   cutout can sit in exactly the same box in a layer the card doesn't clip at the top: the figure's head pokes
 *   out above the card. The cutout fades out over the card's middle, where the banner underneath is identical.
 * - Switching: the title, details, thumbnails and cutout fade down (250ms); once the next banner has loaded (or
 *   after 1s), it wipes in over the old one while scaling 1.08 → 1, the cutout rises 40px, the letters rise, the
 *   details and thumbnails follow. The first appearance plays the same steps as CSS keyframes from the server
 *   HTML (`intro`), so nothing waits for hydration.
 * - Reduced motion: no wipe, scale, rise or stagger; the content crossfades.
 *
 * The parent owns which event is active; this component owns what is on screen while it changes.
 */

const LOAD_TIMEOUT = 1000;

interface Props {
  list: ShowcaseEvent[];
  active: ShowcaseEvent;
  /** Autoplay is running (not paused by interaction, reduced motion or a single event). */
  autoplay: boolean;
  /** Autoplay is held (hover, off screen, an overlay). */
  paused: boolean;
  onSelect(slug: string): void;
  onStep(dir: 1 | -1): void;
  onAutoNext(): void;
  onHover(hovering: boolean): void;
  onExpand(): void;
  onPhoto(index: number): void;
  reduced: boolean;
}

export function EventShowcase({ list, active, autoplay, paused, onSelect, onStep, onAutoNext, onHover, onExpand, onPhoto, reduced }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(active);
  const [prev, setPrev] = useState<ShowcaseEvent | null>(null);
  const [incoming, setIncoming] = useState<ShowcaseEvent | null>(null);
  const [intro, setIntro] = useState(true);
  const enter = useRef<gsap.core.Timeline | null>(null);
  const leaving = useRef(false);
  const loaded = useRef(new Set<string>());
  const waiters = useRef(new Map<string, () => void>());

  const q = useCallback((sel: string) => (root.current ? gsap.utils.toArray<HTMLElement>(sel, root.current) : []), []);

  const onBannerLoad = useCallback((slug: string) => {
    loaded.current.add(slug);
    waiters.current.get(slug)?.();
    waiters.current.delete(slug);
  }, []);

  const whenLoaded = useCallback(
    (slug: string) =>
      new Promise<void>((resolve) => {
        if (loaded.current.has(slug)) return resolve();
        const t = window.setTimeout(resolve, LOAD_TIMEOUT);
        waiters.current.set(slug, () => {
          window.clearTimeout(t);
          resolve();
        });
      }),
    [],
  );

  /* ------------------------------------------------- leave, then hand over */
  useEffect(() => {
    if (active.slug === shown.slug) {
      // Switched back before the hand-over: bring the content back.
      if (leaving.current) {
        leaving.current = false;
        gsap.to(q("[data-ev-leave]"), { opacity: 1, y: 0, duration: M.leave, ease: "power2.out", overwrite: true });
      }
      return;
    }
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start loading the next banner during the leave
    setIncoming(active);
    // Finish an entrance still playing, so the old banner is whole before it is covered.
    enter.current?.progress(1).kill();
    leaving.current = true;
    const reduce = prefersReducedMotion();
    const left = new Promise<void>((resolve) =>
      gsap.to(q("[data-ev-leave]"), {
        opacity: 0,
        y: reduce ? 0 : 12,
        duration: reduce ? M.crossfade / 2 : M.leave,
        ease: "power2.in",
        overwrite: true,
        onComplete: resolve,
      }),
    );
    Promise.all([left, whenLoaded(active.slug)]).then(() => {
      if (!live) return;
      leaving.current = false;
      setIntro(false);
      setPrev(shown);
      setShown(active);
      setIncoming(null);
    });
    return () => {
      live = false;
    };
  }, [active, shown, q, whenLoaded]);

  /* ------------------------------------------------------------ entrance */
  useLayoutEffect(() => {
    if (intro) return;
    const reduce = prefersReducedMotion();
    const banner = q(`[data-ev-banner="${shown.slug}"]`)[0];
    const img = banner?.querySelector("img");
    const cutout = q("[data-ev-cutout]");
    const tl = gsap.timeline({ onComplete: () => setPrev(null) });
    // Some steps have nothing to move (no cutout, no thumbnails): skip them rather than tween nothing.
    const step = (targets: (Element | null | undefined)[], from: gsap.TweenVars, to: gsap.TweenVars, at: number) => {
      const els = targets.filter((el): el is Element => !!el);
      if (els.length) tl.fromTo(els, from, to, at);
    };
    if (reduce) {
      step([banner, ...cutout, ...q("[data-ev-leave]")], { opacity: 0 }, { opacity: 1, duration: M.crossfade, ease: "none" }, 0);
    } else {
      step(
        [banner],
        { clipPath: "inset(0% 100% 0% 0%)", opacity: 0 },
        { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: M.banner, ease: "expo.out" },
        0,
      );
      step([img], { scale: M.bannerScale }, { scale: 1, duration: M.banner, ease: "expo.out" }, 0);
      step(cutout, { y: M.cutoutRise, opacity: 0 }, { y: 0, opacity: 1, duration: M.banner, ease: "expo.out" }, M.cutoutAt);
      step(q("[data-ev-char]"), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: M.titleStagger }, M.titleAt);
      step(q("[data-ev-details]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, M.detailsAt);
      step(q("[data-ev-thumb]"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: M.thumbsStagger }, M.thumbsAt);
    }
    // The timeline is exactly as long as the banner's wipe at least, so the old banner goes once it is covered.
    tl.set({}, {}, M.banner);
    enter.current = tl;
    return () => {
      tl.kill();
    };
    // Only when a new event is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.slug]);

  /* ---------------------------------------------------------------- swipe */
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-no-swipe]")) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.abs(e.clientX - d.x) > 8 && Math.abs(e.clientX - d.x) > Math.abs(e.clientY - d.y)) d.moved = true;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.moved) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) < Math.min(80, window.innerWidth * 0.12)) return;
    suppressClick.current = true;
    onStep(dx < 0 ? 1 : -1);
  };

  const index = list.findIndex((e) => e.slug === active.slug);
  const others = list.filter((e) => e.slug !== shown.slug);
  const banners = [prev, shown, incoming].filter((e, i, all): e is ShowcaseEvent => !!e && all.findIndex((x) => x?.slug === e.slug) === i);

  return (
    <div className="relative mx-auto w-[calc(100%-2rem)] md:w-[86vw]">
      <div
        ref={root}
        data-cursor="drag"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${list.length}: ${active.title}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHover(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHover(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="relative h-[70svh] touch-pan-y [container-type:size] select-none md:h-[62vh]"
        style={
          {
            // The banner box: covers the card; crops the top first (up to cropTop), then the bottom.
            "--bw": `max(100cqw, 100cqh * ${EVENT_BANNER.ratio})`,
            "--bh": `calc(var(--bw) / ${EVENT_BANNER.ratio})`,
            "--by": `calc(-1 * min(var(--bh) - 100cqh, var(--bh) * ${EVENT_BANNER.cropTop}))`,
            // Room above the card for the cutout.
            "--above": "45cqh",
            "--pad": "clamp(1.1rem, 3.2cqw, 3rem)",
          } as CSSProperties
        }
      >
        {/* The card: banners and their shading, clipped. */}
        <div className="absolute inset-0 isolate overflow-hidden rounded-card bg-bg-2 ring-1 ring-line">
          {banners.map((e) => {
            const isTop = e.slug === shown.slug;
            const isIncoming = incoming?.slug === e.slug;
            const first = intro && isTop;
            return (
              <div
                key={e.slug}
                data-ev-banner={e.slug}
                aria-hidden={!isTop}
                className={cn("absolute inset-0", isIncoming && "opacity-0", first && "animate-wipe-in motion-reduce:animate-none")}
              >
                <div className="absolute top-(--by) left-(--bx) h-(--bh) w-(--bw)" style={bannerX(e)}>
                  {e.banner_url && (
                    <Image
                      src={e.banner_url}
                      alt={isTop ? `${e.title} banner` : ""}
                      fill
                      sizes="(min-width: 768px) 90vw, 300vw"
                      preload={first}
                      loading={first ? undefined : "eager"}
                      onLoad={() => onBannerLoad(e.slug)}
                      className={cn("object-cover", first && "animate-settle motion-reduce:animate-none")}
                    />
                  )}
                  {/* Warm the cache for the incoming cutout, so it is there when the event comes in. */}
                  {isIncoming && e.cutout_url && (
                    <Image src={e.cutout_url} alt="" fill sizes="(min-width: 768px) 90vw, 300vw" loading="eager" className="opacity-0" />
                  )}
                </div>
              </div>
            );
          })}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[65%] bg-linear-to-t from-bg/90 via-bg/45 to-transparent md:h-1/2" />
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[40%] bg-linear-to-r from-bg/75 to-transparent" />
        </div>

        {/* The pop-out: the cutout in the same box, clipped at the card's sides but free above it. */}
        {shown.cutout_url && (
          <div
            key={`cut-${shown.slug}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-(--above) bottom-0 overflow-clip [--fade-a:12cqh] [--fade-b:32cqh] md:[--fade-a:40cqh] md:[--fade-b:62cqh]"
            style={{
              // Fades out over the card's middle (phones: its upper third, where the title starts), where the banner
              // underneath shows the same figure, darkened by the card's gradients.
              maskImage: "linear-gradient(to bottom, black calc(var(--above) + var(--fade-a)), transparent calc(var(--above) + var(--fade-b)))",
            }}
          >
            <div
              data-ev-cutout
              data-ev-leave
              className={cn(
                "absolute left-(--bx) h-[calc(var(--bh)*1.2)] w-(--bw) top-[calc(var(--above)+var(--by)-var(--bh)*0.2)]",
                intro && "animate-pop-up motion-reduce:animate-none",
              )}
              style={{ ...bannerX(shown), ...(intro ? { animationDelay: `${M.cutoutAt * 1000}ms` } : null) }}
            >
              <Image
                src={shown.cutout_url}
                alt=""
                fill
                sizes="(min-width: 768px) 90vw, 300vw"
                preload={intro}
                loading={intro ? undefined : "eager"}
                className="object-fill"
              />
            </div>
          </div>
        )}

        {/* Content. */}
        <div key={`content-${shown.slug}`} className="absolute inset-0 flex flex-col justify-end gap-[clamp(0.9rem,3cqh,1.75rem)] p-(--pad)">
          <div className="max-w-[min(64cqw,54rem)] max-md:max-w-none">
            <h2
              data-ev-leave
              id="event-showcase-title"
              className="text-[length:clamp(2rem,9vw,3rem)] leading-[0.98] font-bold tracking-[-0.04em] text-white md:text-[length:clamp(2.5rem,min(6vw,11cqh),5.5rem)]"
            >
              <SplitTitle text={shown.title} intro={intro} delay={M.titleAt} stagger={M.titleStagger} />
            </h2>
            <div
              data-ev-leave
              data-ev-details
              className={cn("mt-4", intro && "animate-fade-up motion-reduce:animate-none")}
              style={intro ? { animationDelay: `${M.detailsAt * 1000}ms` } : undefined}
            >
              <DetailsLine event={shown} />
            </div>
            <EventActions event={shown} intro={intro} />
          </div>
          <EventThumbs event={shown} others={others} intro={intro} onPhoto={onPhoto} onEvent={onSelect} />
        </div>

        {/* Controls. */}
        <button
          type="button"
          onClick={onExpand}
          data-cursor="link"
          aria-label={`Open ${shown.title} details`}
          className="absolute top-(--pad) right-(--pad) grid size-11 place-items-center rounded-full bg-bg/35 text-text ring-1 ring-text/20 backdrop-blur-md transition-[background-color,scale] duration-[350ms] ease-power3 hover:scale-105 hover:bg-bg/55 md:size-12"
        >
          <EventIcon name="expand" />
        </button>
        {list.length > 1 && (
          <>
            <EdgeArrow dir={-1} onClick={() => onStep(-1)} />
            <EdgeArrow dir={1} onClick={() => onStep(1)} />
          </>
        )}
      </div>

      <Progress list={list} index={index} autoplay={autoplay && !reduced} paused={paused} onPick={onSelect} onDone={onAutoNext} />
    </div>
  );
}

/** Horizontal placement of a banner box: centred on the event's focus, never leaving a gap. */
function bannerX(e: ShowcaseEvent): CSSProperties {
  const fx = (e.banner_focal_x ?? 50) / 100;
  return { "--bx": `clamp(100cqw - var(--bw), 50cqw - ${fx} * var(--bw), 0px)` } as CSSProperties;
}

function EventActions({ event, intro }: { event: ShowcaseEvent; intro: boolean }) {
  const upcoming = event.status === "upcoming";
  if (!upcoming && !event.has_gallery) return null;
  return (
    <div
      data-ev-leave
      data-ev-details
      className={cn("mt-[clamp(0.9rem,2.6cqh,1.5rem)] flex flex-wrap items-center gap-x-6 gap-y-3", intro && "animate-fade-up motion-reduce:animate-none")}
      style={intro ? { animationDelay: `${(M.detailsAt + 0.08) * 1000}ms` } : undefined}
    >
      {upcoming ? (
        <>
          <Countdown to={event.starts_at} size="sm" className="text-white" />
          {event.registration_url && (
            <IrisButton href={event.registration_url} size="md" arrow data-cursor="link">
              Register
            </IrisButton>
          )}
        </>
      ) : (
        <PillButton href={`/gallery/${event.slug}`} variant="ghost" size="md" arrow data-cursor="link" className="bg-bg/30 backdrop-blur-md">
          View gallery
        </PillButton>
      )}
    </div>
  );
}

function EdgeArrow({ dir, onClick }: { dir: 1 | -1; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="link"
      aria-label={dir < 0 ? "Previous event" : "Next event"}
      className={cn(
        "absolute top-[30%] grid size-11 -translate-y-1/2 place-items-center md:top-1/2 rounded-full bg-bg/45 text-text ring-1 ring-text/20 backdrop-blur-md md:size-14",
        "transition-[background-color,scale] duration-[350ms] ease-power3 hover:scale-105 hover:bg-bg/70",
        dir < 0 ? "left-2 md:left-0 md:-translate-x-1/2" : "right-2 md:right-0 md:translate-x-1/2",
      )}
    >
      <EventIcon name={dir < 0 ? "prev" : "next"} />
    </button>
  );
}

/** Which event is active out of the list; the active segment fills over the autoplay interval. */
function Progress({
  list,
  index,
  autoplay,
  paused,
  onPick,
  onDone,
}: {
  list: ShowcaseEvent[];
  index: number;
  autoplay: boolean;
  paused: boolean;
  onPick(slug: string): void;
  onDone(): void;
}) {
  return (
    <div className="mt-5 flex items-center gap-4 md:mt-6">
      <ol className="flex flex-1 items-center gap-1.5" aria-label="Events">
        {list.map((e, i) => (
          <li key={e.slug} className="flex-1">
            <button
              type="button"
              onClick={() => onPick(e.slug)}
              aria-label={`${i + 1} of ${list.length}: ${e.title}`}
              aria-current={i === index ? "true" : undefined}
              data-cursor="link"
              className="group/seg block w-full py-2.5"
            >
              <span className="relative block h-[3px] overflow-hidden rounded-pill bg-text/15 transition-colors duration-[350ms] group-hover/seg:bg-text/30">
                {i < index && <span className="absolute inset-0 bg-text/45" />}
                {i === index && (
                  <span
                    key={`${e.slug}-${autoplay}`}
                    className={cn("absolute inset-0 origin-left bg-text", autoplay && "animate-grow-x")}
                    style={autoplay ? { animationDuration: `${M.autoplay}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                    onAnimationEnd={autoplay ? onDone : undefined}
                  />
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <span className="mono-label text-muted tabular-nums">
        {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
      </span>
    </div>
  );
}

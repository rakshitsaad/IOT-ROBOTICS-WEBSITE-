"use client";

import Image from "next/image";
import { animate, motion, useMotionValue, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MonoLabel, PillButton } from "@/components/ui";
import { botActions, useBotStore } from "@/components/robot";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { BEZIER, DURATION } from "@/lib/motion";

/**
 * Section D's carousel: one full-width slide at a time, looping.
 * - Autoplays every AUTOPLAY_MS; the active indicator pill fills over that
 *   time (its CSS animation ending is the timer). Paused while dragging, while
 *   the carousel is mostly off screen, and with the pause button.
 * - Drag or swipe to move (Motion drag); arrow keys when focused.
 * - When the slide changes while the robot is in its "slider" scene, it
 *   looks surprised.
 * - Reduced motion: no autoplay, slides change without the slide animation.
 *
 * Slides are rendered at virtual positions (pos - 1 … pos + 1, where pos is an
 * unbounded index) on a track moved by one motion value, so looping never
 * jumps backwards across every slide.
 */

const AUTOPLAY_MS = 5000;
const GAP = 12;

export interface SliderProject {
  id: string;
  slug: string;
  title: string;
  year: number;
  tags: string[];
  cover_url: string;
}

export function FeaturedSlider({ projects }: { projects: SliderProject[] }) {
  const n = projects.length;
  const reduced = useReducedMotion();
  const viewport = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(false);
  const dragged = useRef(false);
  const lastStep = useRef(0);

  const index = mod(pos, n);
  const step = width + GAP;
  const autoplay = !reduced && n > 1;
  const running = autoplay && !paused && !dragging && inView;

  // Measure the slide width.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Autoplay only while the carousel is on screen.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Move the track to the current slide: animated on navigation, instant on resize.
  useEffect(() => {
    if (!width) return;
    const target = -pos * step;
    const resized = lastStep.current !== step;
    lastStep.current = step;
    if (resized || prefersReducedMotion()) {
      x.set(target);
      return;
    }
    const controls = animate(x, target, { duration: DURATION.base, ease: BEZIER.expo });
    return () => controls.stop();
  }, [pos, step, width, x]);

  // The robot reacts to slide changes while it is watching the slider.
  const firstIndex = useRef(index);
  useEffect(() => {
    if (index === firstIndex.current) return;
    firstIndex.current = -1;
    if (useBotStore.getState().scene?.id === "slider") botActions.react("surprised", 900);
  }, [index]);

  const go = useCallback((dir: number) => setPos((p) => p + dir), []);
  const goTo = (i: number) => {
    let d = mod(i - index, n);
    if (d > n / 2) d -= n;
    if (d) setPos((p) => p + d);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    const threshold = Math.min(160, width * 0.18);
    const dir =
      info.offset.x < -threshold || info.velocity.x < -500 ? 1 : info.offset.x > threshold || info.velocity.x > 500 ? -1 : 0;
    if (dir) go(dir);
    else animate(x, -pos * step, { duration: DURATION.fast, ease: BEZIER.out });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else return;
    e.preventDefault();
  };

  if (!n) return null;
  const visible = width && n > 1 ? [pos - 1, pos, pos + 1] : [pos];

  return (
    <div
      ref={viewport}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured projects"
      onKeyDown={onKeyDown}
      data-cursor={n > 1 ? "drag" : undefined}
      className="relative h-[80svh] min-h-[30rem] overflow-hidden rounded-card bg-bg-2 focus-visible:outline-offset-4"
    >
      <motion.div
        className="absolute inset-0 touch-pan-y"
        style={{ x }}
        drag={n > 1 ? "x" : false}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
          setDragging(true);
        }}
        onDragEnd={onDragEnd}
        onPointerDown={() => (dragged.current = false)}
        // A drag that ends over a link must not follow it.
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {visible.map((v) => {
          const i = mod(v, n);
          const p = projects[i];
          const active = v === pos;
          return (
            <div
              key={v}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}: ${p.title}`}
              aria-hidden={!active}
              inert={!active}
              className="absolute top-0 h-full"
              style={width ? { left: v * step, width } : { left: 0, width: "100%" }}
            >
              <Image
                src={p.cover_url}
                alt=""
                fill
                sizes="100vw"
                draggable={false}
                className="object-cover select-none"
              />
              <div className="absolute inset-0 bg-linear-to-t from-bg/95 via-bg/40 to-bg/0" />
              <div className="absolute inset-x-0 bottom-0 p-6 pb-24 md:max-w-[min(46%,40rem)] md:p-12 md:pb-12">
                <MonoLabel tone="text">
                  Featured / {p.year}
                </MonoLabel>
                <h3 className="mt-3 text-[length:clamp(2.2rem,5vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">
                  {p.title}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                  {p.tags.map((tag) => (
                    <li key={tag} className="mono-label rounded-pill border border-text/20 bg-bg/40 px-3 py-1.5 text-text">
                      {tag}
                    </li>
                  ))}
                </ul>
                <PillButton href={`/projects/${p.slug}`} size="sm" arrow className="mt-6" draggable={false}>
                  Explore
                </PillButton>
              </div>
            </div>
          );
        })}
      </motion.div>

      <MonoLabel tone="text" className="pointer-events-none absolute top-6 left-6 md:top-10 md:left-12">
        Featured projects
      </MonoLabel>

      {n > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 md:bottom-10">
          <div className="flex items-center gap-2">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Show ${p.title}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
                className={cn(
                  "relative h-2 overflow-hidden rounded-pill bg-text/30 transition-[width,background-color] duration-[600ms] ease-expo hover:bg-text/50",
                  i === index ? "w-12" : "w-2",
                )}
              >
                {i === index &&
                  (autoplay ? (
                    <span
                      key={pos}
                      className="absolute inset-0 origin-left animate-grow-x rounded-pill bg-text"
                      style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                      onAnimationEnd={() => {
                        if (!prefersReducedMotion()) go(1);
                      }}
                    />
                  ) : (
                    <span className="absolute inset-0 rounded-pill bg-text" />
                  ))}
              </button>
            ))}
          </div>
          {autoplay && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              className="grid size-8 place-items-center rounded-full border border-text/20 bg-bg/50 text-text transition-colors duration-[350ms] hover:bg-bg/80"
            >
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                {paused ? <path d="M2 1l7 4-7 4z" /> : <path d="M2 1h2v8H2zM6 1h2v8H6z" />}
              </svg>
            </button>
          )}
        </div>
      )}

      <p className="sr-only" aria-live={running ? "off" : "polite"}>
        Slide {index + 1} of {n}: {projects[index].title}
      </p>
    </div>
  );
}

function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

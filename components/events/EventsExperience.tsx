"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { downloadMedia, mediaFileName } from "@/components/gallery/download";
import { Lightbox } from "@/components/gallery/Lightbox";
import { MonoLabel, Pill } from "@/components/ui";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { eventFilters, matchesFilter, type EventFilter, type ShowcaseEvent } from "@/lib/events";
import { useUIStore } from "@/lib/store";
import type { GalleryItem } from "@/lib/types";
import { AllEvents } from "./AllEvents";
import { EventDetail } from "./EventDetail";
import { EventShowcase } from "./EventShowcase";
import { EventTint, useEventColor } from "./EventTint";

/**
 * The /events page (DESIGN.md §17): the heading and filters, the feature card, the "All events" grid, the detail
 * overlay and the lightbox. Owns the active event and the autoplay:
 *
 * - Next event every 7s, held while the pointer is over the card, while the card is mostly off screen, while the
 *   tab is hidden or an overlay is open, and stopped for good once the visitor does anything (arrows, keys, swipe,
 *   thumbnails, progress, filters, the grid). Never under reduced motion.
 * - ← / → anywhere on the page (not in fields, the menu or an overlay).
 */
export function EventsExperience({ events }: { events: ShowcaseEvent[] }) {
  const reduced = useReducedMotion();
  const menuOpen = useUIStore((s) => s.menuOpen);
  const lenis = useUIStore((s) => s.lenis);

  const [filter, setFilter] = useState<EventFilter>("all");
  const list = useMemo(() => events.filter((e) => matchesFilter(e, filter)), [events, filter]);
  const [activeSlug, setActiveSlug] = useState(events[0]?.slug);
  const active = list.find((e) => e.slug === activeSlug) ?? list[0];

  const [detail, setDetail] = useState(false);
  const [lightbox, setLightbox] = useState<{ slug: string; index: number } | null>(null);
  // The lightbox stays mounted through its exit fade, and only un-inerts the page when it unmounts.
  const [lightboxMounted, setLightboxMounted] = useState(false);
  const openLightbox = useCallback((slug: string, index: number) => {
    setLightboxMounted(true);
    setLightbox({ slug, index });
  }, []);

  /* Autoplay state. */
  const [interacted, setInteracted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const autoplay = !reduced && !interacted && list.length > 1;
  const paused = hovering || offscreen || hidden || detail || lightbox !== null || menuOpen;

  const showcase = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = showcase.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOffscreen(entry.intersectionRatio < 0.35), { threshold: [0, 0.35, 1] });
    io.observe(el);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const select = useCallback((slug: string, user = true) => {
    if (user) setInteracted(true);
    setActiveSlug(slug);
  }, []);

  const step = useCallback(
    (dir: 1 | -1, user = true) => {
      if (!active || list.length < 2) return;
      const i = list.findIndex((e) => e.slug === active.slug);
      select(list[(i + dir + list.length) % list.length].slug, user);
    },
    [active, list, select],
  );

  /* Keys. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || menuOpen || detail || lightbox) return;
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, menuOpen, detail, lightbox]);

  const changeFilter = (value: EventFilter) => {
    setInteracted(true);
    setFilter(value);
    const next = events.filter((e) => matchesFilter(e, value));
    if (!next.some((e) => e.slug === activeSlug) && next[0]) setActiveSlug(next[0].slug);
  };

  const pickFromGrid = (slug: string) => {
    setInteracted(true);
    if (!list.some((e) => e.slug === slug)) setFilter("all");
    setActiveSlug(slug);
    const el = showcase.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 24;
    if (lenis) lenis.scrollTo(Math.max(0, top - offsetTop()), { duration: 1.2 });
    else window.scrollTo({ top: Math.max(0, top - offsetTop()), behavior: reduced ? "auto" : "smooth" });
  };

  const color = useEventColor(active ?? { accent_color: null, banner_url: null });

  const lightboxEvent = lightbox ? events.find((e) => e.slug === lightbox.slug) : undefined;
  const download = useCallback(
    (item: GalleryItem) => {
      if (!item.url || !lightboxEvent) return;
      const n = lightboxEvent.photos.findIndex((p) => p.id === item.id) + 1;
      void downloadMedia(item.url, mediaFileName(lightboxEvent.slug, n, item.type, item.url), item.type);
    },
    [lightboxEvent],
  );
  const closeDetail = useCallback(() => setDetail(false), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const filters = eventFilters(events);

  return (
    <>
      <EventTint color={color} />

      <section ref={showcase} aria-roledescription="carousel" aria-labelledby="events-title" className="pt-header">
        <div className="shell pt-[clamp(1.5rem,4svh,3rem)]">
          <MonoLabel as="h1" id="events-title" tone="text">
            Events / [{String(events.length).padStart(2, "0")}] Total
          </MonoLabel>
          <div role="group" aria-label="Filter events" className="mt-5 flex flex-wrap gap-2">
            {filters.map(({ value, label }) => {
              const on = filter === value;
              return (
                <button key={label} type="button" aria-pressed={on} onClick={() => changeFilter(value)} data-cursor="link" className="group/pill rounded-pill">
                  <Pill
                    color={on ? "white" : "raised"}
                    className={cn(
                      "block px-4 py-2.5 text-[13px] leading-none font-semibold",
                      "transition-[background-color,color] duration-[350ms] ease-power3",
                      !on && "group-hover/pill:bg-text/10",
                    )}
                  >
                    {label}
                  </Pill>
                </button>
              );
            })}
          </div>
        </div>

        {/* Room for the pop-out above the card: about 7% of the width on wide screens, 30px on phones. */}
        <div className="pt-[max(3rem,8.5vw)] md:pt-[max(4rem,8vw)]">
          {active ? (
            <EventShowcase
              list={list}
              active={active}
              autoplay={autoplay}
              paused={paused}
              reduced={reduced}
              onSelect={select}
              onStep={step}
              onAutoNext={() => step(1, false)}
              onHover={setHovering}
              onExpand={() => {
                setInteracted(true);
                setDetail(true);
              }}
              onPhoto={(index) => {
                setInteracted(true);
                openLightbox(active.slug, index);
              }}
            />
          ) : (
            <p className="shell text-muted">No events here yet.</p>
          )}
        </div>
        <p aria-live="polite" className="sr-only">
          {active ? `${list.findIndex((e) => e.slug === active.slug) + 1} of ${list.length}: ${active.title}` : ""}
        </p>
      </section>

      <AllEvents events={events} active={active?.slug ?? ""} onPick={pickFromGrid} />

      <AnimatePresence>
        {detail && active && (
          <EventDetail
            key="detail"
            event={active}
            onClose={closeDetail}
            covered={lightboxMounted}
            reduced={reduced}
            onPhoto={(index) => openLightbox(active.slug, index)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence onExitComplete={() => setLightboxMounted(false)}>
        {lightbox && lightboxEvent && (
          <Lightbox
            key="lightbox"
            items={lightboxEvent.photos}
            index={lightbox.index}
            onIndex={(index) => setLightbox({ slug: lightboxEvent.slug, index })}
            onClose={closeLightbox}
            onDownload={download}
            title={lightboxEvent.title}
            reduced={reduced}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** The fixed header's height (nav plus announcement), so a scroll lands below it. */
function offsetTop(): number {
  const cs = getComputedStyle(document.documentElement);
  return (parseFloat(cs.getPropertyValue("--nav-h")) || 0) + (parseFloat(cs.getPropertyValue("--ann-h")) || 0);
}

"use client";

import { AnimatePresence, animate, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { isMedia, journalDate, pageImage, type Journal } from "@/lib/gallery";
import { BEZIER } from "@/lib/motion";
import { useUIStore } from "@/lib/store";
import type { GalleryItem } from "@/lib/types";
import { copyLink, downloadMedia, mediaFileName, shareLink } from "./download";
import { FAN, clamp } from "./fan";
import { JournalBackdrop } from "./JournalBackdrop";
import { JournalToolbar, JournalTopBar, Toast, type JournalView } from "./JournalChrome";
import { JournalFan, type FanNav } from "./JournalFan";
import { JournalGrid } from "./JournalGrid";
import { JournalScrubber } from "./JournalScrubber";
import { Lightbox } from "./Lightbox";

/**
 * The journal viewer, /gallery/[slug] (DESIGN.md §14). Owns the one position
 * value the fan is drawn from, the view (journal or grid), the lightbox and the
 * toolbar actions.
 *
 * - Journal view fills the screen: top bar, the fan, the scrubber, the toolbar.
 *   ← → (and Home / End) turn pages anywhere on the page; `?page=12` opens on a
 *   page, and the address follows the page you are on.
 * - Grid view is a masonry of every item. Switching views flies the items on
 *   screen from where they were to where they land (FLIP), the rest fade up.
 * - Reduced motion: a flat slider, instant page changes, no flights.
 */

const EASE_EXPO = `cubic-bezier(${BEZIER.expo.join(",")})`;
const EASE_OUT = `cubic-bezier(${BEZIER.out.join(",")})`;
/** The view-switch flight, ms. */
const FLIGHT_MS = 900;

export function JournalViewer({ journal }: { journal: Journal }) {
  const { event, items, pages } = journal;
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const side = wide ? FAN.side.desktop : FAN.side.mobile;
  const lenis = useUIStore((s) => s.lenis);
  const menuOpen = useUIStore((s) => s.menuOpen);
  const root = useRef<HTMLDivElement>(null);
  const last = pages.length - 1;

  const [view, setView] = useState<JournalView>("journal");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const media = useMemo(() => items.filter(isMedia), [items]);
  const mediaIndex = useMemo(() => new Map(media.map((m, i) => [m.id, i])), [media]);
  const pageOfItem = useMemo(() => {
    const map = new Map<string, number>();
    pages.forEach((p, i) => p.items.forEach((it) => map.set(it.id, i)));
    return map;
  }, [pages]);

  /* ------------------------------------------------------------ position */

  const pos = useMotionValue(0);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  useMotionValueEvent(pos, "change", (v) => {
    const r = clamp(Math.round(v), 0, last);
    if (r !== activeRef.current) {
      activeRef.current = r;
      setActive(r);
    }
  });

  const anim = useRef<AnimationPlaybackControls | null>(null);
  const target = useRef(0);
  const nav = useMemo<FanNav>(
    () => ({
      target,
      stop() {
        anim.current?.stop();
        anim.current = null;
      },
      go(index, velocity) {
        const t = clamp(Math.round(index), 0, last);
        target.current = t;
        anim.current?.stop();
        if (prefersReducedMotion()) {
          pos.jump(t);
          return;
        }
        anim.current = animate(pos, t, { type: "spring", ...FAN.spring, velocity: velocity ?? pos.getVelocity() });
      },
    }),
    [pos, last],
  );
  useEffect(() => () => anim.current?.stop(), []);

  // `?page=12` opens on page 12.
  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("page"));
    if (Number.isInteger(n) && n > 1 && n <= pages.length) {
      target.current = n - 1;
      pos.jump(n - 1);
    }
  }, [pos, pages.length]);

  // …and the address follows the page (once it settles), so a shared link opens here.
  const urlSynced = useRef(false);
  useEffect(() => {
    if (!urlSynced.current) {
      urlSynced.current = true;
      return;
    }
    const id = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (active === 0) url.searchParams.delete("page");
      else url.searchParams.set("page", String(active + 1));
      window.history.replaceState(null, "", url);
    }, 400);
    return () => window.clearTimeout(id);
  }, [active]);

  /* ---------------------------------------------------------------- keys */

  useEffect(() => {
    if (view !== "journal" || lightbox !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (menuOpen || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if ((e.target as HTMLElement).closest?.("input, textarea, select, [contenteditable='true']")) return;
      let to: number | null = null;
      if (e.key === "ArrowRight") to = target.current + 1;
      else if (e.key === "ArrowLeft") to = target.current - 1;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = last;
      if (to === null) return;
      e.preventDefault();
      nav.go(to);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, lightbox, menuOpen, nav, last]);

  // Keyboard focus on a page follows the centre (the old centre leaves the tab order).
  useEffect(() => {
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement) || !focused.matches("[data-fan-page]")) return;
    root.current?.querySelector<HTMLElement>(`[data-fan-page="${active}"]`)?.focus({ preventScroll: true });
  }, [active]);

  /* -------------------------------------------------------------- actions */

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const download = useCallback(
    (item: GalleryItem) => {
      if (!item.url) return;
      const n = (mediaIndex.get(item.id) ?? 0) + 1;
      setToast("Downloading…");
      void downloadMedia(item.url, mediaFileName(event.slug, n, item.type, item.url), item.type);
    },
    [mediaIndex, event.slug],
  );

  const downloadPage = useCallback(() => {
    const files = pages[activeRef.current].items.filter(isMedia);
    if (files.length === 0) setToast("A note has nothing to download");
    files.forEach(download);
  }, [pages, download]);

  const share = useCallback(async () => {
    const result = await shareLink(event.title, window.location.href);
    if (result === "copied") setToast("Link copied");
    else if (result === "failed") setToast("Couldn't share the link");
  }, [event.title]);

  const copy = useCallback(async () => {
    setToast((await copyLink(window.location.href)) === "copied" ? "Link copied" : "Couldn't copy the link");
  }, []);

  const openItem = useCallback(
    (itemId: string) => {
      const i = mediaIndex.get(itemId);
      if (i !== undefined) setLightbox(i);
    },
    [mediaIndex],
  );

  const closeLightbox = useCallback(() => {
    // Back in the journal, the fan waits on the page of the item you were looking at.
    if (lightbox !== null && view === "journal") {
      const page = pageOfItem.get(media[lightbox].id);
      if (page !== undefined && page !== target.current) nav.go(page);
    }
    setLightbox(null);
  }, [lightbox, view, pageOfItem, media, nav]);

  /* ---------------------------------------------------------- view switch */

  const flipFrom = useRef<Map<string, DOMRect> | null>(null);

  const switchView = (next: JournalView) => {
    if (next === view || !root.current) return;
    flipFrom.current = prefersReducedMotion() ? null : measure(root.current, view);
    if (window.scrollY > 0) {
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo({ top: 0, behavior: "instant" });
    }
    setView(next);
  };

  useLayoutEffect(() => {
    const from = flipFrom.current;
    flipFrom.current = null;
    if (from && root.current) fly(root.current, view, from, pos.get());
  }, [view, pos]);

  /* --------------------------------------------------------------- render */

  const backdrop = useMemo(() => {
    for (let k = 0; k <= last; k++) {
      for (const i of [active - k, active + k]) {
        const src = pages[i] ? pageImage(pages[i]) : null;
        if (src) return src;
      }
    }
    return event.cover_url;
  }, [active, pages, last, event.cover_url]);

  const page = pages[active];
  const caption = page.items.find((i) => i.caption)?.caption ?? null;
  const date = journalDate(event.starts_at);
  const autoplay = !reduced && view === "journal" && lightbox === null;

  return (
    <div
      ref={root}
      className={cn("relative pt-header", view === "journal" ? "flex h-svh flex-col overflow-clip" : "min-h-svh")}
    >
      <JournalBackdrop src={backdrop} reduced={reduced} />

      <JournalTopBar
        title={event.title}
        pages={pages.length}
        view={view}
        onView={switchView}
        onShare={share}
        onCopy={copy}
        onDownload={view === "journal" ? downloadPage : null}
        eventHref={`/events/${event.slug}`}
        sticky={view === "grid"}
      />

      {view === "journal" ? (
        <>
          <JournalFan
            pages={pages}
            pos={pos}
            active={active}
            side={side}
            flat={reduced}
            autoplay={autoplay}
            muted={muted}
            onToggleSound={() => setMuted((m) => !m)}
            date={event.starts_at}
            initial={0}
            nav={nav}
            onOpen={(_, itemId) => openItem(itemId)}
            label={`${event.title}, ${pages.length} pages`}
          />
          <div className="pt-1 pb-[max(14px,env(safe-area-inset-bottom))] md:pt-2 md:pb-6">
            <JournalScrubber count={pages.length} pos={pos} active={active} onGo={(i) => nav.go(i)} />
            <div className="mt-1 md:mt-2">
              <JournalToolbar
                info={{
                  title: event.title,
                  date,
                  venue: event.venue,
                  summary: event.summary,
                  photos: media.filter((m) => m.type === "photo").length,
                  videos: media.filter((m) => m.type === "video").length,
                  caption,
                }}
                onShare={share}
                onDownload={downloadPage}
                onGrid={() => switchView("grid")}
              />
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {`Page ${active + 1} of ${pages.length}, ${page.kind}${caption ? `: ${caption}` : ""}`}
          </p>
        </>
      ) : (
        <div data-journal-grid>
          <JournalGrid items={items} date={event.starts_at} onOpen={openItem} />
        </div>
      )}

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            key="lightbox"
            items={media}
            index={lightbox}
            onIndex={setLightbox}
            onClose={closeLightbox}
            onDownload={download}
            title={event.title}
            reduced={reduced}
          />
        )}
      </AnimatePresence>

      <Toast message={toast} />
    </div>
  );
}

/* ------------------------------------------------------------------ FLIP */

/** Screen boxes of the items visible in a view, by item id. */
function measure(root: HTMLElement, view: JournalView): Map<string, DOMRect> {
  const out = new Map<string, DOMRect>();
  const scope = root.querySelector(view === "journal" ? "[data-fan-stage]" : "[data-journal-grid]");
  scope?.querySelectorAll<HTMLElement>("[data-flip-id]").forEach((el) => {
    const wrap = el.closest<HTMLElement>("[data-fan-wrapper]");
    if (wrap && (wrap.style.visibility === "hidden" || Number(wrap.style.opacity || 1) < 0.05)) return;
    const r = el.getBoundingClientRect();
    if (onScreen(r)) out.set(el.dataset.flipId!, r);
  });
  return out;
}

function onScreen(r: DOMRect) {
  return r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
}

/**
 * Flies the new view's items from their old boxes (`from`) to where they are now.
 * Grid tiles animate themselves; fan pages animate their wrapper (the page keeps
 * its 3D transform) around the page's centre. Items with no old box fade up.
 */
function fly(root: HTMLElement, view: JournalView, from: Map<string, DOMRect>, position: number) {
  const inverse = (first: DOMRect, last: DOMRect) =>
    `translate(${(first.left + first.width / 2 - (last.left + last.width / 2)).toFixed(1)}px, ${(first.top + first.height / 2 - (last.top + last.height / 2)).toFixed(1)}px) scale(${(first.width / last.width).toFixed(4)}, ${(first.height / last.height).toFixed(4)})`;

  if (view === "grid") {
    let k = 0;
    root.querySelectorAll<HTMLElement>("[data-journal-grid] [data-flip-id]").forEach((el) => {
      const last = el.getBoundingClientRect();
      if (!onScreen(last)) return;
      const first = from.get(el.dataset.flipId!);
      if (first) {
        el.animate(
          [
            { transform: inverse(first, last), zIndex: 10 },
            { transform: "none", zIndex: 10 },
          ],
          { duration: FLIGHT_MS, easing: EASE_EXPO },
        );
      } else {
        el.animate([{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "none" }], {
          duration: 600,
          delay: 180 + k++ * 30,
          easing: EASE_OUT,
          fill: "backwards",
        });
      }
    });
    return;
  }

  const stage = root.querySelector<HTMLElement>("[data-fan-stage]");
  if (!stage) return;
  const sr = stage.getBoundingClientRect();
  stage.querySelectorAll<HTMLElement>("[data-fan-wrapper]").forEach((wrap) => {
    if (wrap.style.visibility === "hidden") return;
    const page = wrap.firstElementChild as HTMLElement | null;
    if (!page) return;
    const ids = page.dataset.flipId
      ? [page.dataset.flipId]
      : [...page.querySelectorAll<HTMLElement>("[data-flip-id]")].map((el) => el.dataset.flipId!);
    const first = ids.map((id) => from.get(id)).find(Boolean);
    if (first) {
      const last = page.getBoundingClientRect();
      const origin = `${(last.left + last.width / 2 - sr.left).toFixed(1)}px ${(last.top + last.height / 2 - sr.top).toFixed(1)}px`;
      wrap.animate(
        [
          { transformOrigin: origin, transform: inverse(first, last) },
          { transformOrigin: origin, transform: "none" },
        ],
        { duration: FLIGHT_MS, easing: EASE_EXPO },
      );
    } else {
      const d = Math.abs(Number(wrap.dataset.fanWrapper) - position);
      page.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 150 + d * 40, easing: EASE_OUT, fill: "backwards" });
    }
  });
}


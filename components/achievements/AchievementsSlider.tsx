"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { PillButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import { useUIStore } from "@/lib/store";
import { FINE_POINTER, useMediaQuery } from "@/hooks/use-media-query";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { ACH_CARD, ACH_MOTION, achDate, linkLabel, titleLines } from "@/lib/achievements";
import type { Achievement } from "@/lib/types";
import { ArrowIcon, Odometer, ResultBadge, ShareIcon } from "./parts";

/**
 * The /achievements card-expansion slider (DESIGN.md §19).
 *
 * - Every achievement nearby (the current one, the previous one and the next two; plus a far card when one is
 *   clicked) has a full-screen background LAYER, mounted with its photo loaded, hidden until needed.
 * - Next: the incoming layer starts exactly on the first card (same box, 16px radius, the same card face) and grows
 *   to cover the section (1.1s expo.inOut). It IS the new background when it lands: nothing is swapped, so there is
 *   no blank frame. Its card face fades out and the background shade fades in as it grows.
 * - Prev: the reverse. The current layer shrinks back into the first card slot over the previous one.
 * - The waiting cards are keyed by slug and placed per slot, so a change FLIP-slides them one slot (60ms apart); a card
 *   arriving at the far end fades in.
 * - The text leaves first (title lines up out of their masks, the rest fades, 300ms); the new text comes in after
 *   the expansion (lines rise 80ms apart, then the details fade up 50ms apart).
 * - Autoplay every 6s (the top line fills), paused on hover / focus, while less than 35% is on screen, while the tab
 *   is hidden or the menu is open, and for 10s after any action. Arrows, ← →, swipe (touch), a card click (that card
 *   expands), and requests from the list below (`request`). It loops.
 * - Reduced motion: no expansion, a plain crossfade, no autoplay.
 */

const MOBILE = "(max-width: 767.98px)";
type Kind = "next" | "prev" | "jump";
interface Plan {
  kind: Kind;
  from: number;
  to: number;
  /** Cards' left edges (px) before the change, by slug. */
  rects: Map<string, number>;
  /** Where the expanding layer starts (next / jump) or where the shrinking one ends (prev), relative to the root. */
  box: { x: number; y: number; w: number; h: number };
}

export function AchievementsSlider({
  items,
  initial,
  request,
  onChange,
  onReady,
}: {
  items: Achievement[];
  /** Start on this achievement (a slider rebuilt for a row of the list), without an animation. */
  initial?: string;
  /** Open this slide (from the list below); `key` changes per request. */
  request: { slug: string; key: number } | null;
  /** The showing achievement changed. */
  onChange?: (slug: string) => void;
  /** The first background's photo is decoded (or 900ms passed): safe to fade the slider in. */
  onReady?: () => void;
}) {
  const n = items.length;
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useMediaQuery(MOBILE);
  const fine = useMediaQuery(FINE_POINTER);
  const menuOpen = useUIStore((s) => s.menuOpen);
  const [init] = useState(() => Math.max(0, items.findIndex((a) => a.slug === initial)));
  const [active, setActive] = useState(init);
  const [content, setContent] = useState(init);
  /** Layers kept mounted outside the window: a far card's (before it expands) and the outgoing one's (while it shows). */
  const [keep, setKeep] = useState<string[]>([]);
  const [width, setWidth] = useState(1440);
  const [firstLoad, setFirstLoad] = useState(true);
  const [toast, setToast] = useState(false);

  const layers = useRef(new Map<string, HTMLDivElement>());
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const plan = useRef<Plan | null>(null);
  const run = useRef({ busy: false, active: init, bg: items[init]?.slug ?? "", animateIn: false });
  const P = useRef({ hover: false, hidden: false, offscreen: false, menu: false, idleUntil: 0 });
  const auto = useRef<gsap.core.Tween | null>(null);
  const swipe = useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  /** The latest `go`, for the autoplay tween's callback. */
  const goRef = useRef<(target: number, kind: Kind) => void>(() => {});

  const mod = useCallback((i: number) => ((i % n) + n) % n, [n]);
  const size = mobile ? ACH_CARD.mobile : ACH_CARD.desktop;

  /* ---------------------------------------------------------------- what is mounted */
  const windowIdx = n ? [active, mod(active + 1), mod(active + 2), mod(active - 1)] : [];
  const layerSlugs = [...new Set([...windowIdx.map((i) => items[i].slug), ...keep])];
  const start = mobile ? 16 : width * 0.52;
  const count = n < 2 ? 0 : Math.min(n - 1, Math.ceil((width - start) / (size.w + size.gap)) + 1);
  const row = Array.from({ length: count }, (_, s) => items[mod(active + 1 + s)]);
  const current = items[content];

  /* ---------------------------------------------------------------- autoplay */
  const sync = useCallback(() => {
    const p = P.current;
    const paused =
      prefersReducedMotion() || n < 2 || p.hover || p.hidden || p.offscreen || p.menu || run.current.busy || performance.now() < p.idleUntil;
    const t = auto.current;
    if (paused) {
      t?.pause();
      return;
    }
    if (t && t.progress() < 1) t.resume();
    else startAuto();
    function startAuto() {
      auto.current?.kill();
      if (!line.current) return;
      auto.current = gsap.fromTo(
        line.current,
        { scaleX: 0 },
        { scaleX: 1, duration: ACH_MOTION.autoplay, ease: "none", onComplete: () => goRef.current(run.current.active + 1, "next") },
      );
    }
  }, [n]);

  const resetLine = () => {
    auto.current?.kill();
    auto.current = null;
    if (line.current) gsap.set(line.current, { scaleX: 0 });
  };

  /** Any visitor action pauses autoplay for 10s. */
  const acted = useCallback(() => {
    P.current.idleUntil = performance.now() + ACH_MOTION.idleAfterAction * 1000;
    resetLine();
    window.setTimeout(sync, ACH_MOTION.idleAfterAction * 1000 + 30);
  }, [sync]);

  /* ---------------------------------------------------------------- go */
  const go = useCallback(
    async (target: number, kind: Kind, fromCard?: HTMLElement | null) => {
      const R = run.current;
      if (R.busy || n < 2) return;
      const to = mod(target);
      if (to === R.active) return;
      const el = root.current;
      if (!el) return;
      R.busy = true;
      resetLine();
      const toSlug = items[to].slug;

      // The target's layer must exist (a far card gets one mounted) and its photo be decoded: never a blank card.
      if (!layers.current.has(toSlug)) {
        setKeep([toSlug]);
        for (let i = 0; i < 30 && !layers.current.has(toSlug); i++) await frame();
      }
      const img = layers.current.get(toSlug)?.querySelector("img");
      if (img) await Promise.race([img.decode().catch(() => {}), wait(900)]);

      const rootRect = el.getBoundingClientRect();
      const rel = (r: DOMRect) => ({ x: r.left - rootRect.left, y: r.top - rootRect.top, w: r.width, h: r.height });
      const rects = new Map<string, number>();
      cards.current.forEach((c, slug) => rects.set(slug, c.getBoundingClientRect().left));
      const firstCard = cards.current.get(items[mod(R.active + 1)].slug);
      const card = kind === "prev" ? firstCard : (fromCard ?? cards.current.get(toSlug) ?? firstCard);
      const box = card ? rel(card.getBoundingClientRect()) : { x: rootRect.width * 0.6, y: rootRect.height * 0.4, w: size.w, h: size.h };

      // A card leaving the row while it is on screen (the one revealed underneath on prev) fades out in place: a
      // copy of it does, as React removes the card itself.
      const len = cards.current.size;
      const nextRow = new Set(Array.from({ length: len }, (_, s) => items[mod(to + 1 + s)].slug));
      cards.current.forEach((c, slug) => {
        if (nextRow.has(slug) || (kind !== "prev" && slug === toSlug)) return;
        const b = c.getBoundingClientRect();
        if (b.right <= rootRect.left || b.left >= rootRect.right) return;
        const ghost = c.cloneNode(true) as HTMLElement;
        ghost.removeAttribute("aria-label");
        ghost.setAttribute("aria-hidden", "true");
        ghost.tabIndex = -1;
        ghost.style.pointerEvents = "none";
        c.after(ghost);
        gsap.to(ghost, { opacity: 0, duration: 0.35, ease: "power2.out", onComplete: () => ghost.remove() });
      });

      plan.current = { kind, from: R.active, to, rects, box };
      setKeep([items[R.active].slug, toSlug]); // the outgoing background stays until the change ends
      R.active = to;
      setFirstLoad(false);
      setActive(to); // the layout effect below plays the plan, before the browser paints the new row
    },
    [n, mod, items, size.w, size.h],
  );
  useEffect(() => {
    goRef.current = go;
  }, [go]);

  /* ---------------------------------------------------------------- play a plan */
  useLayoutEffect(() => {
    const p = plan.current;
    if (!p) return;
    plan.current = null;
    const el = root.current!;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const fromSlug = items[p.from].slug;
    const toSlug = items[p.to].slug;
    const fromL = layers.current.get(fromSlug);
    const toL = layers.current.get(toSlug);
    const still = prefersReducedMotion();
    const R = run.current;

    const finish = () => {
      if (toL) gsap.set(toL, { clearProps: "left,top,width,height,borderRadius,boxShadow", opacity: 1, zIndex: 1 });
      if (fromL) gsap.set(fromL, { clearProps: "left,top,width,height,borderRadius,boxShadow", opacity: 0, zIndex: 0 });
      const face = (l?: HTMLElement) => l?.querySelector<HTMLElement>("[data-face]");
      const shade = (l?: HTMLElement) => l?.querySelector<HTMLElement>("[data-shade]");
      gsap.set([face(toL), face(fromL)].filter(Boolean), { opacity: 0 });
      gsap.set([shade(toL), shade(fromL)].filter(Boolean), { opacity: 1 });
      const back = cards.current.get(fromSlug);
      if (back) gsap.set(back, { visibility: "visible" });
      R.bg = toSlug;
      R.busy = false;
      setKeep([]);
      sync();
    };
    const showContent = () => {
      R.animateIn = !still;
      setContent(p.to);
    };

    if (still || !toL) {
      // Reduced motion: a plain crossfade; the text swaps when it ends.
      if (toL) gsap.set(toL, { zIndex: 2, opacity: 0 });
      gsap.to(toL ?? {}, { opacity: 1, duration: still ? ACH_MOTION.crossfade : 0.01, ease: "none", onComplete: () => (showContent(), finish()) });
      return;
    }

    /* Cards: slide one slot (FLIP), staggered by slot; ones that arrive (or jump to the far end) fade in. */
    const ordered = [...cards.current.entries()].sort((a, b) => a[1].getBoundingClientRect().left - b[1].getBoundingClientRect().left);
    ordered.forEach(([slug, c], slot) => {
      const now = c.getBoundingClientRect().left;
      const old = p.rects.get(slug);
      if (p.kind === "prev" && slug === fromSlug) {
        gsap.set(c, { visibility: "hidden" }); // the shrinking layer lands here
        return;
      }
      const delay = slot * ACH_MOTION.cardStagger;
      if (old === undefined || (p.kind !== "prev" && now > old + 1)) {
        // New at the far end. A card that was on screen (passed over by a jump) first fades out where it was.
        const tl = gsap.timeline();
        if (old !== undefined) tl.fromTo(c, { x: old - now, opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power2.out" }, 0);
        tl.fromTo(
          c,
          { opacity: 0, x: 48 },
          { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", immediateRender: old === undefined },
          0.55 + delay, // once the sliding cards have mostly passed
        );
      } else {
        gsap.fromTo(c, { x: old - now }, { x: 0, duration: ACH_MOTION.cardShift, ease: "expo.inOut", delay });
      }
    });

    /* The old text leaves first. */
    const c = contentRef.current;
    if (c) {
      gsap.to(c.querySelectorAll("[data-line]"), { yPercent: -112, duration: 0.42, ease: "power3.in", stagger: 0.04 });
      gsap.to(c.querySelectorAll("[data-fade]"), { opacity: 0, y: -8, duration: ACH_MOTION.out, ease: "power2.out" });
    }

    const D = ACH_MOTION.expand;
    const shadow = "0 18px 40px -12px rgba(0,0,0,0.7)";
    const faceOf = (l: HTMLElement) => l.querySelector<HTMLElement>("[data-face]")!;
    const shadeOf = (l: HTMLElement) => l.querySelector<HTMLElement>("[data-shade]")!;
    const tl = gsap.timeline({ onComplete: finish });

    if (p.kind === "prev" && fromL) {
      // The previous achievement waits underneath; the current background shrinks into the first card slot.
      gsap.set(toL, { opacity: 1, zIndex: 1 });
      gsap.set(shadeOf(toL), { opacity: 1 });
      gsap.set(faceOf(toL), { opacity: 0 });
      gsap.set(fromL, { zIndex: 2, left: 0, top: 0, width: W, height: H, borderRadius: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)" });
      tl.to(fromL, { left: p.box.x, top: p.box.y, width: p.box.w, height: p.box.h, borderRadius: 16, boxShadow: shadow, duration: D, ease: "expo.inOut" }, 0)
        .to(shadeOf(fromL), { opacity: 0, duration: 0.7, ease: "power2.inOut" }, 0.2)
        .to(faceOf(fromL), { opacity: 1, duration: 0.35, ease: "power2.out" }, D - 0.4)
        .call(showContent, [], D * 0.9);
    } else {
      // The card grows into the new background, above the old one.
      gsap.set(toL, { zIndex: 2, opacity: 1, left: p.box.x, top: p.box.y, width: p.box.w, height: p.box.h, borderRadius: 16, boxShadow: shadow });
      gsap.set(faceOf(toL), { opacity: 1 });
      gsap.set(shadeOf(toL), { opacity: 0 });
      tl.to(toL, { left: 0, top: 0, width: W, height: H, borderRadius: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)", duration: D, ease: "expo.inOut" }, 0)
        .to(faceOf(toL), { opacity: 0, duration: 0.3, ease: "power2.out" }, 0.05)
        .to(shadeOf(toL), { opacity: 1, duration: 0.8, ease: "power2.inOut" }, 0.15)
        .call(showContent, [], D * 0.9);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per committed change of `active`
  }, [active]);

  /* ---------------------------------------------------------------- the new text comes in */
  useLayoutEffect(() => {
    const c = contentRef.current;
    if (!c || !run.current.animateIn) return;
    run.current.animateIn = false;
    const lines = c.querySelectorAll("[data-line]");
    const fades = c.querySelectorAll("[data-fade]");
    gsap.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: ACH_MOTION.lineIn, ease: "expo.out", stagger: ACH_MOTION.lineStagger });
    gsap.fromTo(
      fades,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: ACH_MOTION.detailStagger, delay: 0.22 },
    );
  }, [content]);

  /* ---------------------------------------------------------------- layers: register, first state */
  const layerRef = (slug: string) => (l: HTMLDivElement | null) => {
    if (!l) {
      layers.current.delete(slug);
      return;
    }
    layers.current.set(slug, l);
    if (l.dataset.init) return;
    l.dataset.init = "1";
    const on = slug === run.current.bg;
    gsap.set(l, { opacity: on ? 1 : 0, zIndex: on ? 1 : 0 });
    gsap.set(l.querySelector("[data-face]"), { opacity: 0 });
  };
  const cardRef = (slug: string) => (c: HTMLButtonElement | null) => {
    if (c) cards.current.set(slug, c);
    else cards.current.delete(slug);
  };

  /* ---------------------------------------------------------------- environment */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    const io = new IntersectionObserver(
      ([e]) => {
        P.current.offscreen = e.intersectionRatio < 0.35;
        sync();
      },
      { threshold: [0, 0.35, 1] },
    );
    io.observe(el);
    const vis = () => {
      P.current.hidden = document.visibilityState !== "visible";
      sync();
    };
    document.addEventListener("visibilitychange", vis);
    // A shared link (?a=slug) opens on that achievement, without an animation.
    const want = new URLSearchParams(window.location.search).get("a");
    const idx = want ? items.findIndex((a) => a.slug === want) : -1;
    if (idx > 0) {
      run.current.active = idx;
      run.current.bg = items[idx].slug;
      layers.current.forEach((l, slug) => gsap.set(l, { opacity: slug === items[idx].slug ? 1 : 0, zIndex: slug === items[idx].slug ? 1 : 0 }));
      // After this effect (the URL is outside React): the slide's text still rises in as a first load.
      queueMicrotask(() => {
        setActive(idx);
        setContent(idx);
      });
    }
    sync();
    // Tell the page once the first photo can show (it fades a rebuilt slider in).
    let live = true;
    const first = layers.current.get(run.current.bg)?.querySelector("img");
    void Promise.race([first ? first.decode().catch(() => {}) : Promise.resolve(), wait(900)]).then(() => live && onReady?.());
    return () => {
      live = false;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      auto.current?.kill();
      auto.current = null; // a killed tween can't resume (Strict Mode remounts)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only (the slider remounts per filter)
  }, []);

  useEffect(() => {
    onChange?.(items[active].slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report changes of `active` only
  }, [active]);

  useEffect(() => {
    P.current.menu = menuOpen;
    sync();
  }, [menuOpen, reduced, sync]);

  // Keys: ← → while the slider is on screen (not in fields, not with the menu open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || P.current.menu || P.current.offscreen) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      acted();
      go(run.current.active + (e.key === "ArrowRight" ? 1 : -1), e.key === "ArrowRight" ? "next" : "prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, acted]);

  // A row in the list below asked for a slide.
  useEffect(() => {
    if (!request) return;
    const idx = items.findIndex((a) => a.slug === request.slug);
    if (idx < 0 || idx === run.current.active) return;
    acted();
    go(idx, "jump", cards.current.get(request.slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per request
  }, [request?.key]);

  /* ---------------------------------------------------------------- input */
  const step = (d: 1 | -1) => {
    acted();
    go(run.current.active + d, d > 0 ? "next" : "prev");
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const W = root.current?.clientWidth ?? 400;
    if (Math.abs(dx) > Math.min(80, W * 0.12) && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swallowClick.current = true;
      window.setTimeout(() => (swallowClick.current = false), 350);
      step(dx < 0 ? 1 : -1);
    }
  };
  const hover = (on: boolean) => {
    P.current.hover = on;
    sync();
  };
  const share = async (a: Achievement) => {
    acted();
    const url = `${window.location.origin}/achievements?a=${a.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: a.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast(true);
        window.setTimeout(() => setToast(false), 1800);
      }
    } catch {
      /* dismissed */
    }
  };

  if (!n || !current) return null;
  const [l1, l2] = titleLines(current.title);
  const rise = firstLoad && !reduced;

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label="Achievements"
      className={cn(
        "isolate touch-pan-y overflow-hidden",
        // Phones: in flow, so a short screen grows the section instead of overlapping (text, then the card strip, above
        // the controls). From md: the full section.
        "relative flex min-h-svh flex-col justify-end pt-[calc(var(--nav-h)+var(--ann-h)+6.75rem)] pb-[5.25rem]",
        "md:absolute md:inset-0 md:block md:min-h-0 md:p-0",
      )}
      onPointerEnter={(e) => e.pointerType === "mouse" && fine && hover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && hover(false)}
      onFocus={() => hover(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && hover(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      {/* Backgrounds: one layer per nearby achievement; the active one shows. */}
      {layerSlugs.map((slug) => {
        const a = items.find((x) => x.slug === slug)!;
        const isFirst = slug === items[init].slug;
        return (
          <div
            key={slug}
            ref={layerRef(slug)}
            aria-hidden="true"
            className={cn("absolute inset-0 overflow-hidden will-change-[width,height]", !isFirst && "opacity-0")}
          >
            <Image
              src={a.image_url}
              alt=""
              fill
              sizes="100vw"
              preload={isFirst}
              loading={isFirst ? undefined : "eager"}
              // Hidden until needed: load now, but without a preload in the head competing with the first photo.
              fetchPriority={isFirst ? undefined : "low"}
              className="object-cover"
            />
            <div data-shade className="absolute inset-0">
              <div className="absolute inset-0 bg-linear-to-r from-black/75 to-black/20 max-md:from-black/60 max-md:to-black/25" />
              <div className="absolute inset-0 bg-radial from-transparent from-50% to-black/45" />
              <div className="absolute inset-x-0 top-0 h-[30%] bg-linear-to-b from-black/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-black/80 to-transparent md:h-[25%] md:from-black/50" />
            </div>
            <div data-face className="absolute inset-0 opacity-0">
              <CardFace a={a} />
            </div>
          </div>
        );
      })}

      {/* Autoplay progress, just under the header. */}
      <div
        ref={line}
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(var(--nav-h)+var(--ann-h))] z-20 h-0.5 origin-left scale-x-0 bg-red"
      />

      {/* The current achievement. */}
      <div
        ref={contentRef}
        key={current.slug}
        className={cn(
          "relative z-10 mx-4",
          // From md: centred in the band between the filters and the controls (top-aligned if it doesn't fit).
          "md:absolute md:mx-0 md:top-[calc(var(--nav-h)+var(--ann-h)+6rem)] md:bottom-[calc(5svh+4.5rem)] md:left-[6vw] md:flex md:w-[min(520px,calc(46vw-2rem))] md:flex-col md:justify-center-safe md:*:shrink-0",
        )}
      >
        <p data-fade className={cn("flex items-center gap-3 text-[13px] text-text/85", rise && FADE_UP)} style={fadeDelay(rise, 0)}>
          <span aria-hidden="true" className="h-0.5 w-6 shrink-0 bg-red" />
          <span className="min-w-0 md:truncate">
            {current.event_name} / {current.location}
          </span>
        </p>
        <h2 className="mt-4 font-condensed text-[length:clamp(2.2rem,10vw,3.2rem)] leading-[0.95] uppercase md:text-[length:clamp(3rem,min(7vw,11svh),6.5rem)]">
          {[l1, l2].filter(Boolean).map((t, i) => (
            <span key={i} className="-my-[0.04em] block overflow-hidden py-[0.04em]">
              <span
                data-line
                className={cn("block", rise && "animate-rise motion-reduce:animate-none")}
                style={rise ? { animationDelay: `${150 + i * 80}ms` } : undefined}
              >
                {t}
              </span>
            </span>
          ))}
        </h2>
        <div data-fade className={cn("mt-5 flex flex-wrap items-center gap-3", rise && FADE_UP)} style={fadeDelay(rise, 1)}>
          <ResultBadge result={current.result} />
          <span className="mono-label text-text/75">{achDate(current.date)}</span>
        </div>
        <p data-fade className={cn("mt-4 line-clamp-3 max-w-[46ch] text-[15px] leading-relaxed text-text/70", rise && FADE_UP)} style={fadeDelay(rise, 2)}>
          {current.description}
        </p>
        <p data-fade className={cn("mt-3 text-[12px] text-text/60", rise && FADE_UP)} style={fadeDelay(rise, 3)}>
          <span className="mono-label mr-2 text-text/45">Team</span>
          {current.team.join(", ")}
        </p>
        <div data-fade className={cn("relative mt-5 flex items-center gap-3", rise && FADE_UP)} style={fadeDelay(rise, 4)}>
          <button
            type="button"
            data-cursor="link"
            aria-label={`Share ${current.title}`}
            onClick={() => share(current)}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-red text-text transition-colors duration-[350ms] hover:bg-red-deep"
          >
            <ShareIcon className="size-[18px]" />
          </button>
          {current.link && (
            <PillButton href={current.link} variant="ghost" size="md" arrow className="backdrop-blur-sm">
              {linkLabel(current)}
            </PillButton>
          )}
          <span
            role="status"
            className={cn(
              "mono-label pointer-events-none absolute -top-8 left-0 rounded-pill bg-bg-2/90 px-3 py-1.5 text-text transition-opacity duration-[350ms]",
              toast ? "opacity-100" : "opacity-0",
            )}
          >
            {toast ? "Link copied" : ""}
          </span>
        </div>
      </div>

      {/* The next achievements, waiting. */}
      <div
        className="relative z-10 mt-6 ml-4 md:absolute md:mt-0 md:ml-0 md:left-[52vw] md:top-[calc(50%-130px+4svh)]"
        style={{ height: size.h }}
      >
        {row.map((a, slot) => (
          <button
            key={a.slug}
            ref={cardRef(a.slug)}
            type="button"
            data-cursor="view"
            aria-label={`Show ${a.title}, ${a.result}`}
            onClick={(e) => {
              if (swallowClick.current) return;
              acted();
              go(items.indexOf(a), "jump", e.currentTarget);
            }}
            className="absolute top-0 overflow-hidden rounded-[16px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] outline-offset-4 transition-[filter] duration-[350ms] hover:brightness-110"
            style={{ left: slot * (size.w + size.gap), width: size.w, height: size.h }}
          >
            <Image src={a.image_url} alt="" fill sizes={`${size.w * 2}px`} loading="eager" fetchPriority="low" className="object-cover" />
            <CardFace a={a} small={mobile} />
          </button>
        ))}
      </div>

      {/* Controls. */}
      <div className="absolute bottom-5 left-4 z-20 flex gap-2.5 md:bottom-[5svh] md:left-[6vw]">
        {(["prev", "next"] as const).map((d) => (
          <button
            key={d}
            type="button"
            data-cursor="link"
            aria-label={d === "prev" ? "Previous achievement" : "Next achievement"}
            disabled={n < 2}
            onClick={() => step(d === "prev" ? -1 : 1)}
            className="grid size-11 place-items-center rounded-full bg-text/10 text-text ring-1 ring-text/15 backdrop-blur-md transition-colors duration-[350ms] hover:bg-text/20 disabled:opacity-40 md:size-12"
          >
            <ArrowIcon dir={d === "prev" ? "left" : "right"} />
          </button>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute right-[8.5rem] bottom-[calc(1.25rem+22px)] left-[8.5rem] z-20 h-px bg-text/20 md:right-[calc(6vw+13rem)] md:bottom-[calc(5svh+24px)] md:left-[calc(6vw+9rem)]"
      >
        <div className="h-full bg-text/80 transition-[width] duration-[900ms] ease-expo" style={{ width: `${((active + 1) / n) * 100}%` }} />
      </div>
      <p className="absolute right-4 bottom-4 z-20 flex items-end gap-2 font-bold text-text md:right-[6vw] md:bottom-[4svh]">
        <Odometer value={active + 1} className="text-[44px] tracking-[-0.03em] md:text-[64px]" />
        <span className="mono-label mb-[0.45rem] text-text/60 md:mb-[0.7rem]">/ {n}</span>
      </p>

      <p aria-live="polite" className="sr-only">
        {`${content + 1} of ${n}: ${current.title}, ${current.result}`}
      </p>
    </div>
  );
}

/** A card's face: the bottom shade, the title (two lines) and the result. Shared by the cards and the layers. */
function CardFace({ a, small = false }: { a: Achievement; small?: boolean }) {
  return (
    <>
      <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-transparent" />
      <span className={cn("absolute inset-x-0 bottom-0 flex flex-col items-start text-left", small ? "p-2.5" : "p-3.5")}>
        <span
          className={cn(
            "line-clamp-2 leading-[1.15] font-bold tracking-[0.01em] text-text uppercase",
            small ? "text-[10px]" : "text-[12px]",
          )}
        >
          {a.title}
        </span>
        <span className={cn("mt-1 font-mono tracking-[0.08em] text-text/70 uppercase", small ? "text-[9px]" : "text-[10px]")}>
          {a.result}
        </span>
      </span>
    </>
  );
}

/** First load (and a rebuilt slider): the details fade up after the title, as CSS keyframes from the server HTML. */
const FADE_UP = "animate-fade-up motion-reduce:animate-none";
const fadeDelay = (on: boolean, i: number) => (on ? { animationDelay: `${380 + i * 50}ms` } : undefined);

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

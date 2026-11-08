"use client";

import dynamic from "next/dynamic";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import {
  REEL,
  STRIP,
  buildStrip,
  filterFromLocation,
  filterProjects,
  projectHref,
  projectImages,
  reelCopies,
  writeFilterToLocation,
  type ProjectFilter,
  type ProjectWithTeam,
  type StripTile,
} from "@/lib/projects";
import { useUIStore } from "@/lib/store";
import { ImageView } from "./ImageView";
import { ProjectStrip } from "./ProjectStrip";
import { ReelTitle } from "./ReelTitle";
import { BuildsCount, ProjectFilters, ProjectInfo, ProjectsLabel } from "./parts";
import { activeSlot, damp, panelBox, reel, reelGeometry, slotArc, targetFor, type ReelGeometry, type ReelSlot } from "./reel-state";

/**
 * /projects on md and up with motion (DESIGN.md §16): one full-screen stage
 * that lives in app/projects/layout.tsx, so it survives the navigation
 * between /projects and /projects/[slug] and can animate between them.
 *
 *   State 1  the curved WebGL reel (ReelCanvas), with the vertical title, the
 *            tag filter and the project names
 *   State 2  one project's gallery strip (ProjectStrip) and its info panel
 *   State 3  one photo enlarged (ImageView)
 *
 * The URL is the source of truth: useSelectedLayoutSegment() gives the open
 * project's slug. A panel click starts the flight at once and pushes the URL;
 * Back / Esc / the browser's back button play it in reverse. Opening a
 * project's URL directly shows State 2 without the flight.
 *
 * The flight is one value, --p (0 = reel, 1 = gallery), tweened over 1.1s
 * expo.inOut and written as a CSS variable on the stage (the title split, the
 * chrome fades, the tiles' entrance and the info panel read it) and into
 * reel.morph / reel.fly (the canvas reads those). Reversing mid-flight just
 * tweens it back.
 *
 * Per-frame work (reel and strip physics, the panels' hit buttons, the tiles'
 * parallax) runs on the GSAP ticker and writes to the DOM directly; React only
 * renders when the active project, the mode or the filter changes.
 *
 * Phones, reduced motion and no WebGL never mount any of this: CSS hides the
 * stage and the plain pages (ProjectsIndex, ProjectDetail) show instead.
 */

const ReelCanvas = dynamic(() => import("./ReelCanvas"), { ssr: false });

const DESKTOP = "(min-width: 768px)";

type Mode = "reel" | "moving" | "gallery";

interface Engine {
  goTo(slug: string | null): void;
  openSlot(slot: number): void;
  back(): void;
  hover(slot: number, leaving?: number): void;
  scrollToProject(index: number): void;
  changeFilter(filter: ProjectFilter): void;
  openImage(index: number): void;
  closeImage(): void;
  stepImage(dir: number): void;
  imageExited(): void;
  coverLoaded(): void;
  ready(): void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Past the ends a drag moves at 30%. */
function rubber(v: number, lo: number, hi: number) {
  if (v < lo) return lo + (v - lo) * 0.3;
  if (v > hi) return hi + (v - hi) * 0.3;
  return v;
}

/** Pointer speed (px/s) over the last few samples. */
function velocity(samples: { x: number; t: number }[]) {
  if (samples.length < 2) return 0;
  const a = samples[0];
  const b = samples[samples.length - 1];
  const dt = (b.t - a.t) / 1000;
  return dt > 0 ? (b.x - a.x) / dt : 0;
}

/** three.js needs WebGL2. Checked once on the client; the server assumes it (the stage is hidden there anyway). */
let webgl2: boolean | null = null;
function hasWebGL2() {
  if (webgl2 === null) {
    try {
      webgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      webgl2 = false;
    }
  }
  return webgl2;
}
const noSubscribe = () => () => {};
const useWebGL2 = () => useSyncExternalStore(noSubscribe, hasWebGL2, () => true);

/** The title's size limits (ReelTitle) and where its halves rest in the gallery. --title-fit is set in the class list (it changes below lg). */
const STAGE_VARS = {
  "--title-max": "19.5cqh",
  "--title-top": "calc(var(--nav-h) + var(--ann-h) + 3.25rem)",
  "--title-bottom": "1.75rem",
};

export function ProjectsStage({ projects, clubName }: { projects: ProjectWithTeam[]; clubName: string }) {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  const desktop = useMediaQuery(DESKTOP);
  const reduced = useReducedMotion();
  const webgl = useWebGL2();
  const enabled = desktop && !reduced && webgl;

  const [filter, setFilter] = useState<ProjectFilter>("All");
  const list = useMemo(() => filterProjects(projects, filter), [projects, filter]);
  const slots = useMemo<ReelSlot[]>(() => {
    const out: ReelSlot[] = [];
    const copies = reelCopies(list.length);
    for (let c = 0; c < copies; c++) {
      list.forEach((p, i) => out.push({ key: `${p.id}:${c}`, project: i, cover: p.cover_url! }));
    }
    return out;
  }, [list]);

  const [active, setActive] = useState(() => (segment ? Math.max(0, list.findIndex((p) => p.slug === segment)) : 0));
  const [shown, setShown] = useState<string | null>(segment);
  const [mode, setMode] = useState<Mode>(segment ? "gallery" : "reel");
  const [coverShown, setCoverShown] = useState(Boolean(segment));
  const [canvasOn, setCanvasOn] = useState(!segment);
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const failed = (desktop && !reduced && !webgl) || contextLost;
  const [tabHidden, setTabHidden] = useState(false);
  const [view, setView] = useState<{ index: number; open: boolean } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [stageStyle] = useState(() => ({ ...STAGE_VARS, "--p": segment ? 1 : 0 }) as CSSProperties);

  const root = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tiles = useRef<(HTMLElement | null)[]>([]);
  const names = useRef<HTMLDivElement>(null);
  const infoHeading = useRef<HTMLHeadingElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const engine = useRef<Engine | null>(null);
  const segmentRef = useRef(segment);
  const focusFollow = useRef(false);
  /** An element the engine wants focused once React commits (see the effect below). */
  const pendingFocus = useRef<(() => HTMLElement | null | undefined) | null>(null);

  const shownProject = shown ? (projects.find((p) => p.slug === shown) ?? null) : null;
  const strip = useMemo(() => (shownProject ? buildStrip(shownProject) : null), [shownProject]);
  const activeIndex = slots[active]?.project ?? 0;
  const titleProject = shownProject ?? list[activeIndex] ?? null;

  // What the engine needs from the latest render.
  const data = useRef({ list, slots, strip, filter, shown, view });
  useLayoutEffect(() => {
    data.current = { list, slots, strip, filter, shown, view };
    segmentRef.current = segment;
  });
  useLayoutEffect(() => {
    reel.count = slots.length;
  }, [slots]);

  /* ------------------------------------------------------------ engine */
  useEffect(() => {
    if (!enabled) return;
    const stage = root.current;
    if (!stage) return;

    let modeNow: Mode = "reel";
    let activeNow = -1;
    let targetSlug: string | null = null;
    let openedFromReel = false;
    let readyNow = false;
    let tween: gsap.core.Tween | null = null;
    let raf = 0;
    let snapTimer = 0;
    let swapTimer = 0;
    let coverIsLoaded = false;
    let pendingSwap = false;
    let buttonsDirty = true;
    let tilesDirty = true;
    const progress = { p: 0 };
    const strip = { offset: 0, target: 0, dragging: false };

    const setModeBoth = (m: Mode) => {
      modeNow = m;
      setMode(m);
      buttonsDirty = true;
    };

    const applyP = (p: number) => {
      progress.p = p;
      stage.style.setProperty("--p", p.toFixed(4));
      reel.morph.t = p;
      reel.fly = Math.min(p * 1.25, 1);
      reel.invalidate();
    };

    const stripMax = () => (data.current.strip?.length ?? 0) * (reel.height / 100);

    /** The cover tile's box at scroll 0, in world px (the flight's landing spot). */
    const coverRestRect = (tilesOf: StripTile[]) => {
      const t = tilesOf[0];
      const u = reel.height / 100;
      return { x: t.x * u, y: reel.height / 2 - (t.y + t.h / 2) * u, w: t.w * u, h: t.h * u };
    };

    /** The cover tile's live box (the strip may have scrolled), in world px. */
    const coverLiveRect = () => {
      const el = tiles.current[0];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      return {
        x: r.left - s.left + r.width / 2 - reel.width / 2,
        y: reel.height / 2 - (r.top - s.top + r.height / 2),
        w: r.width,
        h: r.height,
      };
    };

    const nearestSlotOf = (index: number, g: ReelGeometry) => {
      const n = Math.max(data.current.list.length, 1);
      let best = index;
      let bestD = Infinity;
      for (let s = index; s < reel.count; s += n) {
        const d = Math.abs(targetFor(s, g) - reel.offset);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      return best;
    };

    /* Layout: stage size, the panels' hit buttons, the tiles' parallax. */
    const measure = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w === reel.width && h === reel.height) return;
      if (reel.width > 1) {
        const k = w / reel.width;
        reel.offset *= k;
        reel.target *= k;
      }
      if (reel.height > 1) {
        const k = h / reel.height;
        strip.offset *= k;
        strip.target *= k;
      }
      reel.width = w;
      reel.height = h;
      const st = data.current.strip;
      if (modeNow === "gallery" && st) Object.assign(reel.morph, coverRestRect(st.tiles));
      buttonsDirty = true;
      tilesDirty = true;
      reel.invalidate();
    };

    const positionButtons = (g: ReelGeometry) => {
      const list = buttons.current;
      for (let i = 0; i < list.length; i++) {
        const el = list[i];
        if (!el) continue;
        const s = i < reel.count ? slotArc(i, g) : Infinity;
        if (Math.abs(s) > g.visible) {
          el.style.display = "none";
          continue;
        }
        const b = panelBox(s, g);
        el.style.display = "block";
        el.style.transform = `translate3d(${b.left.toFixed(1)}px,${b.top.toFixed(1)}px,0)`;
        el.style.width = `${b.width.toFixed(1)}px`;
        el.style.height = `${b.height.toFixed(1)}px`;
      }
    };

    const positionTiles = () => {
      const st = data.current.strip;
      if (!st) return;
      st.tiles.forEach((t, i) => {
        const el = tiles.current[i];
        if (el) el.style.transform = `translate3d(${(-strip.offset * t.speed).toFixed(2)}px,0,0)`;
      });
    };

    const tick = (_time: number, deltaMs: number) => {
      const dt = clamp(deltaMs / 1000, 0.001, 0.05);
      const g = reelGeometry();

      if (modeNow !== "gallery") {
        const before = reel.offset;
        reel.offset = damp(reel.offset, reel.target, reel.dragging ? 22 : REEL.follow, dt);
        if (Math.abs(reel.target - reel.offset) < 0.05) reel.offset = reel.target;
        reel.speed = damp(reel.speed, (reel.offset - before) / dt, 12, dt);
        if (Math.abs(reel.speed) < 2 && reel.offset === reel.target) reel.speed = 0;
        const sp = Math.abs(reel.speed);
        reel.boost = Math.min(sp / REEL.bendAt, 1);
        reel.split = Math.sign(reel.speed) * Math.min(sp / REEL.splitAt, 1) * REEL.split;
        if (reel.offset !== before || reel.speed !== 0) {
          reel.invalidate();
          buttonsDirty = true;
        }
        if (modeNow === "reel") {
          const a = activeSlot(g);
          if (a !== activeNow) {
            activeNow = a;
            setActive(a);
          }
          if (buttonsDirty) {
            positionButtons(g);
            buttonsDirty = false;
          }
        }
      }

      if (modeNow !== "reel" && data.current.strip) {
        if (!strip.dragging) strip.target = clamp(strip.target, 0, stripMax());
        const before = strip.offset;
        strip.offset = damp(strip.offset, strip.target, strip.dragging ? 22 : REEL.follow, dt);
        if (Math.abs(strip.target - strip.offset) < 0.05) strip.offset = strip.target;
        if (strip.offset !== before || tilesDirty) {
          positionTiles();
          tilesDirty = false;
        }
      }
    };

    /* The flight between the reel and a project's gallery. */
    const finishSwap = () => {
      pendingSwap = false;
      window.clearTimeout(swapTimer);
      setCoverShown(true);
      // One frame with both, then the canvas goes (it renders nothing while hidden).
      raf = requestAnimationFrame(() => {
        if (modeNow === "gallery") setCanvasOn(false);
      });
      pendingFocus.current = () => infoHeading.current;
    };

    const open = (slug: string, slot?: number) => {
      const project = projects.find((p) => p.slug === slug);
      const index = data.current.list.findIndex((p) => p.slug === slug);
      if (!project || index < 0 || !readyNow) {
        syncInstant(slug);
        return;
      }
      const g = reelGeometry();
      const s = slot ?? nearestSlotOf(index, g);
      Object.assign(reel.morph, { slot: s, ...coverRestRect(buildStrip(project).tiles) });
      reel.target = targetFor(s, g);
      reel.hovered = -1;
      activeNow = s;
      setActive(s);
      strip.offset = strip.target = 0;
      tilesDirty = true;
      coverIsLoaded = false;
      pendingSwap = false;
      setShown(slug);
      setCoverShown(false);
      setCanvasOn(true);
      setView(null);
      setModeBoth("moving");
      setAnnounce(`${project.title}: ${projectImages(project).length} photos`);
      tween?.kill();
      tween = gsap.to(progress, {
        p: 1,
        duration: Math.max(REEL.transition * (1 - progress.p), 0.35),
        ease: "expo.inOut",
        onUpdate: () => applyP(progress.p),
        onComplete: () => {
          setModeBoth("gallery");
          if (coverIsLoaded) finishSwap();
          else {
            pendingSwap = true;
            swapTimer = window.setTimeout(finishSwap, 1500);
          }
        },
      });
    };

    const close = () => {
      openedFromReel = false;
      setView(null);
      tween?.kill();
      cancelAnimationFrame(raf);
      window.clearTimeout(swapTimer);
      pendingSwap = false;
      const afterClose = () => {
        setModeBoth("reel");
        setShown(null);
        reel.morph.slot = -1;
        const a = activeSlot(reelGeometry());
        activeNow = a;
        setActive(a);
        const focused = document.activeElement;
        if (!focused || focused === document.body || stage.contains(focused)) {
          focusFollow.current = true;
        }
      };
      setModeBoth("moving");

      // Nothing to land on (WebGL not ready, or a project without a cover): fade the gallery away.
      if (!readyNow || reel.morph.slot < 0) {
        setCanvasOn(true);
        tween = gsap.to(progress, {
          p: 0,
          duration: 0.6,
          ease: "power3.out",
          onUpdate: () => applyP(progress.p),
          onComplete: afterClose,
        });
        return;
      }

      const live = progress.p >= 1 ? coverLiveRect() : null;
      if (live) Object.assign(reel.morph, live);
      setCanvasOn(true);
      reel.invalidate();
      // Let the canvas draw the panel over the cover for a frame before the DOM cover goes.
      raf = requestAnimationFrame(() => {
        setCoverShown(false);
        tween = gsap.to(progress, {
          p: 0,
          duration: Math.max(REEL.transition * progress.p, 0.35),
          ease: "expo.inOut",
          onUpdate: () => applyP(progress.p),
          onComplete: afterClose,
        });
      });
    };

    /** Jump straight to a state: first load, a project outside the filter, history between two projects. */
    const syncInstant = (slug: string | null) => {
      tween?.kill();
      cancelAnimationFrame(raf);
      setView(null);
      targetSlug = slug;
      const project = slug ? projects.find((p) => p.slug === slug) : undefined;
      if (project) {
        let list = data.current.list;
        let index = list.findIndex((p) => p.slug === slug);
        if (index < 0 && project.cover_url) {
          list = filterProjects(projects, "All");
          index = list.findIndex((p) => p.slug === slug);
          setFilter("All");
          reel.count = list.length * reelCopies(list.length);
        }
        const g = reelGeometry();
        if (index >= 0) {
          reel.offset = reel.target = index * g.spacing;
          activeNow = index;
          setActive(index);
          Object.assign(reel.morph, { slot: index, ...coverRestRect(buildStrip(project).tiles) });
        } else {
          reel.morph.slot = -1;
        }
        applyP(1);
        strip.offset = strip.target = 0;
        tilesDirty = true;
        setShown(project.slug);
        setCoverShown(true);
        setCanvasOn(false);
        setModeBoth("gallery");
      } else {
        reel.morph.slot = -1;
        applyP(0);
        setShown(null);
        setCoverShown(false);
        setCanvasOn(true);
        setModeBoth("reel");
      }
    };

    const goTo = (slug: string | null, slot?: number) => {
      if (slug === targetSlug) return;
      const from = targetSlug;
      targetSlug = slug;
      if (slug && from) syncInstant(slug);
      else if (slug) open(slug, slot);
      else close();
    };

    /* Input: drag, wheel, keys. */
    let pointer: {
      id: number;
      x: number;
      start: number;
      moved: boolean;
      on: "reel" | "strip";
      samples: { x: number; t: number }[];
    } | null = null;
    let suppressClick = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || pointer) return;
      if ((e.target as Element).closest("[data-no-drag]")) return;
      const on = modeNow === "reel" ? "reel" : modeNow === "gallery" && !data.current.view ? "strip" : null;
      if (!on) return;
      pointer = {
        id: e.pointerId,
        x: e.clientX,
        start: on === "reel" ? reel.target : strip.target,
        moved: false,
        on,
        samples: [{ x: e.clientX, t: e.timeStamp }],
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const dx = e.clientX - pointer.x;
      if (!pointer.moved) {
        if (Math.abs(dx) < 6) return;
        pointer.moved = true;
        stage.setPointerCapture(e.pointerId);
        if (pointer.on === "reel") {
          reel.dragging = true;
          reel.hovered = -1;
        } else strip.dragging = true;
      }
      pointer.samples.push({ x: e.clientX, t: e.timeStamp });
      if (pointer.samples.length > 6) pointer.samples.shift();
      if (pointer.on === "reel") reel.target = pointer.start - dx * REEL.drag;
      else strip.target = rubber(pointer.start - dx * STRIP.drag, 0, stripMax());
      reel.invalidate();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const p = pointer;
      pointer = null;
      if (!p.moved) return;
      suppressClick = true;
      window.setTimeout(() => (suppressClick = false), 0);
      if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      const v = velocity(p.samples);
      if (p.on === "reel") {
        reel.dragging = false;
        const g = reelGeometry();
        reel.target = Math.round((reel.target - v * REEL.drag * REEL.flick) / g.spacing) * g.spacing;
      } else {
        strip.dragging = false;
        strip.target = clamp(strip.target - v * STRIP.drag * REEL.flick, 0, stripMax());
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      e.preventDefault();
      if (modeNow === "moving" || data.current.view) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? reel.height : 1;
      const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
      if (modeNow === "reel") {
        reel.target += d * REEL.wheel;
        window.clearTimeout(snapTimer);
        snapTimer = window.setTimeout(() => {
          const g = reelGeometry();
          reel.target = Math.round(reel.target / g.spacing) * g.spacing;
        }, REEL.snapDelay);
      } else {
        strip.target = clamp(strip.target + d * STRIP.wheel, 0, stripMax());
      }
    };

    const stepReel = (dir: number) => {
      const g = reelGeometry();
      reel.target = Math.round(reel.target / g.spacing) * g.spacing + dir * g.spacing;
    };

    /** Centre the next / previous tile. */
    const stepStrip = (dir: number) => {
      const st = data.current.strip;
      if (!st || st.tiles.length === 0) return;
      const u = reel.height / 100;
      const now = strip.target / u;
      let i = 0;
      st.tiles.forEach((t, k) => {
        if (Math.abs(t.arrive - now) < Math.abs(st.tiles[i].arrive - now)) i = k;
      });
      i = clamp(i + dir, 0, st.tiles.length - 1);
      strip.target = st.tiles[i].arrive * u;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (useUIStore.getState().menuOpen) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      const v = data.current.view;
      if (v) {
        if (e.key === "Escape") api.closeImage();
        else if (e.key === "ArrowLeft") api.stepImage(-1);
        else if (e.key === "ArrowRight") api.stepImage(1);
        else return;
        e.preventDefault();
        return;
      }
      if (modeNow === "gallery") {
        if (e.key === "Escape") api.back();
        else if (e.key === "ArrowLeft") stepStrip(-1);
        else if (e.key === "ArrowRight") stepStrip(1);
        else return;
        e.preventDefault();
        return;
      }
      if (modeNow === "reel") {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          focusFollow.current = Boolean(el && buttons.current.includes(el as HTMLButtonElement));
          stepReel(e.key === "ArrowLeft" ? -1 : 1);
        } else if (e.key === "Enter" && !el?.closest("button, a")) {
          e.preventDefault();
          api.openSlot(activeNow);
        }
      }
    };

    const onVisibility = () => setTabHidden(document.hidden);

    const api: Engine = {
      goTo: (slug) => goTo(slug),
      openSlot: (slot) => {
        if (suppressClick || modeNow !== "reel" || !readyNow) return;
        const { list, slots } = data.current;
        const project = list[slots[slot]?.project ?? -1];
        if (!project) return;
        openedFromReel = true;
        goTo(project.slug, slot);
        router.push(projectHref(project.slug), { scroll: false });
      },
      back: () => {
        if (modeNow === "reel") return;
        const fromReel = openedFromReel;
        goTo(null);
        if (fromReel) router.back();
        else {
          const f = data.current.filter;
          router.push(f === "All" ? "/projects" : `/projects?tag=${f}`, { scroll: false });
        }
      },
      hover: (slot, leaving) => {
        if (leaving !== undefined && reel.hovered !== leaving) return;
        if (reel.dragging || modeNow !== "reel") return;
        reel.hovered = slot;
        reel.invalidate();
      },
      scrollToProject: (index) => {
        if (modeNow !== "reel") return;
        reel.target = targetFor(nearestSlotOf(index, reelGeometry()), reelGeometry());
      },
      changeFilter: (f) => {
        if (f === data.current.filter || modeNow !== "reel") return;
        writeFilterToLocation(f);
        const apply = () => {
          reel.offset = reel.target = 0;
          activeNow = 0;
          setActive(0);
          buttonsDirty = true;
          setFilter(f);
        };
        if (!readyNow) {
          apply();
          return;
        }
        gsap.killTweensOf(reel, "alpha");
        gsap.to(reel, {
          alpha: 0,
          duration: 0.3,
          ease: "power2.in",
          onUpdate: () => reel.invalidate(),
          onComplete: () => {
            apply();
            raf = requestAnimationFrame(() =>
              gsap.to(reel, { alpha: 1, duration: 0.6, ease: "power3.out", onUpdate: () => reel.invalidate() }),
            );
          },
        });
      },
      openImage: (index) => {
        if (suppressClick || modeNow !== "gallery") return;
        setView({ index, open: true });
        requestAnimationFrame(() => backButton.current?.focus({ preventScroll: true }));
      },
      closeImage: () => setView((v) => (v ? { ...v, open: false } : v)),
      stepImage: (dir) => {
        const st = data.current.strip;
        const v = data.current.view;
        if (!st || !v || !v.open) return;
        const index = (v.index + dir + st.tiles.length) % st.tiles.length;
        setView({ index, open: true });
        // Bring that tile behind the photo, so closing flies back to it.
        strip.target = clamp(st.tiles[index].arrive * (reel.height / 100), 0, stripMax());
      },
      imageExited: () => {
        const v = data.current.view;
        setView(null);
        if (v) pendingFocus.current = () => tiles.current[v.index]?.querySelector("button");
      },
      coverLoaded: () => {
        coverIsLoaded = true;
        if (pendingSwap) finishSwap();
      },
      ready: () => {
        if (readyNow) return;
        readyNow = true;
        setReady(true);
        if (modeNow === "reel") {
          gsap.to(reel, { intro: 1, duration: 1.6, ease: "expo.out", onUpdate: () => reel.invalidate() });
        } else reel.intro = 1;
      },
    };
    engine.current = api;

    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    measure();
    // Start where the URL says, without a flight; a filter in the address applies to the reel.
    syncInstant(segmentRef.current);
    if (!segmentRef.current) {
      const f = filterFromLocation();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the address bar once
      if (f !== "All") setFilter(f);
    }

    gsap.ticker.add(tick);
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    stage.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      engine.current = null;
      ro.disconnect();
      gsap.ticker.remove(tick);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
      stage.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(snapTimer);
      window.clearTimeout(swapTimer);
      cancelAnimationFrame(raf);
      tween?.kill();
      gsap.killTweensOf(reel);
      Object.assign(reel, { offset: 0, target: 0, speed: 0, dragging: false, hovered: -1, intro: 0, alpha: 1, boost: 0, split: 0, fly: 0 });
      Object.assign(reel.morph, { slot: -1, t: 0 });
      setReady(false);
    };
  }, [enabled, projects, router]);

  // Follow the URL (panel clicks, Back, the browser's back and forward buttons).
  useEffect(() => {
    engine.current?.goTo(segment);
  }, [segment]);

  // Focus queued by the engine lands once React has committed (the target may still be inert before that).
  useEffect(() => {
    const target = pendingFocus.current?.();
    if (!target || target.closest("[inert]")) return;
    pendingFocus.current = null;
    target.focus({ preventScroll: true });
  });

  // Keyboard focus follows the reel when it is stepped with the arrow keys from a panel.
  useEffect(() => {
    if (!focusFollow.current || mode !== "reel") return;
    focusFollow.current = false;
    buttons.current[active]?.focus({ preventScroll: true });
  }, [active, mode]);

  // Keep the active name in view in the names strip.
  useEffect(() => {
    const box = names.current;
    const btn = box?.querySelector<HTMLElement>(`[data-name="${activeIndex}"]`);
    if (!box || !btn || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: btn.offsetLeft - box.clientWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
  }, [activeIndex]);

  // Announce the centred project once the reel settles on it.
  const announced = useRef(false);
  useEffect(() => {
    if (mode !== "reel" || !titleProject) return;
    if (!announced.current) {
      announced.current = true;
      return;
    }
    const t = window.setTimeout(() => setAnnounce(`${titleProject.title}, ${activeIndex + 1} of ${list.length}`), 500);
    return () => window.clearTimeout(t);
  }, [mode, titleProject, activeIndex, list.length]);

  // No WebGL: show the plain pages instead (CSS in globals.css).
  useEffect(() => {
    if (!failed) return;
    const html = document.documentElement;
    html.setAttribute("data-projects-fallback", "");
    return () => html.removeAttribute("data-projects-fallback");
  }, [failed]);

  const onReady = useCallback(() => engine.current?.ready(), []);
  const onFail = useCallback(() => setContextLost(true), []);

  const inReel = mode === "reel";
  const inGallery = mode === "gallery";

  return (
    <section
      ref={root}
      data-projects-stage
      data-mode={mode}
      data-lenis-prevent
      data-cursor={inReel || (inGallery && !view) ? "drag" : undefined}
      aria-label="Projects"
      className={cn(
        "relative h-svh w-full touch-none overflow-hidden bg-bg select-none [container-type:size] max-md:hidden motion-reduce:hidden",
        // The title's longest length. Below lg the filter pills reach the middle column, so it also stays
        // between the filter row and the names strip.
        "[--title-fit:64cqh] max-lg:[--title-fit:min(64cqh,calc(100cqh-2*(var(--nav-h)+var(--ann-h)+6.75rem)))]",
      )}
      style={stageStyle}
    >
      {/* The reel (WebGL). */}
      <div className="absolute inset-0 z-0" style={{ visibility: canvasOn ? "visible" : "hidden" }}>
        {enabled && !failed && (
          <ReelCanvas slots={slots} frameloop={tabHidden ? "never" : "demand"} onReady={onReady} onFail={onFail} />
        )}
      </div>

      {/* The vertical title: over the panels, behind the gallery tiles. */}
      {titleProject && (
        <ReelTitle
          title={titleProject.title}
          animate={enabled && inReel}
          className={cn(
            "z-10 [transition:opacity_600ms_var(--ease-power3),filter_600ms_var(--ease-power3)]",
            view?.open && "opacity-30 blur-[4px]",
          )}
        />
      )}

      {/* State 2: the project's photos. */}
      {shownProject && strip && (
        <ProjectStrip
          tiles={strip.tiles}
          title={shownProject.title}
          coverShown={coverShown}
          hidden={view ? view.index : null}
          viewing={Boolean(view?.open)}
          interactive={inGallery && !view}
          tileRefs={tiles}
          onOpen={(i) => engine.current?.openImage(i)}
          onCoverLoad={() => engine.current?.coverLoaded()}
        />
      )}

      {/* The panels' hit areas, moved every frame over the curved panels. */}
      <div className={cn("absolute inset-0 z-[25]", (!inReel || !ready) && "pointer-events-none")} inert={!inReel}>
        {slots.map((slot, i) => (
          <button
            key={slot.key}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            tabIndex={i === active ? 0 : -1}
            data-cursor="view"
            aria-label={`Open ${list[slot.project]?.title}`}
            className="absolute top-0 left-0 hidden rounded-image focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
            onPointerEnter={() => engine.current?.hover(i)}
            onPointerLeave={() => engine.current?.hover(-1, i)}
            onClick={() => engine.current?.openSlot(i)}
          />
        ))}
      </div>

      {/* Top left: the label and the tag filter. */}
      <div data-no-drag className="absolute top-[calc(var(--nav-h)+var(--ann-h)+1rem)] left-(--gutter) z-30">
        <ProjectsLabel clubName={clubName} />
        <div className="mt-4 [opacity:calc(1-var(--p)*2.5)]" inert={!inReel}>
          <ProjectFilters value={filter} onChange={(f) => engine.current?.changeFilter(f)} />
        </div>
      </div>

      {/* Top right: the count. */}
      <BuildsCount
        count={list.length}
        className="absolute top-[calc(var(--nav-h)+var(--ann-h)+1rem)] right-(--gutter) z-30"
      />

      {/* Top centre: back to the reel / close the photo. */}
      <button
        ref={backButton}
        type="button"
        data-no-drag
        inert={inReel}
        onClick={() => (view?.open ? engine.current?.closeImage() : engine.current?.back())}
        className="mono-label absolute top-[calc(var(--nav-h)+var(--ann-h)+1rem)] left-1/2 z-30 -translate-x-1/2 rounded-pill px-3 py-1.5 text-text transition-colors duration-[350ms] ease-power3 [opacity:var(--p)] hover:bg-text/10"
      >
        {view?.open ? "Close image" : "Back to projects"}
      </button>

      {/* Bottom centre: every project's name; click one to bring it to the centre. */}
      <nav
        data-no-drag
        aria-label="Projects in the reel"
        inert={!inReel}
        className="absolute bottom-6 left-1/2 z-30 w-[min(100%-2*var(--gutter),80rem)] -translate-x-1/2 [opacity:calc(1-var(--p)*2.5)]"
      >
        <div
          ref={names}
          className="overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(90deg,transparent,black_2rem,black_calc(100%-2rem),transparent)] [&::-webkit-scrollbar]:hidden"
        >
          <ol className="mx-auto flex w-max items-center px-8 py-1">
            {list.map((p, i) => (
              <li key={p.id} className="flex items-center">
                {i > 0 && <span aria-hidden="true" className="mx-3.5 h-3 w-px bg-text/15" />}
                <button
                  type="button"
                  data-name={i}
                  aria-current={i === activeIndex ? "true" : undefined}
                  onClick={() => engine.current?.scrollToProject(i)}
                  className={cn(
                    "mono-label whitespace-nowrap transition-colors duration-[350ms] ease-power3",
                    i === activeIndex ? "text-text" : "text-muted hover:text-text/80",
                  )}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* State 2: the info panel, bottom left. */}
      {shownProject && (
        <div
          data-no-drag
          inert={!inGallery || Boolean(view)}
          className="absolute bottom-(--gutter) left-(--gutter) z-30 w-[min(380px,100%-2*var(--gutter))] translate-y-[calc((1-clamp(0,(var(--p)-0.6)/0.4,1))*24px)] [opacity:clamp(0,calc((var(--p)-0.6)/0.4),1)]"
        >
          <ProjectInfo
            project={shownProject}
            headingRef={infoHeading}
            className={cn(
              "[transition:opacity_600ms_var(--ease-power3),filter_600ms_var(--ease-power3)]",
              view?.open && "opacity-30 blur-[4px]",
            )}
          />
        </div>
      )}

      {/* State 3: one photo enlarged. */}
      {view && strip && (
        <ImageView
          tiles={strip.tiles}
          index={view.index}
          open={view.open}
          tileRect={(i) => {
            const el = tiles.current[i];
            const s = root.current?.getBoundingClientRect();
            if (!el || !s) return null;
            const r = el.getBoundingClientRect();
            if (r.right < s.left || r.left > s.right) return null;
            return new DOMRect(r.left - s.left, r.top - s.top, r.width, r.height);
          }}
          onIndex={(i) => engine.current?.stepImage(i - view.index)}
          onRequestClose={() => engine.current?.closeImage()}
          onExited={() => engine.current?.imageExited()}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}

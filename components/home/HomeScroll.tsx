"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { botActions, botTransform } from "@/components/robot";
import { BOT_CAMERA, BOT_HEIGHT, BOT_POSTER, BOT_VIEW_HEIGHT } from "@/components/robot/config";
import { pillReveal } from "@/components/ui/pill-reveal";
import { LAB_DEPTHS, LAB_PAN, LAB_STATIONS, type LabDepth } from "@/lib/home";
import { ACCENTS } from "@/lib/tokens";
import { HOME_ROBOT } from "./HomeRobot";
import { useLabStore } from "./lab-store";

/**
 * Home page scroll choreography (DESIGN.md §12). Wraps every home section
 * and the robot stage.
 *
 * - The hero is pinned for HOME_SCROLL.pin hero heights (GSAP pin). The lab
 *   holds with CSS sticky (it is (stations + 1) screens tall).
 * - ONE scrubbed timeline moves the robot through the whole page by tweening
 *   botTransform: hero → statement → lab → corner (slider, event, numbers) →
 *   on top of the join card → fades out before the footer. It also drives the
 *   hero's wordmark and decorations, the lab's photo pans, pips and grid pan.
 *   Its time unit is px of scroll, so every phase starts at an exact scroll
 *   position, measured from the layout.
 * - The robot's "scene" (held face/icon per section, station icons and glows,
 *   the wave at the join card) follows the timeline's playhead, so it changes
 *   exactly when the visuals do, in both scroll directions.
 * - Statement lines reveal once as they enter (not scrubbed); their pills
 *   grow 150ms later, and the robot reacts with a happy face.
 *
 * The robot's head keeps tracking the cursor on top of botTransform and the
 * mood engine keeps running; scroll moments use botActions.react() / hold().
 *
 * Phones (< 768px): the robot fades out in the statement and stays hidden.
 * Reduced motion: nothing is built (no pin, no scrub); everything renders in
 * its final position and the stage CSS keeps the poster in the hero.
 */

const MOBILE = "(max-width: 767.98px)";

export const HOME_SCROLL = {
  /** Extra scroll the hero stays pinned for, in hero heights (≈ viewport heights). */
  pin: { desktop: 1.2, mobile: 0.6 },
  /** Seconds the scrubbed timeline takes to catch up with the scroll. */
  scrub: 1,
  /** Wordmark speed while pinned, relative to the scroll. */
  wordmarkSpeed: 1.4,
  robot: {
    /** While pinned: drops this many hero heights, grows to this scale, ends facing the camera. */
    drop: 0.25,
    grow: 1.12,
    /** Fraction of the pin at which it looks left, towards the statement. */
    lookLeftAt: 0.6,
    /** Statement (md+): scale relative to the hero, base height (fraction of the stage), body turn (rad). */
    statementScale: 0.6,
    statementBase: 0.8,
    statementRotY: -0.45,
    /** Scroll (in hero heights) over which it moves into the statement / fades out on phones. */
    enter: 0.85,
    fade: 0.45,
  },
  lab: {
    /** Robot size relative to the hero, its centre (fraction of the viewport width) and base (fraction of the stage). */
    scale: 1.1,
    cx: 0.55,
    base: 0.93,
    /** Scroll (in screens) each pan between stations takes, centred on the boundary. */
    pan: 0.7,
    /** Body turn towards the incoming photos during a pan (rad, ≈15°). */
    turn: 0.26,
    /** Grid background pan per station (px). */
    gridPan: 40,
    /** Space kept between the robot and the card / heading where they would meet (px). */
    clear: 20,
  },
  /** Slider → numbers: robot height and how much of it peeks above the bottom edge (fractions of the stage). */
  corner: { height: 0.34, peek: 0.22 },
  join: {
    /** Robot height (fraction of the stage). */
    height: 0.34,
    /** The robot lands when the card's bottom edge reaches this fraction of the viewport (the whole card in view). */
    land: 0.9,
    /** It has faded out by the time the footer's top reaches this fraction of the viewport… */
    footer: 0.8,
    /** …fading over this much scroll (screens). */
    fade: 0.25,
  },
} as const;

/** Far enough right that the robot is outside its stage, so the canvas stops rendering. */
const OFFSTAGE_X = 50;

type SceneId = "free" | "lab" | "slider" | "event" | "join";

export function HomeScroll({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [layoutKey, setLayoutKey] = useState(0);
  const builtFor = useRef("");

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const { hero, statement, stage } = parts(root);
      if (prefersReducedMotion() || !hero || !statement || !stage) {
        builtFor.current = layoutSignature(root);
        return;
      }

      /* ---- Measure the layout first (before the pin adds its spacer). */
      const mobile = window.matchMedia(MOBILE).matches;
      const R = HOME_SCROLL.robot;
      const H = hero.offsetHeight; // 100svh: the "screen" unit below
      const W = window.innerWidth;
      const P = H * (mobile ? HOME_SCROLL.pin.mobile : HOME_SCROLL.pin.desktop);
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      const docH = document.documentElement.scrollHeight;
      /** Scroll position at which `el`'s top reaches the viewport top (everything below the hero moves down by P). */
      const at = (el: Element) => el.getBoundingClientRect().top + window.scrollY - rootTop + P;
      const lab = root.querySelector<HTMLElement>("[data-lab]");
      const slider = root.querySelector<HTMLElement>("[data-slider]");
      const event = root.querySelector<HTMLElement>("[data-event]");
      const numbers = root.querySelector<HTMLElement>("[data-numbers]");
      const card = root.querySelector<HTMLElement>("[data-join-card]");
      const footer = document.getElementById("site-footer");
      const grid = document.querySelector<HTMLElement>("[data-grid-lines]");
      const marks = {
        lab: lab ? at(lab) : 0,
        slider: slider ? at(slider) : 0,
        event: event ? at(event) : 0,
        numbers: numbers ? at(numbers) : 0,
        card: card ? at(card) : 0,
        footer: footer ? at(footer) : 0,
      };
      const docMax = docH + P - H; // last scroll position once the pin spacer is in

      /* ---- Robot placement maths (md+). */
      const stageBox = stage.getBoundingClientRect(); // fixed: viewport coordinates
      const ppu = stageBox.height / BOT_VIEW_HEIGHT; // px per world unit at z = 0
      const gutter = parseFloat(getComputedStyle(root).getPropertyValue("--gutter")) || 32;
      const heroH = (HOME_ROBOT.scale * BOT_HEIGHT) / BOT_VIEW_HEIGHT; // hero robot height, fraction of the stage
      const halfWidth = (h: number) => ((BOT_POSTER.width / BOT_POSTER.height) * h * stageBox.height) / 2;
      /** Robot `h` (fraction of stage height) tall, centred at viewport x `cx`, base at `base` (fraction of the stage from its top; > 1 is below it). */
      const pose = (cx: number, base: number, h: number) => ({
        x: (cx - stageBox.left - stageBox.width / 2) / ppu,
        y: BOT_CAMERA.position[1] - (base - 0.5) * BOT_VIEW_HEIGHT,
        scale: (h * BOT_VIEW_HEIGHT) / BOT_HEIGHT,
      });

      ScrollTrigger.create({ trigger: hero, start: "top top", end: `+=${P}`, pin: true, anticipatePin: 1 });
      if (grid) gsap.set(grid, { "--grid-x": "0px" });

      // Time unit = px of scroll from the top of the page.
      const scene = { id: "" as SceneId | "", station: -1, t: 0, alive: true };
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" }, onUpdate: () => syncScene() });
      const scrub: { trigger?: ScrollTrigger } = {}; // set below; read by the look-left callback
      const base = HOME_ROBOT;
      const dropY = base.y - (R.drop * H) / ppu;

      /* 1. Hero, pinned: [0, P] */
      tl.to(botTransform, { y: dropY, scale: base.scale * R.grow, rotY: 0, duration: P }, 0);
      tl.to("[data-hero-wordmark]", { y: -HOME_SCROLL.wordmarkSpeed * P, opacity: 0, duration: P }, 0);
      tl.to("[data-hero-scroll]", { opacity: 0, duration: 0.12 * P }, 0);
      hero.querySelectorAll<HTMLElement>("[data-rise]").forEach((el) => {
        tl.to(el, { y: -Number(el.dataset.rise) * P, duration: P }, 0);
      });
      hero.querySelectorAll<HTMLElement>("[data-drift]").forEach((el) => {
        tl.to(el, { x: Number(el.dataset.drift), duration: P }, 0);
      });
      tl.to(hero.querySelectorAll("[data-spin]"), { rotation: 90, duration: P }, 0);
      tl.call(
        () => {
          if (scrub.trigger && scrub.trigger.direction < 0) return; // only on the way down
          const t = botTransform;
          // Down and to the left: where the statement's headline comes in.
          botActions.lookAt([t.x - 3 * t.scale, t.y + 0.9 * t.scale, t.z + 2.2], 1600);
          botActions.react("look-left", 1600);
        },
        undefined,
        R.lookLeftAt * P,
      );

      /** Which scene the robot is in at timeline time t (md+ only). */
      let sceneAt: (t: number) => SceneId = () => "free";
      let labStart = Infinity;

      if (mobile) {
        /* 2. Phones: the robot fades out as the statement comes in, then leaves the stage (rendering stops). */
        const fade = R.fade * H;
        tl.to(stage, { autoAlpha: 0, duration: fade }, P);
        tl.to(botTransform, { y: dropY - 0.25, duration: fade }, P);
        tl.set(botTransform, { x: OFFSTAGE_X }, P + fade);
      } else {
        /* 2. Statement: to the right edge, smaller, turned towards the headline: [P, P + enter] */
        const enter = R.enter * H;
        const stH = heroH * R.statementScale;
        tl.to(
          botTransform,
          { ...pose(W - gutter - halfWidth(stH), R.statementBase, stH), rotY: R.statementRotY, duration: enter },
          P,
        );

        /* 3. Lab: centre-right and bigger as the lab comes up, then holds while it is sticky. */
        const L = HOME_SCROLL.lab;
        const N = LAB_STATIONS.length;
        let labH = heroH * L.scale * Math.min(1, W / H / 1.55); // a little smaller on squarer screens
        let labCx = L.cx * W;
        let labBase: number = L.base;
        const ui = lab?.querySelector<HTMLElement>("[data-lab-ui]");
        const labCard = lab?.querySelector<HTMLElement>("[data-lab-card]");
        const labTop = lab?.querySelector<HTMLElement>("[data-lab-top]");
        if (ui && labCard && labTop) {
          // Keep the card (bottom right) off the robot. Viewport px while the UI layer is stuck:
          const u = ui.getBoundingClientRect();
          const c = labCard.getBoundingClientRect();
          const hw = halfWidth(labH); // poster half-width; the body is about half of it
          if (labCx + hw / 2 > c.left) {
            const shifted = c.left - L.clear - hw / 2;
            const floor = c.top - u.top - L.clear;
            const ceiling = Math.max(stageBox.top, labTop.getBoundingClientRect().bottom - u.top) + L.clear;
            const fit = Math.min(heroH * L.scale, (floor - ceiling) / stageBox.height);
            if (W / H >= 1.2 && shifted - hw >= stageBox.left) {
              labCx = shifted; // landscape: step left of the card
            } else if (fit >= labH / 2) {
              labH = fit; // portrait: stand above the card, as big as fits under the heading
              labBase = (floor - stageBox.top) / stageBox.height;
            } else {
              labCx = Math.max(shifted, stageBox.left + hw);
            }
            labCx = Math.max(labCx, stageBox.left + halfWidth(labH));
          }
        }
        labStart = lab ? marks.lab : Infinity;
        const labEnd = labStart + N * H; // the sticky layers let go
        const labIn = Math.max(P + enter, labStart - H);
        if (lab) {
          tl.to(botTransform, { ...pose(labCx, labBase, labH), rotY: 0, duration: Math.max(1, labStart - labIn) }, labIn);

          const pan = L.pan * H;
          const layers = lab.querySelectorAll<HTMLElement>("[data-lab-layer]");
          for (let k = 1; k < N; k++) {
            const from = labStart + k * H - pan / 2; // centred on the station boundary
            layers.forEach((el) => {
              const depth = LAB_DEPTHS[el.dataset.labLayer as LabDepth] ?? 1;
              tl.to(el, { xPercent: -k * LAB_PAN * 100 * depth, duration: pan }, from);
            });
            if (grid) tl.to(grid, { "--grid-x": `${-k * L.gridPan}px`, duration: pan }, from);
            // Turn towards the photos coming in from the right, then back.
            tl.to(botTransform, { rotY: L.turn, duration: pan / 2 }, from);
            tl.to(botTransform, { rotY: 0, duration: pan / 2 }, from + pan / 2);
          }
          lab.querySelectorAll("[data-pip-fill]").forEach((fill, k) => {
            tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: H }, labStart + k * H);
          });
        }

        /* 4. Slider, event, numbers: ducks into the bottom-right corner, only its head peeking up. */
        const C = HOME_SCROLL.corner;
        const cornerAt = lab ? labEnd : P + enter;
        tl.to(
          botTransform,
          { ...pose(W - gutter - halfWidth(C.height), 1 + C.height - C.peek, C.height), rotY: -0.3, duration: 0.8 * H },
          cornerAt,
        );

        /* 5. Join: lands on the card's top edge, centred, waves, rides up with the card, fades before the footer. */
        const J = HOME_SCROLL.join;
        let land = Infinity;
        if (card) {
          const navH = parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 84;
          // Card top (px from the viewport top) when the robot lands: whole card in view, robot clear of the
          // header and inside its stage (portrait tablets: the stage is shorter than the screen, see HomeRobot).
          const robotPx = J.height * stageBox.height;
          const cardY = Math.max(J.land * H - card.offsetHeight, Math.max(navH, stageBox.top) + 8 + robotPx);
          land = Math.min(marks.card - cardY, docMax - 1);
          land = Math.max(land, cornerAt + 0.8 * H + 1);
          const landY = marks.card - land; // the card's actual top at landing (differs only if the page is short)
          const joinPose = pose(W / 2, (landY - stageBox.top) / stageBox.height + 0.012, J.height);
          const joinIn = Math.max(cornerAt + 0.8 * H, land - 0.8 * H);
          tl.to(botTransform, { ...joinPose, rotY: 0, duration: land - joinIn }, joinIn);
          // Then it rides up with the card (1px of scroll = 1px up)…
          const ride = Math.max(1, docMax - land);
          tl.to(botTransform, { y: joinPose.y + ride / ppu, duration: ride }, land);
          // …and fades out before the footer arrives, or (portrait tablets) by the time half of it has ridden
          // out through the top of its stage.
          let fadeAt = footer ? marks.footer - J.footer * H : docMax;
          if (stageBox.top > navH) fadeAt = Math.min(fadeAt, land + landY - stageBox.top - robotPx / 2);
          const fadeEnd = Math.min(Math.max(fadeAt, land + 2), docMax);
          const fadeStart = Math.max(land + 1, fadeEnd - J.fade * H);
          tl.to(stage, { autoAlpha: 0, duration: Math.max(1, fadeEnd - fadeStart) }, fadeStart);
          tl.set(botTransform, { x: OFFSTAGE_X }, fadeEnd);
        }

        const starts: [SceneId, number][] = (
          [
            ["lab", lab ? labStart - 0.5 * H : Infinity],
            ["slider", slider ? marks.slider - 0.6 * H : Infinity],
            ["event", event ? marks.event - 0.6 * H : Infinity],
            ["free", numbers ? marks.numbers - 0.6 * H : Infinity],
            ["join", land - 0.35 * H],
          ] as [SceneId, number][]
        ).filter(([, t]) => Number.isFinite(t));
        sceneAt = (t) => {
          let id: SceneId = "free";
          for (const [sid, from] of starts) if (t >= from) id = sid;
          return id;
        };
      }

      /** Applies the robot's scene for the playhead (called on every timeline update; acts only on changes). */
      function syncScene() {
        if (!scene.alive) return;
        const t = tl.time();
        const forward = t >= scene.t;
        scene.t = t;
        const N = LAB_STATIONS.length;
        const station = Number.isFinite(labStart) ? Math.min(N - 1, Math.max(0, Math.floor((t - labStart) / H))) : 0;
        if (useLabStore.getState().station !== station) useLabStore.setState({ station });

        const id = sceneAt(t);
        if (id === scene.id && (id !== "lab" || station === scene.station)) return;
        const entering = id !== scene.id;
        scene.id = id;
        scene.station = station;
        switch (id) {
          case "lab": {
            const s = LAB_STATIONS[station];
            botActions.hold("lab", "idle", s.icon); // the face glitch-switches to the station's icon
            botActions.glow(ACCENTS[s.accent]);
            break;
          }
          case "slider":
            botActions.hold("slider", "sleepy");
            break;
          case "event":
            botActions.hold("event", "idle", "calendar");
            break;
          case "join":
            botActions.hold("join", "happy");
            if (entering && forward) botActions.wave();
            break;
          default:
            botActions.release();
        }
      }

      // Triggered by the wrapper, not the hero: a pinned trigger is offset by its own pin length.
      scrub.trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: `+=${tl.duration()}`,
        scrub: HOME_SCROLL.scrub,
        animation: tl,
      });

      /* Statement: reveal each line once, then grow its pills (robot smiles at each). */
      statement.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        const line = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
        line.from(el, { y: 40, opacity: 0, duration: DURATION.base, ease: EASE.out });
        el.querySelectorAll("[data-pill]").forEach((pill, i) => {
          line.add(pillReveal(pill, { onStart: () => botActions.react("happy", 900) }), 0.15 + i * STAGGER);
        });
      });

      // Recompute every trigger now that the pin exists (section components' own triggers refresh last).
      ScrollTrigger.refresh();
      builtFor.current = layoutSignature(root);

      return () => {
        scene.alive = false;
        botActions.release();
        useLabStore.setState({ station: 0 });
      };
    },
    { scope, dependencies: [reduced, layoutKey], revertOnUpdate: true },
  );

  // Phases are measured in px, so rebuild when the sections, stage or footer
  // change size (resize, rotation, fonts). Mobile URL-bar resizes don't
  // change them (everything is in svh), so they don't trigger a rebuild.
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (layoutSignature(root) !== builtFor.current) setLayoutKey((k) => k + 1);
      }, 150);
    });
    [root, ...Object.values(parts(root)), document.getElementById("site-footer")].forEach((el) => el && ro.observe(el));
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return <div ref={scope}>{children}</div>;
}

function parts(root: HTMLElement) {
  return {
    hero: root.querySelector<HTMLElement>("[data-home-hero]"),
    statement: root.querySelector<HTMLElement>("[data-statement]"),
    stage: root.querySelector<HTMLElement>("[data-home-robot]"),
  };
}

function layoutSignature(root: HTMLElement) {
  const { hero, stage } = parts(root);
  return [
    root.offsetHeight,
    hero?.offsetWidth,
    hero?.offsetHeight,
    stage?.clientWidth,
    stage?.clientHeight,
    document.getElementById("site-footer")?.offsetHeight,
    window.matchMedia(MOBILE).matches,
  ].join("|");
}

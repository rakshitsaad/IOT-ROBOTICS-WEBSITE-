"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { IrisButton, PillButton } from "@/components/ui";
import { FINE_POINTER, useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { ENTRANCE_ORDER, JOIN_CHARACTERS, JOIN_MOTION, characterBySlug, type JoinCharacter } from "@/lib/join";
import { useUIStore } from "@/lib/store";
import { CharacterAvatar } from "./CharacterAvatar";
import { scrollToTeams } from "./scroll";

/**
 * The /join hero (DESIGN.md §21): a centred headline over a crowd of seven cartoon students, one per team, posing for a
 * group selfie from the bottom of the screen.
 *
 * Each character is a stack of wrappers, so every motion has its own transform:
 *   .crowd-char (spot, from lib/join.ts) → [data-sink] (scroll) → .crowd-enter (pop-up, CSS) → [data-par] (cursor)
 *   → pose (hover lift, lean, tilt; a CSS spring) → bob (idle, CSS) → the image, its dimmed copy and the hit area.
 *
 * - Entrance (CSS keyframes from the server HTML, after the headline): back row, middle, front, 90ms apart, each rising
 *   from under the edge with an overshoot.
 * - Idle: bob 4–8px over 2.5–4s and sway ±1.5deg, each out of sync.
 * - Cursor (md+, fine pointers): each row drifts towards the cursor (front 24px, middle 14, back 6) and the group
 *   turns up to 3deg (rotateY), damped.
 * - Hover / focus (a head-and-shoulders hit area): the character lifts 14px, scales 1.05 and straightens; the others
 *   dim to 70% (a darker copy fades in: only opacity animates); its neighbours lean 2.5deg away; a speech bubble pops
 *   up above its head. Click: the apply form with the team chosen, or, for a closed team, the bubble shakes.
 * - Touch: a tap shows the bubble; tapping the bubble applies.
 * - Scroll: the crowd sinks and fades as the hero leaves (front row first, back row last).
 * - Reduced motion: no pop-up, bob, parallax or sinking; the bubbles still work.
 */

const BUBBLE_W = 264;

export function JoinHero({
  hiring,
  recruitmentOpen,
  year,
}: {
  /** Team slug → hiring now. */
  hiring: Record<string, boolean>;
  recruitmentOpen: boolean;
  year: number;
}) {
  const root = useRef<HTMLElement>(null);
  const router = useRouter();
  const reduced = useReducedMotion();
  const phone = useMediaQuery("(max-width: 767.98px)");
  const lenis = useUIStore((s) => s.lenis);

  const [active, setActive] = useState<string | null>(null);
  const [bubble, setBubble] = useState<{ x: number; y: number; tail: number } | null>(null);
  const [nope, setNope] = useState<{ slug: string; n: number } | null>(null);
  const leaveTimer = useRef(0);
  const lastPointer = useRef<string>("mouse");
  /** The character whose bubble a tap opened (focus opens bubbles too, so `active` alone can't tell). */
  const tapped = useRef<string | null>(null);

  const openCount = Object.values(hiring).filter(Boolean).length;
  const visible = JOIN_CHARACTERS.filter((c) => !phone || c.mobile);
  // Neighbours by position, so the ones beside the hovered character lean away from it.
  const order = [...visible].sort((a, b) => (phone ? a.mobile!.x - b.mobile!.x : a.desktop.x - b.desktop.x)).map((c) => c.slug);
  const ai = active ? order.indexOf(active) : -1;

  /** Show a character's bubble above its head (measured from its hit area). */
  const show = useCallback((slug: string) => {
    window.clearTimeout(leaveTimer.current);
    const hero = root.current;
    const hit = hero?.querySelector<HTMLElement>(`[data-hit="${slug}"]`);
    if (!hero || !hit) return;
    const h = hero.getBoundingClientRect();
    const r = hit.getBoundingClientRect();
    const cx = r.left + r.width / 2 - h.left;
    const half = BUBBLE_W / 2;
    const x = Math.min(Math.max(cx, half + 12), h.width - half - 12);
    setBubble({ x, y: r.top - h.top - JOIN_MOTION.lift - 6, tail: Math.min(Math.max(cx - (x - half), 28), BUBBLE_W - 28) });
    setActive(slug);
  }, []);
  const hide = useCallback((delay = 140) => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      setActive(null);
      setNope(null);
      tapped.current = null;
    }, delay);
  }, []);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  // A tap outside the crowd and the bubble closes the bubble (touch).
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-hit], [data-bubble]")) return;
      hide(0);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [active, hide]);

  const apply = (c: JoinCharacter) => {
    if (hiring[c.slug]) router.push(`/join/apply?team=${c.slug}`);
    else {
      show(c.slug);
      setNope((p) => ({ slug: c.slug, n: (p?.n ?? 0) + 1 }));
    }
  };

  const onHitClick = (c: JoinCharacter) => {
    // Touch: the first tap shows the bubble (tapping the bubble, or the character again, applies). Mouse and keyboard
    // apply straight away.
    if (lastPointer.current !== "mouse" && tapped.current !== c.slug) {
      tapped.current = c.slug;
      show(c.slug);
      return;
    }
    apply(c);
  };

  /* ---------------------------------------------------------------- GSAP: cursor parallax, tilt, scroll sink */
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(`(prefers-reduced-motion: no-preference) and (min-width: 768px) and ${FINE_POINTER}`, () => {
        const tilt = el.querySelector("[data-crowd-tilt]");
        const tiltTo = gsap.quickTo(tilt, "rotationY", { duration: 1.2, ease: "power3.out" });
        const movers = JOIN_CHARACTERS.map((c) => {
          const par = el.querySelector(`[data-par="${c.slug}"]`);
          return {
            d: JOIN_MOTION.parallax[c.row],
            x: gsap.quickTo(par, "x", { duration: 1, ease: "power3.out" }),
            y: gsap.quickTo(par, "y", { duration: 1, ease: "power3.out" }),
          };
        });
        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          const ny = (e.clientY / window.innerHeight) * 2 - 1;
          movers.forEach((m) => {
            m.x(nx * m.d);
            m.y(ny * m.d * 0.6);
          });
          tiltTo(nx * JOIN_MOTION.tilt);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Front row sinks first, the back row last.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
        const rows = ["front", "middle", "back"] as const;
        rows.forEach((row, i) => {
          const sinks = JOIN_CHARACTERS.filter((c) => c.row === row).map((c) => el.querySelector(`[data-sink="${c.slug}"]`));
          tl.fromTo(sinks, { y: 0, opacity: 1 }, { y: () => el.offsetHeight * 0.32, opacity: 0, ease: "none", duration: 0.6 }, i * 0.14);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const current = active ? characterBySlug(active) : undefined;
  const t0 = 100;

  return (
    <section
      ref={root}
      aria-labelledby="join-title"
      className="relative h-svh min-h-[38rem] overflow-hidden bg-bg [perspective:1600px]"
      onPointerDownCapture={(e: ReactPointerEvent) => (lastPointer.current = e.pointerType)}
    >
      {/* The spotlight behind the crowd. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-radial-[70%_62%_at_50%_92%] from-red/12 via-red/5 via-50% to-transparent to-80%" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-radial-[45%_60%_at_50%_100%] from-red/12 to-transparent" />

      {/* Headline and buttons (only their controls take the pointer, so heads beside them stay hoverable). */}
      <div className="pointer-events-none relative z-20 flex flex-col items-center px-4 pt-header text-center">
        <p
          className="mt-[clamp(0.75rem,3svh,2rem)] inline-flex animate-fade-up items-center gap-2 rounded-pill bg-bg-2 px-4 py-2 text-[13px] leading-none text-text/85 ring-1 ring-line motion-reduce:animate-none"
          style={{ animationDelay: `${t0}ms` }}
        >
          {recruitmentOpen ? (
            <>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-red" />
              Recruitment {year}
              <span aria-hidden="true" className="text-text/35">
                /
              </span>
              <span className="font-mono text-[12px] tracking-[0.06em] text-text">[{String(openCount).padStart(2, "0")}]</span> teams hiring
            </>
          ) : (
            "Recruitment opens soon"
          )}
        </p>
        <h1
          id="join-title"
          className="mt-5 text-[length:clamp(2rem,9vw,2.6rem)] leading-[1.04] font-bold tracking-[-0.04em] md:mt-6 md:text-[length:clamp(2.4rem,min(5.5vw,8svh),4.5rem)]"
        >
          {["Find your crew,", "build what's next."].map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <span className="block animate-rise motion-reduce:animate-none" style={{ animationDelay: `${t0 + 100 + i * 80}ms` }}>
                {line}
              </span>
            </span>
          ))}
        </h1>
        <p
          className="mt-4 max-w-[32rem] animate-fade-up text-[15px] leading-relaxed text-muted motion-reduce:animate-none md:mt-5 md:text-[17px]"
          style={{ animationDelay: `${t0 + 320}ms` }}
        >
          Join the students who design, code, fly and solder things into existence.
        </p>
        <div
          className="pointer-events-auto mt-6 flex w-full animate-fade-up flex-col items-center gap-3 motion-reduce:animate-none sm:w-auto sm:flex-row"
          style={{ animationDelay: `${t0 + 420}ms` }}
        >
          <IrisButton href="/join/apply" size="lg" className="w-full sm:w-auto">
            Apply now
          </IrisButton>
          <PillButton variant="ghost" size="lg" onClick={() => scrollToTeams(lenis)} className="w-full bg-bg/40 backdrop-blur-sm sm:w-auto">
            <span aria-hidden="true" className="-ml-2 flex">
              {["tech", "design", "social-media"].map((s, i) => (
                <CharacterAvatar key={s} character={characterBySlug(s)!} sizes="56px" className={cn("size-7 ring-2 ring-bg", i > 0 && "-ml-2.5")} />
              ))}
            </span>
            Explore teams
          </PillButton>
        </div>
      </div>

      {/* The crowd: a bottom-anchored box (min(100%, 150svh) wide on md+, full width on phones). */}
      <div className="absolute bottom-0 left-1/2 z-10 h-0 w-[min(100%,150svh)] -translate-x-1/2 [container-type:inline-size] max-md:w-full">
        <div data-crowd-tilt className="absolute inset-0 origin-bottom [transform-style:preserve-3d]">
          {JOIN_CHARACTERS.map((c, i) => {
            const isActive = active === c.slug;
            const idx = order.indexOf(c.slug);
            const lean = ai >= 0 && !isActive ? (idx === ai - 1 ? -JOIN_MOTION.lean : idx === ai + 1 ? JOIN_MOTION.lean : 0) : 0;
            const dim = active !== null && !isActive;
            const enterIndex = ENTRANCE_ORDER.indexOf(c.slug);
            const seed = (i * 37 + 11) % 100 / 100;
            const vars = {
              "--x": c.desktop.x,
              "--s": c.desktop.s,
              "--b": c.desktop.b,
              "--r": c.desktop.r,
              "--z": c.desktop.z,
              "--fade": c.desktop.fade ?? 0,
              "--mx": c.mobile?.x ?? 0,
              "--ms": c.mobile?.s ?? 0,
              "--mb": c.mobile?.b ?? 0,
              "--mr": c.mobile?.r ?? 0,
              "--mz": c.mobile?.z ?? 0,
              "--mfade": c.mobile?.fade ?? 0,
            } as CSSProperties;
            const front = c.row === "front";
            const sizes = `(max-width: 767px) ${Math.round((c.mobile?.s ?? 0) / 10)}vw, ${Math.round(c.desktop.s / 10)}vw`;
            const [hx0, hy0, hx1, hy1] = c.hit;
            const [fx0, fy0, fx1, fy1] = c.face;
            return (
              <div key={c.slug} className="crowd-char" data-phone={c.mobile ? "true" : "false"} style={vars}>
                <div data-sink={c.slug} className="size-full">
                  <div
                    className="size-full animate-crowd-pop motion-reduce:animate-none"
                    style={{ animationDelay: `${JOIN_MOTION.enterDelay + enterIndex * JOIN_MOTION.enterStagger}s` }}
                  >
                    <div data-par={c.slug} className="size-full">
                      <div
                        className="size-full origin-bottom transition-transform duration-[550ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{
                          transform: isActive
                            ? `translateY(-${JOIN_MOTION.lift}px) scale(${JOIN_MOTION.scale}) rotate(0deg)`
                            : `rotate(calc(var(--R) * 1deg + ${lean}deg))`,
                        }}
                      >
                        <div
                          className="crowd-fade relative size-full origin-bottom animate-crowd-bob motion-reduce:animate-none"
                          style={
                            {
                              "--bob": `${JOIN_MOTION.bob[0] + seed * (JOIN_MOTION.bob[1] - JOIN_MOTION.bob[0])}px`,
                              "--sway": `${JOIN_MOTION.sway}deg`,
                              animationDuration: `${JOIN_MOTION.bobPeriod[0] + ((seed * 7) % 1) * (JOIN_MOTION.bobPeriod[1] - JOIN_MOTION.bobPeriod[0])}s`,
                              animationDelay: `${-seed * 4}s`,
                            } as CSSProperties
                          }
                        >
                          <Image
                            src={c.image}
                            alt=""
                            fill
                            sizes={sizes}
                            preload={front}
                            loading={front || c.eager ? "eager" : "lazy"}
                            className="pointer-events-none object-contain select-none"
                          />
                          {/* A darker copy that fades in while another character is hovered (only opacity animates). */}
                          <Image
                            src={c.image}
                            alt=""
                            fill
                            sizes={sizes}
                            loading={front || c.eager ? "eager" : "lazy"}
                            className={cn(
                              "pointer-events-none object-contain brightness-[0.7] transition-opacity duration-[350ms] select-none",
                              dim ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span
                            data-face-box={c.slug}
                            aria-hidden="true"
                            className="pointer-events-none absolute"
                            style={{ left: `${fx0 * 100}%`, top: `${fy0 * 100}%`, width: `${(fx1 - fx0) * 100}%`, height: `${(fy1 - fy0) * 100}%` }}
                          />
                          <button
                            type="button"
                            data-hit={c.slug}
                            data-cursor="link"
                            aria-label={`${c.team}: ${hiring[c.slug] ? "hiring. Apply" : "closed, opens next round"}`}
                            onPointerEnter={(e) => e.pointerType === "mouse" && show(c.slug)}
                            onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
                            onFocus={() => show(c.slug)}
                            onBlur={() => hide()}
                            onClick={() => onHitClick(c)}
                            className="absolute rounded-[42%_42%_30%_30%] outline-offset-2"
                            style={{ left: `${hx0 * 100}%`, top: `${hy0 * 100}%`, width: `${(hx1 - hx0) * 100}%`, height: `${(hy1 - hy0) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The speech bubble. */}
      <AnimatePresence>
        {current && bubble && (
          <motion.div
            key={current.slug}
            data-bubble
            initial={reduced ? false : { opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 6, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 420, damping: 22, mass: 0.8 }}
            className="absolute z-30"
            style={{ left: bubble.x - BUBBLE_W / 2, top: bubble.y, width: BUBBLE_W, translateY: "-100%", transformOrigin: `${bubble.tail}px 100%` }}
            onPointerEnter={() => window.clearTimeout(leaveTimer.current)}
            onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
          >
            <Bubble
              character={current}
              hiring={hiring[current.slug]}
              tail={bubble.tail}
              shake={nope?.slug === current.slug ? nope.n : 0}
              onClosedTap={() => apply(current)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <p aria-live="polite" className="sr-only">
        {current ? `${current.team}: ${hiring[current.slug] ? "hiring" : "closed"}. ${current.pitch}` : ""}
      </p>
    </section>
  );
}

function Bubble({
  character,
  hiring,
  tail,
  shake,
  onClosedTap,
}: {
  character: JoinCharacter;
  hiring: boolean;
  tail: number;
  shake: number;
  onClosedTap(): void;
}) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="text-[17px] leading-tight font-bold tracking-[-0.02em]">{character.team}</span>
        <span
          className={cn(
            "rounded-pill px-2.5 py-1 font-mono text-[10px] leading-none tracking-[0.1em] uppercase",
            hiring ? "bg-red text-text" : "bg-bg/10 text-bg/60",
          )}
        >
          {hiring ? "Hiring" : "Closed"}
        </span>
      </span>
      <span className="mt-1.5 block text-[13px] leading-snug text-bg/75">{character.pitch}</span>
      <span className={cn("mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold", hiring ? "text-bg" : "text-bg/55")}>
        {hiring ? (
          <>
            Apply <span aria-hidden="true">→</span>
          </>
        ) : shake ? (
          "Opens next round"
        ) : (
          "Not hiring this round"
        )}
      </span>
      {/* The tail, pointing at the head. */}
      <span aria-hidden="true" className="absolute top-full -mt-[7px] size-3.5 rotate-45 rounded-[3px] bg-text" style={{ left: tail - 7 }} />
    </>
  );
  const cls = "relative block rounded-[18px] bg-text p-4 text-left text-bg shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)]";
  return (
    <div key={shake} className={cn(shake ? "animate-shake motion-reduce:animate-none" : "")}>
      {hiring ? (
        <Link href={`/join/apply?team=${character.slug}`} tabIndex={-1} aria-hidden="true" data-cursor="link" className={cls}>
          {body}
        </Link>
      ) : (
        <button type="button" tabIndex={-1} aria-hidden="true" data-cursor="link" onClick={onClosedTap} className={cn(cls, "w-full")}>
          {body}
        </button>
      )}
    </div>
  );
}

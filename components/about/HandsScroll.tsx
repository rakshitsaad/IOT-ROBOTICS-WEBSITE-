"use client";

import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ABOUT_HANDS as A } from "@/lib/about";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE } from "@/lib/motion";

/**
 * The /about hands controller (DESIGN.md §15). It renders the section and
 * builds, with gsap.matchMedia():
 *
 * - With motion: one pinned, scrubbed timeline (scrub 1; 3 screens on md+,
 *   1.8 on phones) whose time runs 0 → 1 over the pin. The hands close from
 *   40vw apart to touching, the title blurs out, the copy blocks come and go,
 *   and at the touch a glow appears and the ring flashes and bursts. Once the
 *   pin lets go, the stage fades out as it scrolls away into the next section.
 * - md+ with a fine pointer: cursor parallax (hands follow the cursor up to
 *   12px, the ring moves up to 6px the other way).
 * - Reduced motion: nothing. The markup already shows the final layout (hands
 *   close together, ring still, the copy stacked below the scene).
 *
 * The hands start from their CSS pose (translate ±20vw); the timeline adds an
 * x offset in px, recomputed on refresh, so they never jump on hydration.
 */

/** Fast at first, easing into the close-up: about 8vw apart at 35% of the pin on the way from 40vw to 2vw at 65%. */
const approach = (t: number) => 1 - Math.pow(1 - t, 2.5);

export function HandsScroll({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const stage = q("[data-hands-stage]")[0] as HTMLElement | undefined;
      if (!stage) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          // matchMedia only calls back while at least one condition matches, so phones need their own.
          phone: "(max-width: 767.98px)",
          desktop: "(min-width: 768px)",
          fine: "(hover: hover) and (pointer: fine)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { desktop, fine, reduce } = ctx.conditions as { desktop: boolean; fine: boolean; reduce: boolean };
          if (reduce) return;

          const hands = [...q('[data-hand="human"]'), ...q('[data-hand="robot"]')];
          const title = q("[data-hands-title]");
          const ring = q("[data-ring-scale]");
          const flash = q("[data-ring-flash]");
          const glow = q("[data-hands-glow]");
          const [a, b, c] = ["a", "b", "c"].map((k) => q(`[data-hands-block="${k}"]`));

          /** x for hand i (0 human → right, 1 robot → left) so the fingertips are `gap` vw apart. */
          const toGap = (gap: number) => (i: number) => (i === 0 ? 1 : -1) * ((A.gap.start - gap) / 2) * (window.innerWidth / 100);
          const at = A.at;

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * (desktop ? A.pin.desktop : A.pin.mobile)}`,
              pin: stage,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });

          // The hands: 40vw → 2vw apart by 65%, a slow drift closer, then the touch.
          tl.fromTo(hands, { x: 0 }, { x: toGap(A.gap.close), ease: approach, duration: at.close }, 0)
            .to(hands, { x: toGap(A.gap.hold), duration: at.meet - at.close }, at.close)
            .to(hands, { x: toGap(A.gap.meet), ease: "sine.inOut", duration: at.touch + 0.005 - at.meet }, at.meet);

          // 0–35%: the title shrinks, blurs and fades; the ring grows.
          tl.fromTo(
            title,
            { scale: 1, filter: "blur(0px)", opacity: 1 },
            { scale: A.title.scale, filter: `blur(${A.title.blur}px)`, opacity: 0, duration: at.near },
            0,
          ).fromTo(ring, { scale: 1, opacity: 1 }, { scale: A.ring.near, duration: at.near }, 0);

          // 35–65%: block A rises in bottom left, block B fades in top right.
          tl.fromTo(a, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.15 }, at.aIn).fromTo(
            b,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.15 },
            at.bIn,
          );

          // 65–90%: A and B slide up and out; block C fades in.
          tl.to([...a, ...b], { y: -56, opacity: 0, duration: 0.1, stagger: 0.02 }, at.out).fromTo(
            c,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.12 },
            at.cIn,
          );

          // The touch: a glow at the contact point; the ring flashes, then expands and fades.
          tl.fromTo(glow, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.02 }, at.touch)
            .fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.012 }, at.touch)
            .to(flash, { opacity: 0, duration: 0.03 }, at.touch + 0.012)
            .to(ring, { scale: A.ring.burst, opacity: 0, duration: 1 - at.touch }, at.touch);
          tl.set({}, {}, 1); // the timeline is exactly 1 long, so its time is the share of the pin

          // After the pin: the stage fades as it scrolls away into the next section.
          gsap.fromTo(
            stage,
            { opacity: 1 },
            {
              opacity: 0,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "bottom bottom",
                end: () => `bottom ${Math.round(100 - A.exit * 100)}%`,
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );

          if (!desktop || !fine) return;

          // Cursor parallax: depth from the hands moving with the cursor and the ring against it.
          const follow = (el: Element) => ({
            x: gsap.quickTo(el, "x", { duration: 0.9, ease: EASE.out }),
            y: gsap.quickTo(el, "y", { duration: 0.9, ease: EASE.out }),
          });
          const handLayers = q("[data-hand-parallax]").map(follow);
          const ringLayers = q("[data-ring-parallax]").map(follow);
          const onMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") return;
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            for (const l of handLayers) {
              l.x(nx * A.parallax.hands);
              l.y(ny * A.parallax.hands);
            }
            for (const l of ringLayers) {
              l.x(-nx * A.parallax.ring);
              l.y(-ny * A.parallax.ring);
            }
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          return () => window.removeEventListener("pointermove", onMove);
        },
      );
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} data-hands aria-labelledby="about-title" className={className}>
      {children}
    </section>
  );
}

import Image from "next/image";
import type { CSSProperties } from "react";
import { MonoLabel } from "@/components/ui";
import { ABOUT_HANDS } from "@/lib/about";
import { cn } from "@/lib/cn";
import { HandsScroll } from "./HandsScroll";
import { IrisRing } from "./IrisRing";

/**
 * /about section 1, "Hands" (DESIGN.md §15): a human hand from the left and a
 * robot hand from the right reaching for each other in front of the iris
 * ring. HandsScroll pins it and drives the [data-*] hooks below.
 *
 * Layers, back to front: bg, ring, title, hands, glow,
 * copy blocks. Everything is placed against `--tip-y`, the line the
 * fingertips point along (42% of the screen on phones, 52% from md).
 *
 * The markup is the motion layout's first frame (hands 40vw apart, copy
 * hidden), so nothing jumps on hydration. Under reduced motion the CSS swaps
 * in the final layout: the hands close together, the ring still, and the copy
 * stacked below the scene. The `motion-safe:` classes are the pinned layout.
 */


export function HandsSection({ clubName }: { clubName: string }) {
  const vars = {
    "--hand-from": `${ABOUT_HANDS.gap.start / 2}vw`,
    "--hand-near": `${ABOUT_HANDS.gap.reduced / 2}vw`,
  } as CSSProperties;

  return (
    <HandsScroll className="relative">
      <div
        data-hands-stage
        style={vars}
        className="relative isolate overflow-clip bg-bg [--copy-edge:clamp(1.5rem,7svh,4.5rem)] [--tip-y:42%] md:[--tip-y:52%]"
      >
        {/* The scene: one screen. */}
        <div className="relative h-svh overflow-clip">
          <IrisRing className="top-(--tip-y) left-1/2 -translate-1/2" />

          <div className="absolute inset-x-0 top-[calc((var(--nav-h)+var(--ann-h)+var(--tip-y))/2)] -translate-y-1/2 px-gutter text-center md:top-[calc(var(--tip-y)-15svh)]">
            <div data-hands-title className="will-change-transform">
              <h1
                id="about-title"
                className="mx-auto max-w-[13em] text-[length:clamp(1.9rem,8.2vw,2.6rem)] leading-[1.06] tracking-[-0.035em] md:max-w-none md:text-[length:clamp(2.25rem,4.4vw,4.5rem)]"
              >
                <span className="block font-bold">{clubName}</span>
                <span className="block font-medium text-text/75">
                  where humans meet <span className="text-red">machines</span>
                </span>
              </h1>
            </div>
          </div>

          <Hand side="human" />
          <Hand side="robot" />

          {/* The contact point's glow (shown at the touch). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-(--tip-y) left-1/2 size-[clamp(5rem,16vmin,10rem)] -translate-1/2 motion-reduce:hidden"
          >
            <div data-hands-glow className="size-full opacity-0">
              <div className="size-full animate-pulse-soft rounded-full bg-radial from-text from-5% via-text/25 via-25% to-transparent to-65% motion-reduce:animate-none" />
            </div>
          </div>
        </div>

        <HandsCopy />
      </div>
    </HandsScroll>
  );
}

/**
 * One hand, its fingertip on `--tip-y` and on the inner edge of the image
 * (40% down). Each motion has its own wrapper: the CSS pose (outer: placement
 * and the start or reduced-motion translate), the scroll x, the cursor
 * parallax and the float. GSAP never touches the outer one: it would fold the
 * CSS `translate` into its own transform and lose the vw value.
 */
function Hand({ side }: { side: "human" | "robot" }) {
  const human = side === "human";
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-(--tip-y) w-[55vw] -translate-y-[40%] md:w-[54vw]",
        human
          ? "right-1/2 -translate-x-(--hand-from) motion-reduce:-translate-x-(--hand-near)"
          : "left-1/2 translate-x-(--hand-from) motion-reduce:translate-x-(--hand-near)",
      )}
    >
      <div data-hand={side} className="will-change-transform">
        <div data-hand-parallax>
          <div className={cn("animate-float motion-reduce:animate-none", !human && "[animation-delay:-1.6s]")}>
            <Image
              src={`/about/hand-${side}.png`}
              alt=""
              width={2000}
              height={800}
              preload
              sizes="(min-width: 768px) 54vw, 55vw"
              draggable={false}
              className="h-auto w-full select-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The three copy blocks. Pinned layout (motion-safe): A bottom left, B top
 * right, C bottom right on md+; on phones they sit in the band below the
 * hands (A at its top, B at its bottom, C where A was). Reduced motion: a
 * plain stack below the scene.
 */
function HandsCopy() {
  const block = "motion-safe:absolute motion-safe:opacity-0 motion-safe:max-md:inset-x-(--gutter)";
  const belowHands = "motion-safe:max-md:top-[calc(var(--tip-y)+13svh)]";

  return (
    <div className="shell flex flex-col gap-14 py-16 md:py-24 motion-safe:pointer-events-none motion-safe:absolute motion-safe:inset-0 motion-safe:max-w-none motion-safe:p-0">
      <div
        data-hands-block="a"
        className={cn(block, belowHands, "md:max-w-[min(46vw,40rem)] motion-safe:md:bottom-(--copy-edge) motion-safe:md:left-(--gutter)")}
      >
        <MonoLabel>Who we are</MonoLabel>
        <h2 className="mt-3 text-[length:clamp(2rem,min(4.5vw,7svh),4rem)] leading-[1.04] font-semibold tracking-[-0.03em] md:mt-4">
          Built by students, for the real world
        </h2>
        <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-muted md:mt-4 md:text-base">
          We design, solder, code and fly the things we imagine.
        </p>
      </div>

      <div
        data-hands-block="b"
        className={cn(
          block,
          "md:max-w-[22rem] motion-safe:max-md:bottom-(--copy-edge) motion-safe:md:top-[calc(var(--nav-h)+var(--ann-h)+4.25rem)] motion-safe:md:right-(--gutter) motion-safe:md:text-right",
        )}
      >
        <p className="text-[length:clamp(1.35rem,2.4vw,2.25rem)] leading-[1.12] font-semibold tracking-[-0.02em]">
          <span className="md:block">Sense.</span> <span className="md:block">Understand.</span>{" "}
          <span className="md:block">Adapt.</span>
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted md:ml-auto md:max-w-[30ch]">
          Every build starts with a sensor and ends with a machine that responds.
        </p>
      </div>

      <div
        data-hands-block="c"
        className={cn(
          block,
          belowHands,
          "md:max-w-[26rem] motion-safe:md:right-(--gutter) motion-safe:md:bottom-(--copy-edge) motion-safe:md:text-right",
        )}
      >
        <MonoLabel>How we build</MonoLabel>
        <h2 className="mt-3 text-[length:clamp(1.75rem,3vw,2.75rem)] leading-[1.08] font-semibold tracking-[-0.03em] md:mt-4">
          Precision. <span className="md:block">With feeling.</span>
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted md:mt-4 md:text-base">
          Engineering discipline, with room for curiosity.
        </p>
      </div>
    </div>
  );
}

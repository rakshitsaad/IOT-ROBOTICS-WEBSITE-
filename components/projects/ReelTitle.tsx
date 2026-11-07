"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { splitTitle, titleEm } from "@/lib/projects";

/**
 * The huge vertical title over the reel (DESIGN.md §16): Sora 800, uppercase,
 * reading upwards (vertical-rl + rotate-180). When the title changes, the old
 * letters slide up out of their mask and the new ones come in from below,
 * 25ms apart (CSS keyframes letter-out / letter-in).
 *
 * The title is always two halves, so the gallery can split it: the first half
 * slides to the bottom of the screen and the rest to the top, driven by the
 * stage's `--p` (0 = whole and centred, 1 = split). Sizes come from CSS
 * variables set by the parent:
 *   --title-max     largest font size
 *   --title-fit     the whole title must fit in this length
 *   --title-top     the top half's top edge once split
 *   --title-bottom  the bottom half's bottom edge once split
 * The font size is min(--title-max, --title-fit / its length in em), using the
 * measured Sora cap widths in lib/projects.ts.
 */

const STAGGER_MS = 25;

interface Layer {
  id: number;
  title: string;
}

export function ReelTitle({
  title,
  animate,
  className,
}: {
  title: string;
  /** Animate changes (off under reduced motion and while the gallery is open). */
  animate: boolean;
  className?: string;
}) {
  const [state, setState] = useState<{ current: Layer; previous: Layer | null; animated: boolean }>({
    current: { id: 0, title },
    previous: null,
    animated: false,
  });

  // A new title: keep the old one for its exit (adjusting state while rendering, as React recommends).
  if (title !== state.current.title) {
    setState({
      current: { id: state.current.id + 1, title },
      previous: animate ? state.current : null,
      animated: animate,
    });
  }

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {state.previous && (
        <TitleLayer
          key={state.previous.id}
          title={state.previous.title}
          mode="out"
          onDone={() => setState((s) => (s.previous ? { ...s, previous: null } : s))}
        />
      )}
      <TitleLayer key={state.current.id} title={state.current.title} mode={state.animated ? "in" : "static"} />
    </div>
  );
}

function TitleLayer({ title, mode, onDone }: { title: string; mode: "in" | "out" | "static"; onDone?: () => void }) {
  const upper = title.toUpperCase();
  const [first, rest] = splitTitle(upper);
  const em = titleEm(upper);
  const vars = { "--em": em.toFixed(3) } as CSSProperties;
  // Letters are counted without spaces, in reading order (the first half first).
  const firstCount = letterCount(first);
  const total = firstCount + letterCount(rest);

  return (
    <div
      className={cn(
        "absolute inset-0 [--fs:min(var(--title-max),calc(var(--title-fit)/var(--em)))] [--len:calc(var(--fs)*var(--em))]",
        // Slightly see-through once split, behind the gallery tiles.
        "opacity-[calc(1-var(--p,0)*0.62)]",
      )}
      style={vars}
    >
      {/* The rest of the title, at the top. */}
      <Half
        text={rest}
        start={firstCount}
        total={total}
        mode={mode}
        onDone={onDone}
        className="top-[calc((1-var(--p,0))*(50%-var(--len)/2)+var(--p,0)*var(--title-top))]"
      />
      {/* The first half, at the bottom (the title reads upwards, so it starts at the bottom). */}
      <Half
        text={first}
        start={0}
        total={total}
        mode={mode}
        onDone={onDone}
        className="bottom-[calc((1-var(--p,0))*(50%-var(--len)/2)+var(--p,0)*var(--title-bottom))]"
      />
    </div>
  );
}

const letterCount = (s: string) => [...s].filter((c) => c !== " ").length;

function Half({
  text,
  start,
  total,
  mode,
  onDone,
  className,
}: {
  text: string;
  start: number;
  total: number;
  mode: "in" | "out" | "static";
  onDone?: () => void;
  className?: string;
}) {
  if (!text) return null;
  let index = start;
  return (
    <span
      className={cn(
        "absolute left-1/2 -translate-x-1/2 rotate-180 overflow-hidden whitespace-pre [padding:0_0.06em] text-(length:--fs) leading-none font-extrabold tracking-[-0.02em] text-text [writing-mode:vertical-rl]",
        className,
      )}
    >
      {[...text].map((ch, i) => {
        if (ch === " ") return " ";
        const order = index++;
        return (
          <span
            key={i}
            className={cn(
              "inline-block",
              mode === "in" && "animate-letter-in motion-reduce:animate-none",
              mode === "out" && "animate-letter-out motion-reduce:animate-none",
            )}
            style={mode === "static" ? undefined : { animationDelay: `${order * STAGGER_MS}ms` }}
            onAnimationEnd={mode === "out" && order === total - 1 ? onDone : undefined}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

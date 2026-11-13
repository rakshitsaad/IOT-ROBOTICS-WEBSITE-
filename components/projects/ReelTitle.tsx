"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { titleEm } from "@/lib/projects";

/**
 * The active project's title, set below its image (DESIGN.md §16): Archivo 700,
 * uppercase, one centred line. When the title changes, the old letters rise out
 * of their mask and the new ones come up from below, 25ms apart (CSS keyframes
 * letter-out / letter-in).
 *
 * The parent places it and sets two CSS variables:
 *   --title-max  largest font size
 *   --title-fit  the whole title must fit in this width
 * The font size is min(--title-max, --title-fit / its length in em), using the
 * measured Archivo cap widths in lib/projects.ts.
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
    <div aria-hidden="true" className={cn("pointer-events-none grid", className)}>
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
  const vars = { "--em": titleEm(upper).toFixed(3) } as CSSProperties;
  const total = [...upper].filter((c) => c !== " ").length;
  let index = 0;

  return (
    <p
      className="overflow-hidden py-[0.08em] text-center text-[length:min(var(--title-max),calc(var(--title-fit)/var(--em)))] leading-none font-display font-bold tracking-[-0.02em] whitespace-pre text-text [grid-area:1/1]"
      style={vars}
    >
      {[...upper].map((ch, i) => {
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
    </p>
  );
}

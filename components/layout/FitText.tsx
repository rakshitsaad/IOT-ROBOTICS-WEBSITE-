"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Single line of text scaled so it spans exactly the full width of its
 * container. Re-fits on resize and once web fonts have loaded.
 * `estimate` is the server-side font size (in vw) used until JS measures,
 * so there is no large jump on hydration.
 */
interface FitTextProps {
  children: ReactNode;
  className?: string;
  /** Initial font-size guess in vw before measurement. */
  estimate?: number;
}

export function FitText({ children, className, estimate = 12 }: FitTextProps) {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = box.current;
    const el = text.current;
    if (!container || !el) return;

    // Glyph advances are rounded differently at each size, so width is not
    // perfectly linear in font-size: refine over a few passes.
    const fit = () => {
      const available = container.clientWidth;
      let size = 100;
      for (let i = 0; i < 4; i++) {
        el.style.fontSize = `${size}px`;
        const width = el.getBoundingClientRect().width;
        if (!width || Math.abs(width - available) < 0.5) break;
        size = (size * available) / width;
      }
    };

    fit();
    document.fonts?.ready.then(fit).catch(() => {});
    document.fonts?.addEventListener("loadingdone", fit);
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => {
      ro.disconnect();
      document.fonts?.removeEventListener("loadingdone", fit);
    };
  }, []);

  return (
    <div ref={box} className={cn("w-full overflow-hidden", className)}>
      <span
        ref={text}
        className="inline-block whitespace-nowrap leading-[0.82]"
        style={{ fontSize: `${estimate}vw` }}
      >
        {children}
      </span>
    </div>
  );
}

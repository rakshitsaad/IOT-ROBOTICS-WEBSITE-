"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import { FINE_POINTER, useMediaQuery } from "@/hooks/use-media-query";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Custom cursor for fine pointers only (mouse/trackpad): a 6px dot plus a
 * 36px ring that lags behind it. Not rendered on touch devices.
 *
 * Opt-in states, set on any element:
 *   data-cursor="view"  → ring becomes a light pill labelled VIEW
 *   data-cursor="drag"  → ring becomes a light pill labelled DRAG
 *   data-cursor="link"  → ring grows into a soft filled circle
 *   data-cursor="none"  → custom cursor hides (native cursor stays hidden)
 *   data-cursor-label="PLAY" → overrides the pill label for view/drag
 * Links and buttons without data-cursor get the "link" state automatically.
 * Reduced motion: no lag, no morph animation.
 */

type Variant = "default" | "link" | "view" | "drag" | "hidden";

const INTERACTIVE = "a[href], button:not(:disabled), [role='button'], summary, label[for], select";
const TEXT_INPUT = "input, textarea, [contenteditable='true']";

export function Cursor() {
  const fine = useMediaQuery(FINE_POINTER);
  return fine ? <CursorInner /> : null;
}

function CursorInner() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<Variant>("default");
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const html = document.documentElement;
    const dotEl = dot.current;
    const ringEl = ring.current;
    if (!dotEl || !ringEl) return;
    html.setAttribute("data-custom-cursor", "");

    const instant = prefersReducedMotion();
    const ringDuration = instant ? 0.001 : 0.5;
    const dotDuration = instant ? 0.001 : 0.08;
    const ringX = gsap.quickTo(ringEl, "x", { duration: ringDuration, ease: "power3.out" });
    const ringY = gsap.quickTo(ringEl, "y", { duration: ringDuration, ease: "power3.out" });
    const dotX = gsap.quickTo(dotEl, "x", { duration: dotDuration, ease: "power3.out" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: dotDuration, ease: "power3.out" });

    let first = true;

    const resolve = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      if (!el) return { variant: "default" as Variant, label: "" };
      const tagged = el.closest<HTMLElement>("[data-cursor]");
      if (tagged) {
        const v = tagged.dataset.cursor;
        if (v === "view" || v === "drag") {
          return { variant: v as Variant, label: tagged.dataset.cursorLabel ?? v.toUpperCase() };
        }
        if (v === "link") return { variant: "link" as Variant, label: "" };
        if (v === "none") return { variant: "hidden" as Variant, label: "" };
      }
      if (el.closest(TEXT_INPUT)) return { variant: "hidden" as Variant, label: "" };
      if (el.closest(INTERACTIVE)) return { variant: "link" as Variant, label: "" };
      return { variant: "default" as Variant, label: "" };
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (first) {
        gsap.set([ringEl, dotEl], { x: e.clientX, y: e.clientY });
        first = false;
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
      setVisible(true);
    };

    const onOver = (e: PointerEvent) => {
      const next = resolve(e.target);
      setVariant(next.variant);
      setLabel(next.label);
    };

    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", onLeave);

    return () => {
      html.removeAttribute("data-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onLeave);
      gsap.killTweensOf([dotEl, ringEl]);
    };
  }, [reduced]);

  const isPill = variant === "view" || variant === "drag";
  const pillWidth = Math.max(68, Math.round(label.length * 8.4 + 36));
  const size =
    variant === "link"
      ? { width: 56, height: 56 }
      : isPill
        ? { width: pillWidth, height: 36 }
        : { width: 36, height: 36 };
  const hidden = !visible || variant === "hidden";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      {/* Ring */}
      <div ref={ring} className="absolute left-0 top-0">
        <div
          className={cn(
            "flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-pill border",
            "transition-[width,height,background-color,border-color,opacity,scale] duration-[450ms] ease-power3",
            variant === "default" && "border-text/45 bg-transparent",
            variant === "link" && "border-transparent bg-text/12 backdrop-blur-[2px]",
            isPill && "border-transparent bg-text",
            hidden ? "opacity-0" : "opacity-100",
            pressed ? "scale-90" : "scale-100",
          )}
          style={size}
        >
          <span
            className={cn(
              "mono-label whitespace-nowrap text-bg transition-opacity duration-300",
              isPill ? "opacity-100 delay-100" : "opacity-0",
            )}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Dot */}
      <div ref={dot} className="absolute left-0 top-0">
        <div
          className={cn(
            "size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text transition-[opacity,scale] duration-300 ease-power3",
            hidden || isPill ? "scale-0 opacity-0" : "scale-100 opacity-100",
          )}
        />
      </div>
    </div>
  );
}

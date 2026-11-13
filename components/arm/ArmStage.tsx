"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CanvasBoundary, hasWebGL } from "@/components/robot/BotStage";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { useUIStore } from "@/lib/store";
import type { ArmQuality } from "./arm-model";

const ArmCanvas = dynamic(() => import("./ArmCanvas"), { ssr: false, loading: () => null });

/**
 * The /about industrial arm's layer (DESIGN.md §22): fixed, full screen, behind the page's content (z-index −10, above
 * the html background) and never taking pointer events, so every link and button stays clickable. Mount ONE per page.
 *
 * Layers, back to front: the page background; a faint pool of maroon light where the arm stands; the arm's canvas;
 * the page content. The canvas mounts in idle time after the page has painted, then fades in while the arm unfolds.
 *
 * Quality: "low" (no shadows, dpr ≤ 1.25) on touch screens, below 768px and with deviceMemory ≤ 4. No arm without
 * WebGL. Reduced motion: one still pose, rendered once. It stops rendering while the tab is hidden or the menu is open.
 * QA: ?arm=high, ?arm=low, ?arm=off, ?arm=debug (window.__arm).
 */
export function ArmStage() {
  const support = useArmSupport();
  const reduced = useReducedMotion();
  const menuOpen = useUIStore((s) => s.menuOpen);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (support === "pending" || support === "none") return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setMounted(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(id);
  }, [support]);

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const quality: ArmQuality = support === "low" ? "low" : "high";
  const frameloop = !visible || menuOpen ? "never" : reduced ? "demand" : "always";

  return (
    <div aria-hidden data-arm-stage={support} className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(42%_52%_at_76%_74%,color-mix(in_oklab,var(--maroon)_24%,transparent),transparent_75%)] max-md:bg-[radial-gradient(70%_40%_at_72%_88%,color-mix(in_oklab,var(--maroon)_20%,transparent),transparent_75%)]" />
      {mounted && !failed && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1200ms] ease-power3",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <CanvasBoundary onError={() => setFailed(true)}>
            <ArmCanvas
              key={quality}
              quality={quality}
              still={reduced}
              frameloop={frameloop}
              onReady={() => setReady(true)}
              onFail={() => setFailed(true)}
            />
          </CanvasBoundary>
        </div>
      )}
    </div>
  );
}

type ArmSupport = "pending" | "none" | ArmQuality;

function detectSupport(): ArmSupport {
  const q = new URLSearchParams(window.location.search).get("arm");
  if (q === "off" || !hasWebGL()) return "none";
  if (q === "high" || q === "low") return q;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const low =
    window.matchMedia("(pointer: coarse)").matches ||
    window.innerWidth < 768 ||
    (typeof memory === "number" && memory <= 4);
  return low ? "low" : "high";
}

const noop = () => () => {};
/** "pending" on the server and the first hydration render, then this device's mode. */
function useArmSupport(): ArmSupport {
  return useSyncExternalStore(noop, detectSupport, () => "pending");
}

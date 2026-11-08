"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Subtle scroll reveals for the whole site (DESIGN.md §7): any element with `data-reveal` fades up 16px once, as it
 * enters the viewport. One IntersectionObserver, no animation library, no scroll-jacking.
 *
 * Content is visible in the server HTML. When this runs, elements already on screen are marked shown before
 * `html[data-reveals]` switches the hiding on, so nothing above the fold flickers. Siblings can stagger with an inline
 * `--reveal-delay`. Off under reduced motion. Re-scans after every navigation (and when new content streams in).
 */
export function Reveals() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const html = document.documentElement;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const scan = () => {
      const fold = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown]):not([data-observed])").forEach((el) => {
        el.dataset.observed = "";
        if (el.getBoundingClientRect().top < fold) el.dataset.shown = "";
        else io.observe(el);
      });
    };

    scan();
    html.dataset.reveals = "";
    const main = document.getElementById("main");
    const mo = new MutationObserver(scan);
    if (main) mo.observe(main, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      // Anything still waiting is picked up again by the next scan.
      document.querySelectorAll<HTMLElement>("[data-observed]:not([data-shown])").forEach((el) => delete el.dataset.observed);
    };
  }, [pathname]);

  return null;
}

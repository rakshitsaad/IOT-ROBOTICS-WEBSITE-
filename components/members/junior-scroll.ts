import type Lenis from "lenis";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Scroll helpers shared by Junior Core's team nav and accordions (client only).
 */

/** Space at the top of the viewport covered by the fixed header and the sticky team bar, in px. */
export function stickyOffset(): number {
  const bar = document.querySelector<HTMLElement>("[data-jc-bar]");
  if (!bar) return 0;
  // The bar sticks at `top: var(--nav-h)`, right under the header, so its stuck bottom edge is
  // its resolved `top` plus its height (the announcement bar has collapsed by the time this
  // section is on screen: it folds away after 40px of scroll).
  return (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight;
}

/**
 * Scrolls the page to `y`: through Lenis when it runs, else natively (smooth, or instant
 * under reduced motion). `done` runs once the scroll has settled, or after a timeout if
 * the visitor takes over the scroll first.
 */
export function scrollPageTo(y: number, lenis: Lenis | null, { duration = 1.2, done }: { duration?: number; done?: () => void } = {}) {
  const top = Math.max(0, Math.round(y));
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallback);
    window.removeEventListener("scrollend", finish);
    done?.();
  };
  const fallback = window.setTimeout(finish, duration * 1000 + 400);

  if (prefersReducedMotion()) {
    window.scrollTo({ top, behavior: "instant" });
    finish();
  } else if (lenis) {
    lenis.scrollTo(top, { duration, onComplete: finish });
  } else {
    window.addEventListener("scrollend", finish);
    window.scrollTo({ top, behavior: "smooth" });
  }
}

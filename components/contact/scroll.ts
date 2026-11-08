import type Lenis from "lenis";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";

/** The navbar's height. (The announcement bar has collapsed by the time the page is scrolled this far.) */
function navHeight(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0;
}

/** An element's top in the document, ignoring transforms (the panel is still tilted and lowered while it scrolls in). */
function layoutTop(el: HTMLElement): number {
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
}

/**
 * "Send a message": scroll to the form (Lenis, 1.2s; instant under reduced motion), 24px below the header, then put
 * the cursor in the first field.
 */
export function scrollToMessage(lenis: Lenis | null) {
  const target = document.getElementById("message");
  if (!target) return;
  const focus = () => document.querySelector<HTMLInputElement>("#contact-name")?.focus({ preventScroll: true });
  const top = layoutTop(target) - navHeight() - 24;
  if (lenis && !prefersReducedMotion()) {
    lenis.scrollTo(Math.max(0, top), { duration: 1.2, onComplete: focus });
  } else {
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    focus();
  }
}

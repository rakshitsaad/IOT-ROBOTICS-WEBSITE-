import type Lenis from "lenis";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";

/** "Explore teams": scroll to the teams section (Lenis, 1.2s; instant under reduced motion), under the navbar. */
export function scrollToTeams(lenis: Lenis | null) {
  const target = document.getElementById("teams");
  if (!target) return;
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - nav - 16;
  if (lenis && !prefersReducedMotion()) lenis.scrollTo(Math.max(0, top), { duration: 1.2 });
  else window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
}

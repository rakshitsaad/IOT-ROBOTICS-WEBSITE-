"use client";

import { useSyncExternalStore } from "react";

/**
 * Reduced-motion rule (DESIGN.md → Motion → Reduced motion):
 * when the user prefers reduced motion there is no Lenis, no pinning, no
 * scrubbed animation, and every animated element shows its final state.
 *
 * Every animated component must check this.
 *
 * - In render logic:      const reduced = useReducedMotion();
 * - Inside GSAP/effects:  if (prefersReducedMotion()) return;
 *   (read synchronously, because on the very first client render the hook
 *   still returns the server value `false`). Pass `reduced` as a dependency
 *   so the effect re-runs if the OS setting changes.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Synchronous check for use inside effects, GSAP callbacks and handlers. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

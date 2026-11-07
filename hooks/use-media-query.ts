"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Subscribes to a CSS media query. Returns `false` during SSR/hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Mouse/trackpad users: the only devices that get the custom cursor. */
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

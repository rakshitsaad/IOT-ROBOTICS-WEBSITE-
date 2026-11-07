"use client";

import { create } from "zustand";

/**
 * The active "Inside the lab" station (0-based). Written by HomeScroll from
 * the scroll timeline when the station changes (not per frame); read by the
 * lab counter and card.
 */
export const useLabStore = create<{ station: number }>(() => ({ station: 0 }));

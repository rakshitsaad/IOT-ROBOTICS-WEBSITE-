"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { COLORS } from "@/lib/tokens";
import type { ClubEvent } from "@/lib/types";
import { EVENTS_MOTION } from "@/lib/events";

/**
 * The /events page tint (DESIGN.md §17): the near-black page blended with the active event's colour, a radial
 * gradient at 18% centred behind the card. `--tint` is a registered colour (globals.css), so a new event's colour
 * crossfades over 900ms. Fixed behind everything (below the grid).
 */
export function EventTint({ color }: { color: string | null }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 transition-[--tint] ease-linear"
      style={
        {
          "--tint": color ?? COLORS.bg,
          transitionDuration: `${EVENTS_MOTION.tint}ms`,
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, color-mix(in oklab, var(--tint) 18%, var(--bg)) 0%, color-mix(in oklab, var(--tint) 7%, var(--bg)) 55%, var(--bg) 100%)",
        } as CSSProperties
      }
    />
  );
}

/* ------------------------------------------------------- the event colour */

const sampled = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

/** The event's tint: its `accent_color`, else the dominant colour sampled from its banner (null until known). */
export function useEventColor(event: Pick<ClubEvent, "accent_color" | "banner_url">): string | null {
  const src = event.accent_color ? null : event.banner_url;
  const [found, setFound] = useState<{ src: string; color: string | null } | null>(null);

  useEffect(() => {
    if (!src || sampled.has(src)) return;
    let live = true;
    sampleBanner(src).then((color) => live && setFound({ src, color }));
    return () => {
      live = false;
    };
  }, [src]);

  if (event.accent_color) return event.accent_color;
  if (!src) return null;
  if (sampled.has(src)) return sampled.get(src) ?? null;
  return found?.src === src ? found.color : null;
}

/** Samples a 64px copy (same-origin through the image optimizer, so the canvas isn't tainted). */
function sampleBanner(src: string): Promise<string | null> {
  const known = pending.get(src);
  if (known) return known;
  const job = new Promise<string | null>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        resolve(dominant(img));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`;
  }).then((color) => {
    sampled.set(src, color);
    return color;
  });
  pending.set(src, job);
  return job;
}

/**
 * The most prominent hue: pixels are binned by hue (24 bins), weighted by saturation and brightness so dark and
 * grey areas count little; the winning bin's average colour is then lifted to a vivid, mid-light tone so an 18%
 * tint still reads.
 */
function dominant(img: HTMLImageElement): string | null {
  const w = 48;
  const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const BINS = 24;
  const weight = new Float64Array(BINS);
  const sum = Array.from({ length: BINS }, () => [0, 0, 0]);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const s = max === 0 ? 0 : (max - min) / max;
    if (max < 0.1 || s < 0.18) continue;
    let hue = 0;
    if (max === r) hue = ((g - b) / (max - min)) % 6;
    else if (max === g) hue = (b - r) / (max - min) + 2;
    else hue = (r - g) / (max - min) + 4;
    const bin = Math.floor((((hue * 60 + 360) % 360) / 360) * BINS) % BINS;
    const wgt = s * s * max;
    weight[bin] += wgt;
    sum[bin][0] += r * wgt;
    sum[bin][1] += g * wgt;
    sum[bin][2] += b * wgt;
  }
  // Smooth neighbouring bins so a hue split across a bin edge still wins.
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < BINS; i++) {
    const score = weight[i] + 0.5 * (weight[(i + 1) % BINS] + weight[(i + BINS - 1) % BINS]);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best < 0 || weight[best] === 0) return null;
  const [r, g, b] = sum[best].map((v) => v / weight[best]);
  return vivid(r, g, b);
}

function vivid(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + 360) % 360;
  return `hsl(${h.toFixed(0)} ${Math.max(s * 100, 70).toFixed(0)}% ${Math.min(Math.max(l * 100, 55), 65).toFixed(0)}%)`;
}

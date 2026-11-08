"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/**
 * Live countdown to `to` in days / hours / minutes. The clock only runs in the browser (the server renders dashes), so
 * the prerendered page never bakes in a time. Updates every few seconds; the value changes once a minute.
 */

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 5_000);
  return () => window.clearInterval(id);
}
const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

export function Countdown({ to, className }: { to: string; className?: string }) {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  const left = minute == null ? null : Math.max(0, Date.parse(to) - minute * MINUTE);
  const parts =
    left == null
      ? null
      : {
          days: Math.floor(left / 86_400_000),
          hours: Math.floor(left / 3_600_000) % 24,
          minutes: Math.floor(left / MINUTE) % 60,
        };
  const units = [
    ["days", "Days"],
    ["hours", "Hours"],
    ["minutes", "Minutes"],
  ] as const;

  return (
    <div role="timer" aria-live="off" className={cn("flex items-start gap-8", className)}>
      {parts && (
        <span className="sr-only">
          {left === 0 ? "Happening now." : `Starts in ${parts.days} days, ${parts.hours} hours and ${parts.minutes} minutes.`}
        </span>
      )}
      {units.map(([key, label]) => (
        <div key={key} aria-hidden="true" className="flex flex-col">
          <span className="font-mono text-[28px] leading-none font-medium tracking-[-0.04em] tabular-nums">
            {parts ? String(parts[key]).padStart(2, "0") : "--"}
          </span>
          <span className="mono-label mt-2 text-faint">{label}</span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/**
 * Live countdown to `to` in days / hours / minutes, large mono digits.
 * The clock only runs in the browser (the server renders dashes), so the
 * prerendered page never bakes in a time. Updates every few seconds; the
 * value only changes once a minute.
 *
 * `size="sm"`: the /events feature card's compact version (smaller digits, "Days / Hrs / Min").
 */

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 5_000);
  return () => window.clearInterval(id);
}
const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

export function Countdown({ to, size = "lg", className }: { to: string; size?: "lg" | "sm"; className?: string }) {
  const sm = size === "sm";
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
    ["hours", sm ? "Hrs" : "Hours"],
    ["minutes", sm ? "Min" : "Minutes"],
  ] as const;

  return (
    <div role="timer" aria-live="off" className={cn("flex items-start", sm ? "gap-4" : "gap-5 md:gap-8", className)}>
      {parts && (
        <span className="sr-only">
          {left === 0
            ? "Happening now."
            : `Starts in ${parts.days} days, ${parts.hours} hours and ${parts.minutes} minutes.`}
        </span>
      )}
      {units.map(([key, label]) => (
        <div key={key} aria-hidden="true" className="flex flex-col">
          <span
            className={cn(
              "font-mono leading-none font-normal tracking-[-0.04em] tabular-nums",
              sm ? "text-[length:clamp(1.4rem,2.2vw,1.9rem)]" : "text-[length:clamp(2.6rem,5.2vw,5rem)]",
            )}
          >
            {parts ? String(parts[key]).padStart(2, "0") : "--"}
          </span>
          <span className={cn("mono-label text-muted", sm ? "mt-1.5" : "mt-3")}>{label}</span>
        </div>
      ))}
    </div>
  );
}

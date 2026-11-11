"use client";

import { useEffect, useRef, useState } from "react";
import { MonoLabel, PillButton } from "@/components/ui";
import { RobotHand, type RobotHandHandle } from "@/components/about/RobotHand";

/**
 * /lab bench for the /about robot hand (DESIGN.md §15): a slider drives `setPose(progress)` directly, so every pose and
 * the in-between bends can be checked without scrolling the pin. Stop on a pose and the idle servo jitter shows.
 */
const STOPS: { label: string; at: number }[] = [
  { label: "Enter", at: 0.08 },
  { label: "Entered", at: 0.15 },
  { label: "Open", at: 0.4 },
  { label: "Point", at: 0.52 },
  { label: "Grip", at: 0.85 },
  { label: "Exit", at: 0.93 },
];

function phaseName(p: number) {
  if (p < 0.15) return "entering";
  if (p < 0.4) return "spreading";
  if (p < 0.6) return "pointing";
  if (p < 0.85) return "gripping";
  return "leaving";
}

export function RobotHandLab() {
  const hand = useRef<RobotHandHandle>(null);
  const [progress, setProgress] = useState(0.4);

  useEffect(() => {
    hand.current?.setPose(progress);
  }, [progress]);

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
      <div className="relative h-80 overflow-hidden rounded-card border border-line bg-bg-2 md:h-[28rem]">
        <RobotHand ref={hand} className="absolute inset-0" />
      </div>
      <div className="space-y-5">
        <label className="block">
          <span className="flex items-baseline justify-between gap-4">
            <MonoLabel tone="text">setPose</MonoLabel>
            <MonoLabel>
              {progress.toFixed(2)} · {phaseName(progress)}
            </MonoLabel>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="mt-3 w-full accent-red"
            aria-label="Hand progress"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {STOPS.map((s) => (
            <PillButton key={s.label} variant="ghost" size="sm" onClick={() => setProgress(s.at)}>
              {s.label}
            </PillButton>
          ))}
        </div>
        <p className="max-w-[44ch] text-sm text-muted">
          The pin on /about scrubs this from 0 to 1 over 2.5 screens. Every segment turns around its own joint; stop on a
          pose to see the fingertips&apos; idle servo jitter.
        </p>
      </div>
    </div>
  );
}

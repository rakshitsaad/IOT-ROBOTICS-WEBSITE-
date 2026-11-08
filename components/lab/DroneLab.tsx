"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MonoLabel } from "@/components/ui";
import { DroneStage, droneActions, droneState, useDroneStore } from "@/components/drone";
import { MissionDashboard } from "./MissionDashboard";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";
import type { MissionCardId, MissionStats } from "@/lib/mission";

/**
 * /lab/drone: a dashboard of club stats and the drone on a test bench, with a button for each effect so they can be
 * checked in isolation. (On the home page the drone is the robot's sidekick instead, §12: a separate component.)
 */

const CARDS: { id: MissionCardId; label: string }[] = [
  { id: "members", label: "Members" },
  { id: "projects", label: "Projects" },
  { id: "events", label: "Events" },
  { id: "next", label: "Next event" },
  { id: "workshops", label: "Workshops" },
  { id: "competitions", label: "Competitions" },
];

export function DroneLab({ stats }: { stats: MissionStats }) {
  const bench = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<MissionCardId>("members");
  const [globe, setGlobe] = useState(false);
  const scanning = useDroneStore((s) => s.scanning);
  const stats$ = useLiveStats();

  // QA hook for scripted checks of this test page only: window.__drone.state / .actions.
  useEffect(() => {
    const w = window as unknown as { __drone?: unknown };
    w.__drone = { state: droneState, actions: droneActions, store: useDroneStore };
    return () => {
      delete w.__drone;
    };
  }, []);

  const dissolveTo = (to: number) => {
    gsap.killTweensOf(droneState, "dissolve");
    gsap.to(droneState, { dissolve: to, duration: to ? 2.4 : 1.6, ease: to ? "power2.in" : "power3.out" });
  };

  return (
    <div className="shell space-y-5 pb-24">
      <div className="flex flex-col gap-4 rounded-card border border-line bg-bg-2 p-5 md:p-6">
        <Row label="Card">
          {CARDS.map((c) => (
            <Btn key={c.id} on={card === c.id} onClick={() => setCard(c.id)}>
              {c.label}
            </Btn>
          ))}
        </Row>
        <Row label="Actions">
          <Btn onClick={() => droneActions.flyTo(card)}>Fly to card</Btn>
          <Btn onClick={() => droneActions.scan(card)}>Scan card</Btn>
          <Btn
            on={globe}
            onClick={() => {
              droneActions.globe(!globe);
              setGlobe(!globe);
            }}
          >
            Globe {globe ? "off" : "on"}
          </Btn>
          <Btn onClick={() => droneActions.flip()}>Flip</Btn>
          <Btn onClick={() => dissolveTo(1)}>Dissolve</Btn>
          <Btn onClick={() => dissolveTo(0)}>Reassemble</Btn>
        </Row>
        <Row label="Flight">
          <Btn onClick={() => droneActions.follow()}>Follow cursor</Btn>
          <Btn onClick={() => droneActions.patrol()}>Patrol</Btn>
          <Btn
            onClick={() => {
              droneActions.home();
              setGlobe(false);
            }}
          >
            Home
          </Btn>
        </Row>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px] text-muted">
          <span>speed {stats$.speed.toFixed(2)} u/s</span>
          <span>tilt {stats$.tilt.toFixed(1)}°</span>
          <span>particles {stats$.particles}</span>
          <span>scanning {scanning ?? "–"}</span>
          <span>fps {stats$.fps}</span>
        </div>
        <p className="text-[13px] text-muted">
          Follow cursor scans a card you hover (mouse) or tap (touch), and patrols after 4s without movement. Click the
          drone to flip it. <code className="font-mono text-text">?drone=nobloom</code> /{" "}
          <code className="font-mono text-text">?drone=bloom</code> force bloom off / on.
        </p>
      </div>

      <div ref={bench} className="relative isolate h-svh overflow-clip rounded-card border border-line bg-bg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,color-mix(in_oklab,var(--maroon)_42%,transparent),transparent_72%)]"
        />
        <div className="flex h-full flex-col p-[clamp(0.75rem,3svh,2rem)] pt-[clamp(4rem,14svh,8rem)]">
          <MissionDashboard stats={stats} className="flex-1 grid-rows-3 md:grid-rows-2" />
        </div>
        <DroneStage root={bench} posterClassName="top-4 right-4 h-32 w-48" />
      </div>
    </div>
  );
}

function useLiveStats() {
  const [s, set] = useState({ speed: 0, particles: 0, fps: 0, tilt: 0 });
  useEffect(() => {
    let frames = 0;
    const count = () => {
      frames++;
    };
    gsap.ticker.add(count);
    const id = window.setInterval(() => {
      set({ speed: droneState.speed, particles: droneState.particles, fps: frames * 2, tilt: droneState.tilt });
      frames = 0;
    }, 500);
    return () => {
      gsap.ticker.remove(count);
      window.clearInterval(id);
    };
  }, []);
  return s;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
      <MonoLabel className="w-20 shrink-0">{label}</MonoLabel>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Btn({ on, onClick, children }: { on?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      data-cursor="link"
      onClick={onClick}
      className={cn(
        "rounded-pill border px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-[350ms]",
        on ? "border-red bg-red text-text" : "border-line text-text hover:border-text/40 hover:bg-text/5",
      )}
    >
      {children}
    </button>
  );
}

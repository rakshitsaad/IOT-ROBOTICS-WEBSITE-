"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { shareLink } from "./download";

/** Shares the current page with the system share sheet where there is one, else copies its link and says so. */
export function ShareButton({ title }: { title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const share = async () => {
    const result = await shareLink(title, window.location.href);
    if (result === "shared") return;
    setState(result);
    window.setTimeout(() => setState("idle"), 1800);
  };
  return (
    <Button variant="secondary" size="sm" onClick={share}>
      <span aria-live="polite">{state === "copied" ? "Link copied" : state === "failed" ? "Couldn't copy" : "Share"}</span>
    </Button>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { notifyWhenRecruiting, type NotifyState } from "@/lib/actions";
import { cn } from "@/lib/cn";

/** "Get notified" email form shown on the join card while recruitment is closed. */
export function NotifyForm({ className }: { className?: string }) {
  const [state, action, pending] = useActionState<NotifyState, FormData>(notifyWhenRecruiting, {
    status: "idle",
    message: "",
  });

  if (state.status === "ok") {
    return (
      <p role="status" className={cn("text-[16px] text-text", className)}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className={cn("flex flex-col gap-3 sm:flex-row", className)} noValidate>
      <label htmlFor="notify-email" className="sr-only">
        Email address
      </label>
      <input
        id="notify-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@bennett.edu.in"
        aria-invalid={state.status === "error" || undefined}
        aria-describedby={state.status === "error" ? "notify-error" : undefined}
        className="h-12 min-w-0 flex-1 rounded-control border border-line bg-bg-2 px-4 text-[15px] text-text placeholder:text-faint focus-visible:border-text/50 focus-visible:outline-none"
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Get notified"}
      </Button>
      {state.status === "error" && (
        <p id="notify-error" role="alert" className="flex items-center gap-2 text-[14px] text-text sm:basis-full">
          <span aria-hidden="true" className="size-1.5 rounded-pill bg-red" />
          {state.message}
        </p>
      )}
    </form>
  );
}

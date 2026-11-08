import { cn } from "@/lib/cn";

/**
 * /contact line icons (DESIGN.md §20): 24px grid, 1.6px stroke in currentColor, decorative (the control around them
 * carries the name). Social networks reuse the members' SocialIcon.
 */
export type ContactIconName = "mail" | "phone" | "pin" | "copy" | "check" | "arrow" | "chevron" | "plus" | "send";

export function ContactIcon({ name, className }: { name: ContactIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0", className)}
    >
      {name === "mail" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M4 7.5l8 5.5 8-5.5" />
        </>
      )}
      {name === "phone" && (
        <path d="M6.6 3.8l2.3-.4 1.6 4-1.9 1.4a11 11 0 005.6 5.6l1.4-1.9 4 1.6-.4 2.3a2 2 0 01-2.1 1.7C10.4 17.6 6.4 13.6 5 7.9a2 2 0 011.6-4.1z" />
      )}
      {name === "pin" && (
        <>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.3" />
        </>
      )}
      {name === "copy" && (
        <>
          <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
          <path d="M15.5 8.5V6.5a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2h2" />
        </>
      )}
      {name === "check" && <path d="M5 12.5l4.2 4.2L19 7" />}
      {name === "arrow" && <path d="M7 17L17 7M9 7h8v8" />}
      {name === "chevron" && <path d="M6 9l6 6 6-6" />}
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
      {name === "send" && <path d="M4 12l16-8-6 16-2.6-6.4L4 12z" />}
    </svg>
  );
}

import { cn } from "@/lib/cn";

/**
 * Small line icons for a member's profile links (Junior Core cards). Drawn on
 * a 24px grid with a 1.6px stroke in currentColor, like the rest of the site's
 * line marks. Decorative: the link around it carries the name.
 */
export type SocialNetwork = "linkedin" | "github" | "instagram";

export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
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
      {network === "linkedin" && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 11v5.5M12 16.5V11M12 13.6c0-1.6 1.1-2.7 2.5-2.7s2.5 1.1 2.5 2.7v2.9" />
          <circle cx="8" cy="7.9" r="0.4" fill="currentColor" />
        </>
      )}
      {network === "github" && (
        // A branch: the shape of a pull request, for the profile where the code lives.
        <>
          <circle cx="6.5" cy="5.5" r="2" />
          <circle cx="6.5" cy="18.5" r="2" />
          <circle cx="17.5" cy="8" r="2" />
          <path d="M6.5 7.5v9M17.5 10c0 4-4.5 3.5-9.6 7.1" />
        </>
      )}
      {network === "instagram" && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.4" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

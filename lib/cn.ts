import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge taught about our theme, so a className passed to a
 * primitive overrides its defaults (e.g. <Capsule className="h-36 w-10" />
 * replaces the default h-56 w-20 instead of fighting it).
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ["bg", "bg-2", "line", "text", "muted", "red", "red-deep", "maroon", "white", "black"],
      radius: ["pill", "card", "image"],
      font: ["sans", "display", "mono", "serif"],
      ease: ["power3", "expo"],
    },
    classGroups: {
      // bg-iris is a background-image, so it must not cancel bg-<color>.
      "bg-image": ["bg-iris"],
    },
  },
});

/** Joins class names (skipping falsy values) and resolves Tailwind conflicts. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

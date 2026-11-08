import { cn } from "@/lib/cn";
import { Action, type ActionProps } from "./Action";

/**
 * The one button family (DESIGN.md §5).
 * - primary: the deep red fill. One per view: the main action (Join, Apply, Register, Send).
 * - secondary: warm white hairline on dark, for the second action beside a primary.
 * - ghost: text with an underline-free hover tint, for tertiary actions in toolbars and cards.
 * Renders a Next <Link> for internal hrefs, an <a> for external ones, else a <button>.
 */
type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-red text-text hover:bg-red-deep",
  secondary: "border border-text/25 text-text hover:border-text/60 hover:bg-text/[0.04]",
  ghost: "text-muted hover:bg-text/[0.06] hover:text-text",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export type ButtonProps = ActionProps & {
  variant?: Variant;
  size?: Size;
  /** An arrow after the label: "→" for internal links, "↗" for external ones. */
  arrow?: boolean;
};

export function Button({ variant = "primary", size = "md", arrow = false, className, children, ...props }: ButtonProps) {
  const external = typeof props.href === "string" && /^https?:/.test(props.href);
  return (
    <Action
      {...(props as ActionProps)}
      className={cn(
        "group/btn inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold leading-none tracking-[-0.005em]",
        "transition-[background-color,border-color,color] duration-300 ease-power3",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {children}
      {arrow && (
        <span
          aria-hidden="true"
          className={cn(
            "transition-transform duration-300 ease-power3",
            external ? "group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" : "group-hover/btn:translate-x-0.5",
          )}
        >
          {external ? "↗" : "→"}
        </span>
      )}
    </Action>
  );
}

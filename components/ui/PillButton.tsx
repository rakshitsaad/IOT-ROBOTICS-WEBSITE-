import { cn } from "@/lib/cn";
import { Action, type ActionProps } from "./Action";

/**
 * Secondary pill button.
 * - light: light fill, dark text (navbar "Contact").
 * - ghost: transparent with a --line border.
 * Use IrisButton for the single primary action in a view.
 */
type Variant = "light" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  light: "bg-text text-bg hover:bg-white",
  ghost: "border border-line bg-transparent text-text hover:border-text/40 hover:bg-text/5",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-10 px-5 text-[13px] md:h-11 md:text-sm",
  lg: "h-12 px-7 text-[15px] md:h-14 md:px-8 md:text-base",
};

export type PillButtonProps = ActionProps & {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
};

export function PillButton({
  variant = "light",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: PillButtonProps) {
  return (
    <Action
      data-cursor="link"
      {...(props as ActionProps)}
      className={cn(
        "group/pill inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium leading-none",
        "transition-[background-color,border-color,transform] duration-[350ms] ease-power3 active:scale-[0.97]",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {children}
      {arrow && (
        <span
          aria-hidden="true"
          className="transition-transform duration-[350ms] ease-power3 group-hover/pill:translate-x-0.5 group-hover/pill:-translate-y-0.5"
        >
          ↗
        </span>
      )}
    </Action>
  );
}

import { cn } from "@/lib/cn";
import { Action, type ActionProps } from "./Action";

/**
 * Primary call to action. Deep red pill with warm white text; on hover/focus
 * the fill darkens to --red-deep and a faint lighter-red rim shows (the 1px
 * outer layer), a restrained "lit edge" instead of a glow.
 * Renders a Link / <a> with `href`, otherwise a <button>.
 *
 *   <IrisButton href="/join">Join us</IrisButton>
 */
type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-10 px-5 text-[13px] md:h-11 md:text-sm",
  lg: "h-12 px-7 text-[15px] md:h-14 md:px-8 md:text-base",
};

export type IrisButtonProps = ActionProps & { size?: Size; arrow?: boolean };

export function IrisButton({
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: IrisButtonProps) {
  return (
    <Action
      data-cursor="link"
      {...(props as ActionProps)}
      className={cn(
        "group/iris relative inline-flex shrink-0 rounded-pill bg-red p-px font-medium",
        "transition-transform duration-[350ms] ease-power3 active:scale-[0.97]",
        "focus-visible:outline-offset-4",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-red leading-none text-text",
          "transition-[background-color,color] duration-[350ms] ease-power3",
          "group-hover/iris:bg-red-deep group-focus-visible/iris:bg-red-deep",
          SIZE[size],
        )}
      >
        {children}
        {arrow && (
          <span
            aria-hidden="true"
            className="transition-transform duration-[350ms] ease-power3 group-hover/iris:translate-x-0.5 group-hover/iris:-translate-y-0.5"
          >
            ↗
          </span>
        )}
      </span>
    </Action>
  );
}

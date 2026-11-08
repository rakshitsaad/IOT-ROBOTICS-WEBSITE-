import { cn } from "@/lib/cn";
import { Action, type ActionLinkProps } from "./Action";

/**
 * A quiet text link with an arrow that nudges on hover: "All projects →", "Source code ↗".
 * Use it for navigation inside content, where a button would be too loud.
 */
export function ArrowLink({ className, children, ...props }: ActionLinkProps) {
  const external = /^https?:/.test(props.href);
  return (
    <Action
      {...props}
      className={cn(
        "group/arrow inline-flex items-center gap-1.5 text-[14px] font-semibold text-text",
        "decoration-text/30 underline-offset-[5px] transition-colors duration-300 hover:text-text hover:underline",
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "text-faint transition-[transform,color] duration-300 ease-power3 group-hover/arrow:text-red",
          external ? "group-hover/arrow:-translate-y-0.5 group-hover/arrow:translate-x-0.5" : "group-hover/arrow:translate-x-0.5",
        )}
      >
        {external ? "↗" : "→"}
      </span>
    </Action>
  );
}

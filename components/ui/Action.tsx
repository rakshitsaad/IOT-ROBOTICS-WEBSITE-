import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Internal helper used by the button primitives: renders a Next <Link> for
 * internal hrefs, an <a> for external ones (http, mailto, tel) and a <button>
 * when there is no href.
 */
interface Common {
  children: ReactNode;
  className?: string;
}

export type ActionLinkProps = Common & { href: string } & Omit<
    ComponentPropsWithoutRef<"a">,
    keyof Common | "href"
  >;
export type ActionButtonProps = Common & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<"button">,
    keyof Common
  >;
export type ActionProps = ActionLinkProps | ActionButtonProps;

export function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

export function Action(props: ActionProps) {
  if (props.href !== undefined) {
    const { href, children, className, ...rest } = props;
    if (isExternal(href)) {
      const newTab = href.startsWith("http");
      return (
        <a
          href={href}
          className={className}
          {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  const { children, className, type = "button", ...rest } = props;
  return (
    <button type={type} className={className} {...rest}>
      {children}
    </button>
  );
}

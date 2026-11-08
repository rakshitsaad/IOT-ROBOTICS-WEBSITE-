import Link from "next/link";
import type { Settings } from "@/lib/types";
import { NAV_ITEMS } from "@/lib/nav";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { FitText } from "./FitText";

/**
 * Site footer: quick links, socials and a full-width club wordmark (no copyright line).
 */
export function socialLinks(settings: Settings) {
  return [
    settings.instagram_url && { label: "Instagram", href: settings.instagram_url },
    settings.linkedin_url && { label: "LinkedIn", href: settings.linkedin_url },
    settings.github_url && { label: "GitHub", href: settings.github_url },
  ].filter((s): s is { label: string; href: string } => Boolean(s));
}

export function Footer({ settings }: { settings: Settings }) {
  const explore = NAV_ITEMS.slice(0, 5);
  const club = NAV_ITEMS.slice(5);
  const socials = [
    ...socialLinks(settings),
    { label: "Email", href: `mailto:${settings.contact_email}` },
  ];

  return (
    <footer id="site-footer" className="relative mt-24 overflow-hidden border-t border-line md:mt-32">
      <div className="shell grid gap-12 pb-12 pt-14 md:grid-cols-12 md:gap-8 md:pb-16 md:pt-20">
        <div className="md:col-span-5">
          <MonoLabel>{settings.college_name}</MonoLabel>
          <p className="mt-5 max-w-sm text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-3xl">
            {settings.tagline}
          </p>
          <a
            href={`mailto:${settings.contact_email}`}
            data-cursor="link"
            className="mt-6 inline-block break-all text-sm text-muted underline decoration-line underline-offset-4 transition-colors duration-[350ms] hover:text-text hover:decoration-text/40"
          >
            {settings.contact_email}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          <FooterColumn title="Explore" items={explore} />
          <FooterColumn title="Club" items={club} />
          <div className="col-span-2 sm:col-span-1">
            <MonoLabel as="h2">Follow</MonoLabel>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3 sm:flex-col">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    data-cursor="link"
                    {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group/social inline-flex items-center gap-1.5 text-[15px] text-text/85 transition-colors duration-[350ms] hover:text-text"
                  >
                    {s.label}
                    <span
                      aria-hidden="true"
                      className="text-muted transition-transform duration-[350ms] ease-power3 group-hover/social:-translate-y-0.5 group-hover/social:translate-x-0.5 group-hover/social:text-text"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="px-gutter pb-6 md:pb-8">
        <FitText estimate={12.4} className="font-extrabold tracking-[-0.055em] text-text">
          {settings.club_name}
        </FitText>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <MonoLabel as="h2">{title}</MonoLabel>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              data-cursor="link"
              className="text-[15px] text-text/85 transition-colors duration-[350ms] hover:text-text"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { getSettings } from "@/lib/data";
import { announcementKey, announcementScript } from "@/lib/announcement";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer, socialLinks } from "@/components/layout/Footer";
import { Reveals } from "@/components/providers/Reveals";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = `${s.club_name}, ${s.college_name}`;
  return {
    title: { default: name, template: `%s · ${s.club_name}` },
    description: s.tagline,
    applicationName: s.club_name,
  };
}

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  const announcement =
    settings.announcement_enabled && settings.announcement_text
      ? {
          text: settings.announcement_text,
          linkLabel: settings.announcement_link_label,
          linkUrl: settings.announcement_link_url,
          dismissKey: announcementKey(settings.announcement_text, settings.announcement_link_url),
        }
      : null;

  return (
    <html
      lang="en"
      data-ann={announcement ? "on" : "off"}
      className={fontVariables}
      // The inline script below may flip data-ann before hydration, and Reveals adds data-reveals; both are intentional.
      suppressHydrationWarning
    >
      <body>
        {announcement && (
          <script dangerouslySetInnerHTML={{ __html: announcementScript(announcement.dismissKey) }} />
        )}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-control focus:bg-text focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
        >
          Skip to content
        </a>
        <Providers>
          <Header
            clubName={settings.club_name}
            collegeName={settings.college_name}
            joinHref={settings.join_form_url ?? "/join"}
            announcement={announcement}
            email={settings.contact_email}
            socials={socialLinks(settings)}
          />
          <main id="main">{children}</main>
          <Footer settings={settings} />
          <Suspense fallback={null}>
            <Reveals />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}

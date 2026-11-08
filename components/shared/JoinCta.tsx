import { Button, MonoLabel, TagList } from "@/components/ui";
import { NotifyForm } from "@/components/home/NotifyForm";
import type { Settings } from "@/lib/types";

/**
 * The closing invitation used at the end of the home, /about and /members pages (DESIGN.md §12): one heading, the
 * recruitment state from settings and the teams taking applications. While recruitment is closed the action becomes
 * the "Get notified" email form.
 */
export function JoinCta({ settings, index }: { settings: Settings; index?: number }) {
  const open = settings.recruitment_open;
  return (
    <section aria-labelledby="join-cta-title" className="section-y border-t border-line">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div data-reveal className="lg:col-span-7">
            <MonoLabel index={index}>{open ? "Recruitment is open" : "Join the club"}</MonoLabel>
            <h2 id="join-cta-title" className="mt-6 text-[clamp(2.25rem,5vw,4rem)] leading-[1.04] font-semibold tracking-[-0.035em]">
              Hands on with hardware.
            </h2>
          </div>

          <div data-reveal className="lg:col-span-5 lg:self-end">
            <p className="type-body text-muted">
              {open
                ? "Applications for the new team are open to every year and branch, and you don't need any experience, just curiosity and a willingness to break things. Pick a team, tell us what you want to build, and you'll be on a real project within your first month."
                : "Applications for the next intake aren't open yet, but every year and branch is welcome when they are. Leave your email and we'll tell you the day they open."}
            </p>

            {open && settings.open_teams.length > 0 && (
              <div className="mt-7">
                <p className="mono-label text-faint">Teams taking applications</p>
                <TagList items={settings.open_teams} className="mt-3" />
              </div>
            )}

            {open ? (
              <div className="mt-9 flex flex-wrap gap-3">
                <Button href={settings.join_form_url ?? "/join/apply"} size="lg" arrow>
                  Apply now
                </Button>
                <Button href="/join" variant="secondary" size="lg">
                  How joining works
                </Button>
              </div>
            ) : (
              <NotifyForm className="mt-9" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

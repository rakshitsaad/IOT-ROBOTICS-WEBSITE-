import { IrisButton, MonoLabel, Pill } from "@/components/ui";
import type { Settings } from "@/lib/types";
import { NotifyForm } from "./NotifyForm";

/**
 * Section G: the join card. Heading left, recruitment copy, open teams and the
 * action right. While settings.recruitment_open is false the action becomes a
 * "Get notified" email form. On md+ the section leaves room above the card
 * for the robot, which lands on the card's top edge and waves (HomeScroll).
 */
export function JoinCard({ settings }: { settings: Settings }) {
  const open = settings.recruitment_open;
  return (
    <section
      data-join
      aria-labelledby="join-title"
      className="pt-16 md:pt-[40svh] md:pb-[22svh] md:motion-reduce:py-24"
    >
      <div className="shell">
        <div
          data-join-card
          className="grid gap-10 rounded-card border border-line bg-bg-2 p-7 md:grid-cols-12 md:gap-12 md:p-14 lg:p-16"
        >
          <div className="md:col-span-7">
            <MonoLabel index={6}>Join the club</MonoLabel>
            <h2
              id="join-title"
              className="mt-6 text-[length:clamp(2.6rem,6.4vw,6.25rem)] leading-[1.05] font-bold tracking-[-0.045em]"
            >
              <Pill color="red">Hands on</Pill> with hardware
            </h2>
          </div>

          <div className="md:col-span-5 md:self-end">
            <p className="text-[17px] leading-[1.65] text-muted">
              {open
                ? "Applications for the new team are open to every year and branch, and you don't need any experience, just curiosity and a willingness to break things. Pick a team, tell us what you want to build, and you'll be on a real project within your first month."
                : "Applications for the next intake aren't open yet, but every year and branch is welcome when they are. Leave your email and we'll tell you the day they open."}
            </p>

            {open && settings.open_teams.length > 0 && (
              <>
                <MonoLabel as="p" className="mt-7">
                  Open teams
                </MonoLabel>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {settings.open_teams.map((team) => (
                    <li key={team} className="text-[13px] font-semibold">
                      <Pill color="raised">{team}</Pill>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {open ? (
              <IrisButton href={settings.join_form_url ?? "/join"} size="lg" arrow className="mt-9">
                Apply now
              </IrisButton>
            ) : (
              <NotifyForm className="mt-9" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

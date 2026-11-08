import { ArrowLink, MonoLabel, Photo } from "@/components/ui";
import { ABOUT_PURPOSE } from "@/lib/about";

/**
 * Home section 01 (DESIGN.md §12): what the club is. The tagline and two short paragraphs, then one photo from the
 * club's journals beside the mission and vision.
 */
export function HomeIntro({
  tagline,
  photo,
}: {
  tagline: string;
  photo: { url: string; alt: string; event_title: string } | null;
}) {
  return (
    <section aria-labelledby="intro-title" className="section-y border-t border-line">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div data-reveal className="lg:col-span-6">
            <MonoLabel index={1}>About the club</MonoLabel>
            <h2 id="intro-title" className="type-h2 mt-5 max-w-[18ch] text-balance">
              {tagline}
            </h2>
          </div>
          <div data-reveal className="space-y-5 lg:col-span-5 lg:col-start-8 lg:pt-10">
            <p className="type-body text-muted">
              <strong className="font-semibold text-text">We start with a soldering iron,</strong> not a slide deck.
              Members prototype drones, robots and connected devices, then test them where things actually break.
            </p>
            <p className="type-body text-muted">
              <strong className="font-semibold text-text">Every semester brings workshops,</strong> build sprints and
              competitions, plus a research division writing up what we build.
            </p>
            <ArrowLink href="/about" className="pt-2">
              Our story
            </ArrowLink>
          </div>
        </div>

        <div className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-12 lg:gap-8">
          <figure data-reveal className="lg:col-span-7">
            <Photo src={photo?.url} alt={photo?.alt ?? "Club members at work"} sizes="(min-width: 1024px) 56vw, 100vw" ratio="aspect-[3/2]" />
            {photo && <figcaption className="mt-3 text-[13px] text-faint">{photo.alt}. {photo.event_title}.</figcaption>}
          </figure>

          <dl className="grid content-start gap-8 lg:col-span-4 lg:col-start-9">
            {ABOUT_PURPOSE.map((p) => (
              <div key={p.label} data-reveal className="border-t border-line pt-6">
                <dt className="mono-label text-faint">{p.label}</dt>
                <dd className="mt-3">
                  <p className="text-[19px] leading-snug font-semibold tracking-[-0.015em]">{p.title}</p>
                  <p className="type-body mt-3 text-muted">{p.body}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

import type { Project } from "@/lib/types";
import { FeaturedSlider, type SliderProject } from "./FeaturedSlider";

/**
 * Section D: featured projects (is_featured) in a full-bleed carousel with
 * 16px side margins. While it is on screen the robot ducks into the
 * bottom-right corner with a sleepy face (HomeScroll).
 */
export function Featured({ projects }: { projects: Project[] }) {
  const slides: SliderProject[] = projects
    .filter((p): p is Project & { cover_url: string } => Boolean(p.cover_url))
    .map(({ id, slug, title, year, tags, cover_url }) => ({ id, slug, title, year, tags, cover_url }));
  if (!slides.length) return null;
  return (
    <section data-slider aria-label="Featured projects" className="py-[clamp(4rem,10svh,8rem)]">
      <div className="px-4">
        <FeaturedSlider projects={slides} />
      </div>
    </section>
  );
}

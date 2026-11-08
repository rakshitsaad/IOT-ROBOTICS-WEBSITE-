import { Button, MonoLabel } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="shell pt-header">
      <div className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-16">
        <MonoLabel index="404">Page not found</MonoLabel>
        <h1 className="type-h1 max-w-[18ch]">This page is still on the workbench.</h1>
        <p className="type-body max-w-[44ch] text-muted">The link may be old, or the page may have moved.</p>
        <div className="flex flex-wrap gap-3">
          <Button href="/" arrow>
            Back home
          </Button>
          <Button href="/projects" variant="secondary">
            See the projects
          </Button>
        </div>
      </div>
    </section>
  );
}

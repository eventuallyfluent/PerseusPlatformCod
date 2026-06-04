import { HardLink } from "@/components/ui/hard-link";

const BLOG_URL = "https://perseusarcaneacademy.com/blog";

export function PublicNotFoundContent() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-20 sm:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_18%,var(--accent-soft),transparent_28%),radial-gradient(circle_at_78%_16%,var(--premium-soft),transparent_24%)]" />
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(280px,0.42fr)] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-lavender)]">
              404
            </p>
            <div className="space-y-5">
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.02em] text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
                Page not found.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
                This path does not currently lead to a Perseus course or academy page. You can return to the course catalog or visit the blog for essays, updates, and study notes.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <HardLink
              href="/courses"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--button-primary-background)] px-6 text-sm font-semibold text-white shadow-[var(--button-primary-shadow)] transition hover:bg-[var(--button-primary-hover)]"
            >
              Browse courses
            </HardLink>
            <a
              href={BLOG_URL}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button-ghost-background)] px-6 text-sm font-semibold text-[var(--button-ghost-text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--button-ghost-hover-background)] hover:text-[var(--text-primary)]"
            >
              Visit the blog
            </a>
            <HardLink href="/" className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
              Return home
            </HardLink>
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-4 border-b border-[var(--border)] pb-5">
            <div className="grid h-12 w-12 place-items-center rounded-[14px] border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] text-[var(--premium)]">
              <span className="text-xl">✦</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Next steps</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">Find your way back</p>
            </div>
          </div>
          <div className="grid gap-4 pt-5 text-sm leading-6 text-[var(--text-secondary)]">
            <p>Use the catalog if you were looking for a course, bundle, teacher, or study collection.</p>
            <p>Use the blog if you followed an old article, essay, or academy update link.</p>
          </div>
        </div>
      </div>
    </section>
  );
}


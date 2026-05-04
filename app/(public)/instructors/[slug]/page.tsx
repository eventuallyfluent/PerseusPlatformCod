import { notFound } from "next/navigation";
import { getInstructorBySlug } from "@/lib/instructors/get-instructor-by-slug";
import { CourseCard } from "@/components/public/course-card";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbStructuredData, buildPersonStructuredData, buildProfilePageStructuredData } from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instructor = await getInstructorBySlug(slug);
  if (!instructor) {
    return {};
  }

  return buildMetadata({
    title: `${instructor.name} | Perseus Instructor`,
    description: instructor.shortBio ?? instructor.longBio ?? instructor.name,
    path: `/instructors/${instructor.slug}`,
    image: instructor.imageUrl,
  });
}

export default async function InstructorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instructor = await getInstructorBySlug(slug);

  if (!instructor) {
    notFound();
  }

  const socialLinks = [
    ["Website", instructor.websiteUrl],
    ["YouTube", instructor.youtubeUrl],
    ["Instagram", instructor.instagramUrl],
    ["X", instructor.xUrl],
    ["Facebook", instructor.facebookUrl],
    ["Discord", instructor.discordUrl],
    ["Telegram", instructor.telegramUrl],
  ].filter(([, value]) => Boolean(value));

  const personJsonLd = buildPersonStructuredData({
    name: instructor.name,
    description: instructor.shortBio ?? instructor.longBio,
    image: instructor.imageUrl,
    url: `/instructors/${instructor.slug}`,
    sameAs: socialLinks.map(([, url]) => url as string),
  });
  const profilePageJsonLd = buildProfilePageStructuredData({
    name: instructor.name,
    description: instructor.shortBio ?? instructor.longBio,
    image: instructor.imageUrl,
    path: `/instructors/${instructor.slug}`,
    sameAs: socialLinks.map(([, url]) => url as string),
  });
  const breadcrumbJsonLd = buildBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Instructors", path: "/instructors" },
    { name: instructor.name, path: `/instructors/${instructor.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-[var(--shell-background-public)] text-[var(--text-primary)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="border-b border-[var(--hero-shell-border)] px-6 py-8 lg:py-10">
        <div className="mx-auto grid max-w-7xl gap-7 rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface-panel-strong),var(--surface-panel))] p-5 shadow-[var(--shadow-panel)] md:grid-cols-[220px_minmax(0,1fr)] lg:p-6">
          <div className="space-y-4">
            <div
              className="aspect-square w-full max-w-[220px] rounded-[26px] border border-[var(--border)] bg-cover bg-center shadow-[0_16px_40px_rgba(10,11,24,0.24)]"
              style={{
                backgroundImage: instructor.imageUrl ? `url(${instructor.imageUrl})` : "var(--hero-fallback-background)",
              }}
            />
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
              <p className="text-3xl font-semibold text-[var(--hero-text-primary)]">{instructor.courses.length}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Courses</p>
            </div>
            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(([label, url]) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--border)] bg-[var(--button-ghost-background)] px-3 py-2 text-sm text-[var(--hero-text-secondary)] transition hover:bg-[var(--button-ghost-hover-background)] hover:text-[var(--hero-text-primary)]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div className="min-w-0 space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Instructor</p>
              <h1 className="text-5xl leading-none tracking-[-0.05em] text-[var(--hero-text-primary)] sm:text-6xl lg:text-[4.4rem]">{instructor.name}</h1>
              {instructor.shortBio ? <p className="max-w-4xl text-lg leading-8 text-[var(--accent-lavender)]">{instructor.shortBio}</p> : null}
            </div>
            {instructor.longBio ? (
              <div className="max-w-4xl space-y-4 text-base leading-8 text-[var(--text-secondary)]">
                {instructor.longBio
                  .split(/\n+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((paragraph, index) => (
                    <p key={`${instructor.id}-hero-bio-${index}`}>{paragraph}</p>
                  ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 lg:py-12">
        {instructor.longBio && instructor.longBio.split(/\n+/).filter(Boolean).length > 2 ? (
          <section className="max-w-4xl">
            <div className="space-y-4 text-lg leading-10 text-[var(--text-secondary)]">
              {instructor.longBio
                .split(/\n+/)
                .filter(Boolean)
                .slice(2)
                .map((paragraph, index) => (
                  <p key={`${instructor.id}-bio-${index}`}>{paragraph}</p>
                ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-8">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Courses</p>
            <h2 className="text-5xl leading-none tracking-[-0.05em] text-[var(--hero-text-primary)]">Study with {instructor.name.split(" ")[0]}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {instructor.courses.map((course) => (
              <CourseCard key={course.id} course={{ ...course, instructorName: instructor.name }} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.08),transparent_18%),linear-gradient(180deg,#0d0f1d,#13152a_28%,#0c0e1d_100%)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.08)]">
        <div
          className="absolute inset-0 opacity-95"
          style={{
            backgroundImage: instructor.imageUrl
              ? `linear-gradient(180deg, rgba(9,10,20,0.18), rgba(9,10,20,0.78)), url(${instructor.imageUrl})`
              : "linear-gradient(135deg,#1b0c34,#2e175f)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,7,20,0.06),rgba(10,7,20,0.82)_68%,#111223)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-16 lg:pb-12 lg:pt-20">
          <div className="min-h-[380px] lg:min-h-[440px]" />
          <div className="grid gap-6 lg:grid-cols-[150px_1fr] lg:items-end">
            <div className="relative lg:-mt-24">
              <div
                className="h-32 w-32 rounded-full border-[3px] border-[var(--accent)] bg-cover bg-center shadow-[0_16px_40px_rgba(10,11,24,0.35)] lg:h-36 lg:w-36"
                style={{
                  backgroundImage: instructor.imageUrl ? `url(${instructor.imageUrl})` : "linear-gradient(135deg,#1b0c34,#2e175f)",
                }}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <h1 className="text-5xl leading-none tracking-[-0.06em] text-[#f2eaff] sm:text-6xl lg:text-[4.8rem]">{instructor.name}</h1>
                {instructor.shortBio ? <p className="max-w-3xl text-xl leading-8 text-[var(--accent-lavender)]">{instructor.shortBio}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-8 text-white">
                <div>
                  <p className="text-4xl font-semibold">{instructor.courses.length}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Courses</p>
                </div>
                {socialLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map(([label, url]) => (
                      <a
                        key={label}
                        href={url!}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[#ddd5f5] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-6 py-10 lg:py-14">
        {instructor.longBio ? (
          <section className="max-w-4xl">
            <div className="space-y-4 text-lg leading-10 text-[#bcaedc]">
              {instructor.longBio
                .split(/\n+/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={`${instructor.id}-bio-${index}`}>{paragraph}</p>
                ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-8">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Courses</p>
            <h2 className="text-5xl leading-none tracking-[-0.05em] text-white">Study with {instructor.name.split(" ")[0]}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {instructor.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

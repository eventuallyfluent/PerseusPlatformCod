import { notFound } from "next/navigation";
import { getInstructorBySlug } from "@/lib/instructors/get-instructor-by-slug";
import { CourseCard } from "@/components/public/course-card";
import { Card } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildPersonStructuredData } from "@/lib/seo/structured-data";

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

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="overflow-hidden p-0">
          <div
            className="min-h-[360px] bg-cover bg-center"
            style={{
              backgroundImage: instructor.imageUrl
                ? `linear-gradient(180deg, rgba(17, 24, 39, 0.15), rgba(17, 24, 39, 0.35)), url(${instructor.imageUrl})`
                : "linear-gradient(135deg, #1c1917, #f59e0b)",
            }}
          />
        </Card>
        <Card className="space-y-5">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Instructor</p>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-950">{instructor.name}</h1>
          <p className="text-sm leading-7 text-stone-600">{instructor.shortBio}</p>
          <p className="text-sm leading-7 text-stone-600">{instructor.longBio}</p>
          <div className="flex flex-wrap gap-3 text-sm text-stone-600">
            {socialLinks.map(([label, url]) => (
              <a key={label} href={url!} target="_blank" rel="noreferrer" className="underline">
                {label}
              </a>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold text-stone-950">Courses</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {instructor.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}

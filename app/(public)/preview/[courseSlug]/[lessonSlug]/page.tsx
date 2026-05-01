import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoursePlayerLayout } from "@/components/course-player/course-player-layout";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildNoIndexMetadata({
  title: "Preview Lesson",
  description: "Non-indexable public lesson preview page.",
});

export default async function PublicPreviewLessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const course = await getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);

  if (!lesson || !lesson.isPreview) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--shell-background-public)]">
      <div className="mx-auto max-w-[1800px] px-6 py-10">
        <CoursePlayerLayout
          course={course}
          activeLessonSlug={lessonSlug}
          enrolledAt={new Date(0)}
          previewMode
          completedLessonIds={new Set<string>()}
          publicPreview
        />
      </div>
    </div>
  );
}

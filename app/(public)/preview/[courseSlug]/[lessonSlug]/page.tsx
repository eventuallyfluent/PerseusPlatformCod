import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CoursePlayerLayout } from "@/components/course-player/course-player-layout";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
import { prisma } from "@/lib/db/prisma";
import { subscribeToMailingList } from "@/lib/marketing/mailing-list";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildNoIndexMetadata({
  title: "Preview Lesson",
  description: "Non-indexable account-gated lesson preview page.",
});

export default async function PublicPreviewLessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const returnPath = `/preview/${courseSlug}/${lessonSlug}`;
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/login?returnTo=${encodeURIComponent(returnPath)}`);
  }

  const course = await getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);

  if (!lesson || !lesson.isPreview) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  await subscribeToMailingList({
    email: session.user.email,
    userId: user?.id,
    source: "free-preview",
    sourcePath: returnPath,
  });

  return (
    <div className="min-h-screen bg-[var(--shell-background-public)]">
      <div className="mx-auto max-w-[1800px] px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
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

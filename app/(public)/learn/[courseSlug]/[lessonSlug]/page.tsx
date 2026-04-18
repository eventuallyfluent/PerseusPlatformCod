import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
import { isLessonUnlocked } from "@/lib/courses/lesson-availability";
import { prisma } from "@/lib/db/prisma";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";
import { CoursePlayerLayout } from "@/components/course-player/course-player-layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildNoIndexMetadata({
  title: "Lesson",
  description: "Private learner lesson page.",
});

export default async function LessonPage({ params }: { params: Promise<{ courseSlug: string; lessonSlug: string }> }) {
  const session = await requireSession();
  const { courseSlug, lessonSlug } = await params;
  const course = await getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: course.id,
      user: {
        email: session.user.email!,
      },
    },
  });

  const previewEnrolledAt = session.user.isAdmin ? new Date(0) : null;
  const effectiveEnrolledAt = enrollment?.enrolledAt ?? previewEnrolledAt;
  const previewMode = Boolean(session.user.isAdmin && !enrollment);

  if (!effectiveEnrolledAt) {
    notFound();
  }

  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);

  if (!lesson || !isLessonUnlocked({ enrolledAt: effectiveEnrolledAt, dripDays: lesson.dripDays })) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });

  const completedLessonIds = user
    ? new Set(
        (
          await prisma.lessonCompletion.findMany({
            where: {
              userId: user.id,
              lesson: {
                module: {
                  courseId: course.id,
                },
              },
            },
            select: { lessonId: true },
          })
        ).map((item) => item.lessonId),
      )
    : new Set<string>();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.08),transparent_18%),linear-gradient(180deg,#0d0f1d,#13152a_32%,#0c0e1d_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <CoursePlayerLayout
          course={course}
          activeLessonSlug={lessonSlug}
          enrolledAt={effectiveEnrolledAt}
          previewMode={previewMode}
          completedLessonIds={completedLessonIds}
        />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
import { isLessonUnlocked } from "@/lib/courses/lesson-availability";
import { prisma } from "@/lib/db/prisma";
import { CoursePlayerLayout } from "@/components/course-player/course-player-layout";
import { LearnerContextBar } from "@/components/public/learner-context-bar";

export const dynamic = "force-dynamic";

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

  if (!enrollment) {
    notFound();
  }

  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);

  if (!lesson || !isLessonUnlocked({ enrolledAt: enrollment.enrolledAt, dripDays: lesson.dripDays })) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.08),transparent_18%),linear-gradient(180deg,#0d0f1d,#13152a_32%,#0c0e1d_100%)]">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <LearnerContextBar
        label="Lesson space"
        title={course.title}
        description={`Continue through ${lesson.title} with the same structured learner flow used across the platform.`}
        identity={session.user.name ?? session.user.email!}
        primaryHref="/dashboard"
        primaryLabel="Back to dashboard"
        secondaryHref={course.publicPath ?? course.legacyUrl ?? `/course/${course.slug}`}
        secondaryLabel="View course front"
      />
      <CoursePlayerLayout course={course} activeLessonSlug={lessonSlug} enrolledAt={enrollment.enrolledAt} />
      </div>
    </div>
  );
}

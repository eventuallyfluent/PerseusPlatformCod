import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
import { isLessonUnlocked } from "@/lib/courses/lesson-availability";
import { prisma } from "@/lib/db/prisma";
import { CoursePlayerLayout } from "@/components/course-player/course-player-layout";

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
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">{course.title}</p>
          <h1 className="text-4xl leading-none tracking-[-0.05em] text-white">{lesson.title}</h1>
        </div>
        <CoursePlayerLayout course={course} activeLessonSlug={lessonSlug} enrolledAt={enrollment.enrolledAt} />
      </div>
    </div>
  );
}

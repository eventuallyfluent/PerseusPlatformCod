"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function submitCourseReviewAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const quote = String(formData.get("quote") ?? "").trim();
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/login?returnTo=${encodeURIComponent(`/course/${courseSlug}#leave-review-form`)}`);
  }

  const name = String(formData.get("name") ?? "").trim() || session.user.name || "Student";
  const rating = Number(formData.get("rating") ?? 0);
  const recommendsProduct = formData.get("recommendsProduct") === "true";

  if (!courseId || !courseSlug || !quote || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/course/${courseSlug}#leave-review-form`);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId,
      user: { email: session.user.email },
    },
    select: { id: true },
  });

  if (!enrollment) {
    redirect(`/course/${courseSlug}`);
  }

  const existing = await prisma.testimonial.findFirst({
    where: {
      courseId,
      email: session.user.email,
    },
    select: { id: true, position: true },
  });

  if (existing) {
    await prisma.testimonial.update({
      where: { id: existing.id },
      data: {
        name,
        email: session.user.email,
        quote,
        rating,
        recommendsProduct,
        isApproved: false,
      },
    });
  } else {
    const maxPosition = await prisma.testimonial.aggregate({
      where: { courseId },
      _max: { position: true },
    });

    await prisma.testimonial.create({
      data: {
        courseId,
        name,
        email: session.user.email,
        quote,
        rating,
        recommendsProduct,
        position: (maxPosition._max.position ?? 0) + 1,
        isApproved: false,
      },
    });
  }

  revalidatePath(`/course/${courseSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect(`/course/${courseSlug}#leave-review-form`);
}

export async function markLessonCompleteAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const lessonId = String(formData.get("lessonId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const lessonSlug = String(formData.get("lessonSlug") ?? "");

  if (!lessonId || !courseSlug || !lessonSlug) {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    redirect(`/learn/${courseSlug}/${lessonSlug}`);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: lesson.module.courseId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (enrollment) {
    await prisma.lessonCompletion.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        lessonId: lesson.id,
      },
    });
  }

  revalidatePath(`/learn/${courseSlug}/${lessonSlug}`);
  revalidatePath("/dashboard");
  redirect(`/learn/${courseSlug}/${lessonSlug}`);
}

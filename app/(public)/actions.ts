"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function readReviewForm(formData: FormData) {
  const quote = String(formData.get("quote") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);
  const recommendsProduct = formData.get("recommendsProduct") === "true";

  return { quote, name, rating, recommendsProduct };
}

export async function submitCourseReviewAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const { quote, name: formName, rating, recommendsProduct } = readReviewForm(formData);
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/login?returnTo=${encodeURIComponent(`/course/${courseSlug}#leave-review-form`)}`);
  }

  const name = formName || session.user.name || "Student";

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

export async function submitBundleReviewAction(formData: FormData) {
  const bundleId = String(formData.get("bundleId") ?? "");
  const bundleSlug = String(formData.get("bundleSlug") ?? "");
  const { quote, name: formName, rating, recommendsProduct } = readReviewForm(formData);
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/login?returnTo=${encodeURIComponent(`/bundle/${bundleSlug}#leave-review-form`)}`);
  }

  const name = formName || session.user.name || "Student";

  if (!bundleId || !bundleSlug || !quote || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/bundle/${bundleSlug}#leave-review-form`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect(`/bundle/${bundleSlug}`);
  }

  const bundle = await prisma.bundle.findUnique({
    where: { id: bundleId },
    select: {
      id: true,
      accessProduct: {
        select: {
          grants: {
            select: { courseId: true },
          },
        },
      },
    },
  });

  if (!bundle) {
    redirect(`/bundle/${bundleSlug}`);
  }

  const paidBundleOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: OrderStatus.PAID,
      offer: { bundleId },
    },
    select: { id: true },
  });
  const grantedCourseIds = bundle.accessProduct?.grants.map((grant) => grant.courseId) ?? [];
  const grantedEnrollment =
    grantedCourseIds.length > 0
      ? await prisma.enrollment.findFirst({
          where: {
            userId: user.id,
            courseId: { in: grantedCourseIds },
          },
          select: { id: true },
        })
      : null;

  if (!paidBundleOrder && !grantedEnrollment) {
    redirect(`/bundle/${bundleSlug}`);
  }

  const existing = await prisma.testimonial.findFirst({
    where: {
      bundleId,
      email: session.user.email,
    },
    select: { id: true },
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
      where: { bundleId },
      _max: { position: true },
    });

    await prisma.testimonial.create({
      data: {
        bundleId,
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

  revalidatePath(`/bundle/${bundleSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect(`/bundle/${bundleSlug}#leave-review-form`);
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

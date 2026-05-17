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
  const recommendationValue = formData.get("recommendsProduct");
  const recommendsProduct = recommendationValue === null ? true : recommendationValue === "true";

  return { quote, name, rating, recommendsProduct };
}

function getSafeReturnPath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value ?? "").trim();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitCourseInquiryAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const returnPath = getSafeReturnPath(formData.get("returnPath"), `/course/${courseSlug}`);
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 180);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  const marketingConsent = formData.get("marketingConsent") === "true";

  if (!courseId || !courseSlug || name.length < 2 || !isValidEmail(email) || message.length < 10) {
    redirect(`${returnPath}?inquiry=error#course-questions`);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    redirect(`${returnPath}?inquiry=error#course-questions`);
  }

  await prisma.contactInquiry.create({
    data: {
      courseId,
      name,
      email,
      message,
      sourcePath: returnPath,
      marketingConsent,
      marketingConsentAt: marketingConsent ? new Date() : null,
      marketingConsentSource: marketingConsent ? returnPath : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  redirect(`${returnPath}?inquiry=sent#course-questions`);
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
  const submittedReturnPath = String(formData.get("returnPath") ?? "").trim();
  const returnPath = submittedReturnPath.startsWith("/") && !submittedReturnPath.startsWith("//") ? submittedReturnPath : `/bundle/${bundleSlug}`;
  const { quote, name: formName, rating, recommendsProduct } = readReviewForm(formData);
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/login?returnTo=${encodeURIComponent(`${returnPath}#leave-review-form`)}`);
  }

  const name = formName || session.user.name || "Student";

  if (!bundleId || !bundleSlug || !quote || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`${returnPath}#leave-review-form`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect(returnPath);
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
    redirect(returnPath);
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
    redirect(returnPath);
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
  revalidatePath(returnPath);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect(`${returnPath}#leave-review-form`);
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

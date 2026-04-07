"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function submitCourseReviewAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const courseId = String(formData.get("courseId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const quote = String(formData.get("quote") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || session.user.name || "Student";

  if (!courseId || !courseSlug || !quote) {
    redirect(`/course/${courseSlug}#leave-review`);
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
        position: (maxPosition._max.position ?? 0) + 1,
        isApproved: false,
      },
    });
  }

  revalidatePath(`/course/${courseSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect(`/course/${courseSlug}#leave-review`);
}

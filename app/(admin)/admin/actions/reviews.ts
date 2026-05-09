"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

function parseBooleanField(formData: FormData, name: string, defaultValue = false) {
  const value = formData.get(name);

  if (value === null || value === undefined) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "y", "on"].includes(normalized);
}

function redirectReviewError(courseId: string, bundleId: string, reviewReturnPath: string): never {
  if (reviewReturnPath) redirect(`${reviewReturnPath}?error=reviews`);
  if (courseId) redirect(`/admin/courses/${courseId}?error=reviews`);
  if (bundleId) redirect(`/admin/bundles/${bundleId}?error=reviews`);
  redirect("/admin/reviews?error=reviews");
}

function redirectReviewSuccess(courseId: string, bundleId: string, reviewReturnPath: string): never {
  if (reviewReturnPath) redirect(`${reviewReturnPath}?saved=reviews`);
  if (courseId) redirect(`/admin/courses/${courseId}?saved=reviews`);
  if (bundleId) redirect(`/admin/bundles/${bundleId}?saved=reviews`);
  redirect("/admin/reviews?saved=reviews");
}

export async function saveTestimonialAction(formData: FormData) {
  const testimonialId = String(formData.get("testimonialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");
  const reviewReturnPath = String(formData.get("reviewReturnPath") ?? "");
  const rating = Number(formData.get("rating") ?? 5);
  const payload = {
    courseId: courseId || null,
    bundleId: bundleId || null,
    name: String(formData.get("name") ?? "") || null,
    email: formData.has("email") ? String(formData.get("email") ?? "") || null : undefined,
    quote: String(formData.get("quote") ?? ""),
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5,
    position: Number(formData.get("position") ?? 1),
    isApproved: parseBooleanField(formData, "isApproved"),
    recommendsProduct: parseBooleanField(formData, "recommendsProduct", true),
  };

  try {
    if (testimonialId) {
      await prisma.testimonial.update({ where: { id: testimonialId }, data: payload });
    } else {
      await prisma.testimonial.create({ data: payload });
    }
  } catch {
    redirectReviewError(courseId, bundleId, reviewReturnPath);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
  if (bundleId) revalidatePath(`/admin/bundles/${bundleId}`);
  redirectReviewSuccess(courseId, bundleId, reviewReturnPath);
}

export async function deleteTestimonialAction(formData: FormData) {
  const testimonialId = String(formData.get("testimonialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");
  const reviewReturnPath = String(formData.get("reviewReturnPath") ?? "");

  try {
    await prisma.testimonial.delete({ where: { id: testimonialId } });
  } catch {
    redirectReviewError(courseId, bundleId, reviewReturnPath);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
  if (bundleId) revalidatePath(`/admin/bundles/${bundleId}`);
  redirectReviewSuccess(courseId, bundleId, reviewReturnPath);
}

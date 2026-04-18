import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProductThankYouPage } from "@/components/public/product-thank-you-page";
import { prisma } from "@/lib/db/prisma";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";
import { getCourseThankYouPage } from "@/lib/sales-pages/get-course-thank-you-page";
import { resolveCoursePublicPath, resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildNoIndexMetadata({
  title: "Course Purchase Complete",
  description: "Private post-purchase course confirmation page.",
});

export default async function CoursePurchasedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await auth();
  const course = await getCourseBySlug(slug);
  const routePath = `/course/${slug}/purchased`;

  if (!course) {
    const resolved = await resolvePublicRequest(`/course/${slug}`);

    if (resolved?.type === "redirect") {
      redirect(`${resolved.redirect.toPath}/purchased${query.order ? `?order=${query.order}` : ""}`);
    }

    if (resolved?.type !== "course") {
      notFound();
    }

    const canonicalPath = resolveCourseThankYouPath(resolved.course);
    if (canonicalPath !== routePath) {
      permanentRedirect(`${canonicalPath}${query.order ? `?order=${query.order}` : ""}`);
    }

    return renderCourseThankYou(resolved.course, session?.user?.email ?? null, query.order);
  }

  const canonicalPath = resolveCourseThankYouPath(course);
  if (canonicalPath !== routePath) {
    permanentRedirect(`${canonicalPath}${query.order ? `?order=${query.order}` : ""}`);
  }

  return renderCourseThankYou(course, session?.user?.email ?? null, query.order);
}

async function renderCourseThankYou(
  course: Awaited<ReturnType<typeof getCourseBySlug>>,
  sessionEmail: string | null,
  orderId?: string,
) {
  if (!course) {
    notFound();
  }

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        offer: {
          select: {
            courseId: true,
          },
        },
      },
    });

    if (!order || order.offer.courseId !== course.id) {
      notFound();
    }
  }

  const payload = getCourseThankYouPage(course);
  const firstLesson = course.modules[0]?.lessons[0];
  const signedIn = Boolean(sessionEmail);
  const primaryActionHref = signedIn && firstLesson ? `/learn/${course.slug}/${firstLesson.slug}` : signedIn ? "/dashboard" : `/login?returnTo=${encodeURIComponent("/dashboard")}`;
  const primaryActionLabel = signedIn ? payload.signedInActionLabel : payload.signedOutActionLabel;

  return (
    <ProductThankYouPage
      payload={payload}
      primaryActionHref={primaryActionHref}
      primaryActionLabel={primaryActionLabel}
      secondaryActionHref={signedIn ? "/dashboard" : resolveCoursePublicPath(course)}
      secondaryActionLabel={signedIn ? "Go to dashboard" : "Back to course page"}
    />
  );
}

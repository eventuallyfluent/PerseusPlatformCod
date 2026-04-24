import { notFound, permanentRedirect, redirect } from "next/navigation";
import { auth } from "@/auth";
import { BundleSalesPage } from "@/components/public/bundle-sales-page";
import { CourseSalesPage } from "@/components/public/course-sales-page";
import { prisma } from "@/lib/db/prisma";
import { getBundleSalesPage } from "@/lib/bundles/get-bundle-sales-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCourseSalesPage } from "@/lib/sales-pages/get-course-sales-page";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ legacyId: string }> }) {
  const { legacyId } = await params;
  const resolved = await resolvePublicRequest(`/b/${legacyId}`);

  if (!resolved || resolved.type !== "course") {
    return {};
  }

  return buildMetadata({
    title: resolved.course.seoTitle ?? resolved.course.title,
    description: resolved.course.seoDescription ?? resolved.course.shortDescription ?? resolved.course.title,
    path: resolveCoursePublicPath(resolved.course),
    image: resolved.course.heroImageUrl,
  });
}

export default async function LegacyCoursePage({ params }: { params: Promise<{ legacyId: string }> }) {
  const { legacyId } = await params;
  const session = await auth();
  const routePath = `/b/${legacyId}`;
  const reviewLoginHref = `/login?returnTo=${encodeURIComponent(`${routePath}#leave-review-form`)}`;
  const resolved = await resolvePublicRequest(routePath);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "redirect") {
    redirect(resolved.redirect.toPath);
  }

  if (resolved.type === "bundle") {
    const canonicalPath = resolveBundlePublicPath(resolved.bundle);
    if (canonicalPath !== routePath) {
      permanentRedirect(canonicalPath);
    }

    return <BundleSalesPage bundle={resolved.bundle} payload={getBundleSalesPage(resolved.bundle)} />;
  }

  const canonicalPath = resolveCoursePublicPath(resolved.course);
  if (canonicalPath !== routePath) {
    permanentRedirect(canonicalPath);
  }

  const canLeaveReview = Boolean(
    session?.user?.email &&
      (await prisma.enrollment.findFirst({
        where: {
          courseId: resolved.course.id,
          user: { email: session.user.email },
        },
        select: { id: true },
      })),
  );
  const existingReview =
    session?.user?.email
      ? await prisma.testimonial.findFirst({
          where: {
            courseId: resolved.course.id,
            email: session.user.email,
          },
          select: { quote: true, isApproved: true, rating: true },
        })
      : null;

  return (
    <CourseSalesPage
      course={resolved.course}
      payload={getCourseSalesPage(resolved.course)}
      canLeaveReview={canLeaveReview}
      isLoggedIn={Boolean(session?.user?.email)}
      reviewLoginHref={reviewLoginHref}
      existingReview={existingReview}
    />
  );
}

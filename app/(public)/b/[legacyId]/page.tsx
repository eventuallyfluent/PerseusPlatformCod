import { notFound, permanentRedirect, redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { BundleSalesPage } from "@/components/public/bundle-sales-page";
import { CourseSalesPage } from "@/components/public/course-sales-page";
import { getCourseBundleOptions } from "@/lib/courses/get-course-bundle-options";
import { prisma } from "@/lib/db/prisma";
import { getBundleSalesPage } from "@/lib/bundles/get-bundle-sales-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCourseSalesPage } from "@/lib/sales-pages/get-course-sales-page";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";
import type { BundleWithRelations } from "@/types";

export const dynamic = "force-dynamic";

async function getBundleReviewState(bundle: BundleWithRelations, sessionEmail: string | null, reviewLoginHref: string) {
  if (!sessionEmail) {
    return {
      canLeaveReview: false,
      isLoggedIn: false,
      reviewLoginHref,
      existingReview: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true },
  });

  if (!user) {
    return {
      canLeaveReview: false,
      isLoggedIn: true,
      reviewLoginHref,
      existingReview: null,
    };
  }

  const paidBundleOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: OrderStatus.PAID,
      offer: { bundleId: bundle.id },
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
  const existingReview = await prisma.testimonial.findFirst({
    where: {
      bundleId: bundle.id,
      email: sessionEmail,
    },
    select: { quote: true, isApproved: true, rating: true, recommendsProduct: true },
  });

  return {
    canLeaveReview: Boolean(paidBundleOrder || grantedEnrollment),
    isLoggedIn: true,
    reviewLoginHref,
    existingReview,
  };
}

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

export default async function LegacyCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ legacyId: string }>;
  searchParams: Promise<{ inquiry?: string }>;
}) {
  const { legacyId } = await params;
  const query = await searchParams;
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

    const reviewState = await getBundleReviewState(resolved.bundle, session?.user?.email ?? null, reviewLoginHref);
    return <BundleSalesPage bundle={resolved.bundle} payload={getBundleSalesPage(resolved.bundle)} {...reviewState} />;
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
          select: { quote: true, isApproved: true, rating: true, recommendsProduct: true },
        })
      : null;
  const bundleOptions = await getCourseBundleOptions(resolved.course.id);

  return (
    <CourseSalesPage
      course={resolved.course}
      payload={getCourseSalesPage(resolved.course)}
      bundleOptions={bundleOptions}
      canLeaveReview={canLeaveReview}
      isLoggedIn={Boolean(session?.user?.email)}
      reviewLoginHref={reviewLoginHref}
      existingReview={existingReview}
      inquirySent={query.inquiry === "sent"}
      inquiryError={query.inquiry === "error"}
    />
  );
}

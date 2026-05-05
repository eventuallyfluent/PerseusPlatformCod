import { notFound, permanentRedirect, redirect } from "next/navigation";
import { auth } from "@/auth";
import { BundleSalesPage } from "@/components/public/bundle-sales-page";
import { CourseSalesPage } from "@/components/public/course-sales-page";
import { ProductThankYouPage } from "@/components/public/product-thank-you-page";
import { getBundleThankYouPage } from "@/lib/bundles/get-bundle-thank-you-page";
import { getCourseBundleOptions } from "@/lib/courses/get-course-bundle-options";
import { prisma } from "@/lib/db/prisma";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBundleSalesPage } from "@/lib/bundles/get-bundle-sales-page";
import { getCourseThankYouPage } from "@/lib/sales-pages/get-course-thank-you-page";
import { getCourseSalesPage } from "@/lib/sales-pages/get-course-sales-page";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";
import type { BundleWithRelations, CourseWithRelations } from "@/types";

export const dynamic = "force-dynamic";

function buildRequestPath(slug: string[]) {
  return `/${slug.join("/")}`;
}

function stripPurchasedSuffix(slug: string[]) {
  if (slug[slug.length - 1] !== "purchased") {
    return { isPurchased: false, lookupPath: buildRequestPath(slug) };
  }

  return {
    isPurchased: true,
    lookupPath: `/${slug.slice(0, -1).join("/")}`,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const { isPurchased, lookupPath } = stripPurchasedSuffix(slug);
  const resolved = await resolvePublicRequest(lookupPath);

  if (!resolved) {
    return {};
  }

  if (resolved.type === "course") {
    return buildMetadata({
      title: isPurchased ? `${resolved.course.title} Purchase Complete` : resolved.course.seoTitle ?? resolved.course.title,
      description: isPurchased
        ? resolved.course.shortDescription ?? resolved.course.title
        : resolved.course.seoDescription ?? resolved.course.shortDescription ?? resolved.course.title,
      path: resolved.course.publicPath ?? `/course/${resolved.course.slug}`,
      image: resolved.course.heroImageUrl,
      noIndex: isPurchased,
    });
  }

  if (resolved.type === "bundle") {
    return buildMetadata({
      title: isPurchased ? `${resolved.bundle.title} Purchase Complete` : resolved.bundle.seoTitle ?? resolved.bundle.title,
      description: isPurchased
        ? resolved.bundle.shortDescription ?? resolved.bundle.title
        : resolved.bundle.seoDescription ?? resolved.bundle.shortDescription ?? resolved.bundle.title,
      path: resolved.bundle.publicPath ?? `/bundle/${resolved.bundle.slug}`,
      image: resolved.bundle.heroImageUrl,
      noIndex: isPurchased,
    });
  }

  return {};
}

export default async function PublicPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await auth();
  const requestPath = buildRequestPath(slug);
  const { isPurchased, lookupPath } = stripPurchasedSuffix(slug);
  const reviewLoginHref = `/login?returnTo=${encodeURIComponent(`${lookupPath}#leave-review-form`)}`;
  const resolved = await resolvePublicRequest(lookupPath);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "redirect") {
    redirect(isPurchased ? `${resolved.redirect.toPath}/purchased${query.order ? `?order=${query.order}` : ""}` : resolved.redirect.toPath);
  }

  if (resolved.type === "bundle") {
    if (isPurchased) {
      return renderBundleThankYou(resolved.bundle, session?.user?.email ?? null, query.order);
    }

    const canonicalPath = resolveBundlePublicPath(resolved.bundle);
    if (canonicalPath !== requestPath) {
      permanentRedirect(canonicalPath);
    }

    return <BundleSalesPage bundle={resolved.bundle} payload={getBundleSalesPage(resolved.bundle)} />;
  }

  const canonicalPath = resolveCoursePublicPath(resolved.course);
  if (isPurchased) {
    return renderCourseThankYou(resolved.course, session?.user?.email ?? null, query.order);
  }

  if (canonicalPath !== requestPath) {
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
    />
  );
}

async function renderCourseThankYou(course: CourseWithRelations, sessionEmail: string | null, orderId?: string) {
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

  return (
    <ProductThankYouPage
      payload={payload}
      primaryActionHref={primaryActionHref}
      primaryActionLabel={signedIn ? payload.signedInActionLabel : payload.signedOutActionLabel}
      secondaryActionHref={signedIn ? "/dashboard" : resolveCoursePublicPath(course)}
      secondaryActionLabel={signedIn ? "Go to dashboard" : "Back to course page"}
    />
  );
}

async function renderBundleThankYou(bundle: BundleWithRelations, sessionEmail: string | null, orderId?: string) {
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        offer: {
          select: {
            bundleId: true,
          },
        },
      },
    });

    if (!order || order.offer.bundleId !== bundle.id) {
      notFound();
    }
  }

  const payload = getBundleThankYouPage(bundle);
  const signedIn = Boolean(sessionEmail);

  return (
    <ProductThankYouPage
      payload={payload}
      primaryActionHref={signedIn ? "/dashboard" : `/login?returnTo=${encodeURIComponent("/dashboard")}`}
      primaryActionLabel={signedIn ? payload.signedInActionLabel : payload.signedOutActionLabel}
      secondaryActionHref={resolveBundlePublicPath(bundle)}
      secondaryActionLabel={signedIn ? "Review bundle page" : "Back to bundle page"}
    />
  );
}

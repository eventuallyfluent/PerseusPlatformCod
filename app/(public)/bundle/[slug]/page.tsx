import { notFound, permanentRedirect, redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { BundleSalesPage } from "@/components/public/bundle-sales-page";
import { getBundleBySlug } from "@/lib/bundles/get-bundle-by-slug";
import { getBundleSalesPage } from "@/lib/bundles/get-bundle-sales-page";
import { prisma } from "@/lib/db/prisma";
import { buildMetadata } from "@/lib/seo/metadata";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBundleBySlug(slug);

  if (!bundle) {
    const resolved = await resolvePublicRequest(`/bundle/${slug}`);

    if (resolved?.type === "bundle") {
      return buildMetadata({
        title: resolved.bundle.seoTitle ?? resolved.bundle.title,
        description: resolved.bundle.seoDescription ?? resolved.bundle.shortDescription ?? resolved.bundle.title,
        path: resolveBundlePublicPath(resolved.bundle),
        image: resolved.bundle.heroImageUrl,
      });
    }

    return {};
  }

  return buildMetadata({
    title: bundle.seoTitle ?? bundle.title,
    description: bundle.seoDescription ?? bundle.shortDescription ?? bundle.title,
    path: resolveBundlePublicPath(bundle),
    image: bundle.heroImageUrl,
  });
}

async function getBundleReviewState(bundle: Awaited<ReturnType<typeof getBundleBySlug>>, sessionEmail: string | null, reviewLoginHref: string) {
  if (!bundle || !sessionEmail) {
    return {
      canLeaveReview: false,
      isLoggedIn: Boolean(sessionEmail),
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

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const bundle = await getBundleBySlug(slug);
  const routePath = `/bundle/${slug}`;
  const reviewLoginHref = `/login?returnTo=${encodeURIComponent(`${routePath}#leave-review-form`)}`;

  if (!bundle) {
    const resolved = await resolvePublicRequest(routePath);

    if (resolved?.type === "redirect") {
      redirect(resolved.redirect.toPath);
    }

    if (resolved?.type === "bundle") {
      const canonicalPath = resolveBundlePublicPath(resolved.bundle);
      if (canonicalPath !== routePath) {
        permanentRedirect(canonicalPath);
      }

      const reviewState = await getBundleReviewState(resolved.bundle, session?.user?.email ?? null, reviewLoginHref);
      return <BundleSalesPage bundle={resolved.bundle} payload={getBundleSalesPage(resolved.bundle)} {...reviewState} />;
    }

    notFound();
  }

  const canonicalPath = resolveBundlePublicPath(bundle);
  if (canonicalPath !== routePath) {
    permanentRedirect(canonicalPath);
  }

  const reviewState = await getBundleReviewState(bundle, session?.user?.email ?? null, reviewLoginHref);
  return <BundleSalesPage bundle={bundle} payload={getBundleSalesPage(bundle)} {...reviewState} />;
}

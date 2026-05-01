import { notFound, permanentRedirect, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CourseSalesPage } from "@/components/public/course-sales-page";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
import { prisma } from "@/lib/db/prisma";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCourseSalesPage } from "@/lib/sales-pages/get-course-sales-page";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) {
    const resolved = await resolvePublicRequest(`/course/${slug}`);

    if (resolved && resolved.type === "course") {
      return buildMetadata({
        title: resolved.course.seoTitle ?? resolved.course.title,
        description: resolved.course.seoDescription ?? resolved.course.shortDescription ?? resolved.course.title,
        path: resolveCoursePublicPath(resolved.course),
        image: resolved.course.heroImageUrl,
      });
    }

    return {};
  }

  return buildMetadata({
    title: course.seoTitle ?? course.title,
    description: course.seoDescription ?? course.shortDescription ?? course.title,
    path: resolveCoursePublicPath(course),
    image: course.heroImageUrl,
  });
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const course = await getCourseBySlug(slug);
  const routePath = `/course/${slug}`;
  const reviewLoginHref = `/login?returnTo=${encodeURIComponent(`/course/${slug}#leave-review-form`)}`;

  if (!course) {
    const resolved = await resolvePublicRequest(routePath);

    if (resolved?.type === "redirect") {
      redirect(resolved.redirect.toPath);
    }

    if (resolved?.type === "course") {
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

    notFound();
  }

  const canonicalPath = resolveCoursePublicPath(course);
  if (canonicalPath !== routePath) {
    permanentRedirect(canonicalPath);
  }

  const payload = getCourseSalesPage(course);
  const canLeaveReview = Boolean(
    session?.user?.email &&
      (await prisma.enrollment.findFirst({
        where: {
          courseId: course.id,
          user: { email: session.user.email },
        },
        select: { id: true },
      })),
  );
  const existingReview =
    session?.user?.email
      ? await prisma.testimonial.findFirst({
          where: {
            courseId: course.id,
            email: session.user.email,
          },
          select: { quote: true, isApproved: true, rating: true, recommendsProduct: true },
        })
      : null;

  return (
    <CourseSalesPage
      course={course}
      payload={payload}
      canLeaveReview={canLeaveReview}
      isLoggedIn={Boolean(session?.user?.email)}
      reviewLoginHref={reviewLoginHref}
      existingReview={existingReview}
    />
  );
}

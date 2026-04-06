import { notFound, redirect } from "next/navigation";
import { CourseSalesPage } from "@/components/public/course-sales-page";
import { getCourseBySlug } from "@/lib/courses/get-course-by-slug";
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
  const course = await getCourseBySlug(slug);

  if (!course) {
    const resolved = await resolvePublicRequest(`/course/${slug}`);

    if (resolved?.type === "redirect") {
      redirect(resolved.redirect.toPath);
    }

    if (resolved?.type === "course") {
      return <CourseSalesPage course={resolved.course} payload={getCourseSalesPage(resolved.course)} />;
    }

    notFound();
  }

  const payload = getCourseSalesPage(course);

  return <CourseSalesPage course={course} payload={payload} />;
}

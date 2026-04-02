import { notFound, redirect } from "next/navigation";
import { BundleSalesPage } from "@/components/public/bundle-sales-page";
import { CourseSalesPage } from "@/components/public/course-sales-page";
import { getBundleSalesPage } from "@/lib/bundles/get-bundle-sales-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCourseSalesPage } from "@/lib/sales-pages/get-course-sales-page";
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
    path: resolved.course.publicPath ?? `/course/${resolved.course.slug}`,
    image: resolved.course.heroImageUrl,
  });
}

export default async function LegacyCoursePage({ params }: { params: Promise<{ legacyId: string }> }) {
  const { legacyId } = await params;
  const resolved = await resolvePublicRequest(`/b/${legacyId}`);

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "redirect") {
    redirect(resolved.redirect.toPath);
  }

  if (resolved.type === "bundle") {
    return <BundleSalesPage bundle={resolved.bundle} payload={getBundleSalesPage(resolved.bundle)} />;
  }

  return <CourseSalesPage course={resolved.course} payload={getCourseSalesPage(resolved.course)} />;
}

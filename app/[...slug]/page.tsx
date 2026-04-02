import { notFound, redirect } from "next/navigation";
import { BundleSalesPage } from "@/components/public/bundle-sales-page";
import { CourseSalesPage } from "@/components/public/course-sales-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBundleSalesPage } from "@/lib/bundles/get-bundle-sales-page";
import { getCourseSalesPage } from "@/lib/sales-pages/get-course-sales-page";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";

export const dynamic = "force-dynamic";

function buildRequestPath(slug: string[]) {
  return `/${slug.join("/")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const resolved = await resolvePublicRequest(buildRequestPath(slug));

  if (!resolved) {
    return {};
  }

  if (resolved.type === "course") {
    return buildMetadata({
      title: resolved.course.seoTitle ?? resolved.course.title,
      description: resolved.course.seoDescription ?? resolved.course.shortDescription ?? resolved.course.title,
      path: resolved.course.publicPath ?? `/course/${resolved.course.slug}`,
      image: resolved.course.heroImageUrl,
    });
  }

  if (resolved.type === "bundle") {
    return buildMetadata({
      title: resolved.bundle.seoTitle ?? resolved.bundle.title,
      description: resolved.bundle.seoDescription ?? resolved.bundle.shortDescription ?? resolved.bundle.title,
      path: resolved.bundle.publicPath ?? `/bundle/${resolved.bundle.slug}`,
      image: resolved.bundle.heroImageUrl,
    });
  }

  return {};
}

export default async function PublicPathPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const resolved = await resolvePublicRequest(buildRequestPath(slug));

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

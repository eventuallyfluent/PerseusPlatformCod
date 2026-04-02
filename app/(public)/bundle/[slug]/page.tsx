import { notFound, redirect } from "next/navigation";
import { BundleSalesPage } from "@/components/public/bundle-sales-page";
import { getBundleBySlug } from "@/lib/bundles/get-bundle-by-slug";
import { getBundleSalesPage } from "@/lib/bundles/get-bundle-sales-page";
import { buildMetadata } from "@/lib/seo/metadata";
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
        path: resolved.bundle.publicPath ?? `/bundle/${resolved.bundle.slug}`,
        image: resolved.bundle.heroImageUrl,
      });
    }

    return {};
  }

  return buildMetadata({
    title: bundle.seoTitle ?? bundle.title,
    description: bundle.seoDescription ?? bundle.shortDescription ?? bundle.title,
    path: bundle.publicPath ?? `/bundle/${bundle.slug}`,
    image: bundle.heroImageUrl,
  });
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBundleBySlug(slug);

  if (!bundle) {
    const resolved = await resolvePublicRequest(`/bundle/${slug}`);

    if (resolved?.type === "redirect") {
      redirect(resolved.redirect.toPath);
    }

    if (resolved?.type === "bundle") {
      return <BundleSalesPage bundle={resolved.bundle} payload={getBundleSalesPage(resolved.bundle)} />;
    }

    notFound();
  }

  return <BundleSalesPage bundle={bundle} payload={getBundleSalesPage(bundle)} />;
}

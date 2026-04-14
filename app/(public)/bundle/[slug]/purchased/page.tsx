import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProductThankYouPage } from "@/components/public/product-thank-you-page";
import { prisma } from "@/lib/db/prisma";
import { getBundleBySlug } from "@/lib/bundles/get-bundle-by-slug";
import { getBundleThankYouPage } from "@/lib/bundles/get-bundle-thank-you-page";
import { resolvePublicRequest } from "@/lib/urls/resolve-public-request";

export const dynamic = "force-dynamic";

export default async function BundlePurchasedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await auth();
  const bundle = await getBundleBySlug(slug);

  if (!bundle) {
    const resolved = await resolvePublicRequest(`/bundle/${slug}`);

    if (resolved?.type === "redirect") {
      redirect(`${resolved.redirect.toPath}/purchased${query.order ? `?order=${query.order}` : ""}`);
    }

    if (resolved?.type !== "bundle") {
      notFound();
    }

    return renderBundleThankYou(resolved.bundle, session?.user?.email ?? null, query.order);
  }

  return renderBundleThankYou(bundle, session?.user?.email ?? null, query.order);
}

async function renderBundleThankYou(
  bundle: Awaited<ReturnType<typeof getBundleBySlug>>,
  sessionEmail: string | null,
  orderId?: string,
) {
  if (!bundle) {
    notFound();
  }

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
      secondaryActionHref={signedIn ? `/bundle/${bundle.slug}` : `/bundle/${bundle.slug}`}
      secondaryActionLabel={signedIn ? "Review bundle page" : "Back to bundle page"}
    />
  );
}

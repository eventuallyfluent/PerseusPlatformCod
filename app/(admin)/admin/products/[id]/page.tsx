import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { resolveBundlePublicPath, resolveBundleThankYouPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath, resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";

export const dynamic = "force-dynamic";

function formatTypeLabel(type: string) {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.accessProduct.findUnique({
    where: { id },
    include: {
      course: true,
      bundle: {
        include: {
          courses: {
            include: {
              course: true,
            },
            orderBy: { position: "asc" },
          },
        },
      },
      grants: {
        include: {
          course: {
            include: {
              instructor: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
      offers: {
        include: {
          prices: true,
        },
      },
    },
  });

  if (!product) notFound();

  const primaryOffer = getPrimaryOffer(product.offers);
  const salesPagePath = product.course
    ? resolveCoursePublicPath(product.course)
    : product.bundle
      ? resolveBundlePublicPath(product.bundle)
      : null;
  const thankYouPagePath = product.course
    ? resolveCourseThankYouPath(product.course)
    : product.bundle
      ? resolveBundleThankYouPath(product.bundle)
      : null;
  const sourceHref = product.course ? `/admin/courses/${product.course.id}` : product.bundle ? `/admin/bundles/${product.bundle.id}` : null;

  return (
    <AdminShell title={product.title} description="This product is the access object. It decides what checkout sells and what content unlocks after payment.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="space-y-6 bg-white p-8">
          <div className="space-y-4 border-b border-[var(--border)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Access product</p>
            <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Product-driven access and post-purchase entry.</h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              This record powers the access layer. Courses and bundles remain the content objects, but this product decides what a buyer unlocks and which public surfaces belong to the sale.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Product type</span>
              <span className="mt-2 block text-base font-semibold text-stone-950">{formatTypeLabel(product.type)}</span>
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Status</span>
              <span className="mt-2 block text-base font-semibold text-stone-950">{product.status}</span>
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Checkout page</span>
              <span className="mt-2 block break-all text-stone-950">{primaryOffer ? `/checkout/${primaryOffer.id}` : "No published checkout offer"}</span>
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Checkout mode</span>
              <span className="mt-2 block text-base font-semibold text-stone-950">{product.checkoutMode.replace(/_/g, " ")}</span>
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Sales page</span>
              <span className="mt-2 block break-all text-stone-950">{salesPagePath ?? "No product sales page linked yet"}</span>
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Thank-you page</span>
              <span className="mt-2 block break-all text-stone-950">{thankYouPagePath ?? "No thank-you page linked yet"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-stone-950">Granted content</h3>
              <p className="text-sm text-stone-600">These course links are what fulfillment uses after successful payment or manual confirmation.</p>
            </div>
            <div className="grid gap-3">
              {product.grants.map((grant, index) => (
                <div key={grant.id} className="rounded-[20px] border border-stone-200 bg-white px-4 py-4 text-sm text-stone-700">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Granted course {index + 1}</span>
                  <span className="mt-2 block text-base font-semibold text-stone-950">{grant.course.title}</span>
                  <span className="mt-1 block text-sm text-stone-600">{grant.course.instructor.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Actions</p>
            <div className="grid gap-3">
              {salesPagePath ? (
                <HardLink href={salesPagePath} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                  View sales page
                </HardLink>
              ) : null}
              {primaryOffer ? (
                <HardLink href={`/checkout/${primaryOffer.id}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                  Preview checkout
                </HardLink>
              ) : null}
              {thankYouPagePath ? (
                <HardLink href={thankYouPagePath} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                  View thank-you page
                </HardLink>
              ) : null}
              {sourceHref ? (
                <HardLink href={sourceHref} className="rounded-full bg-stone-950 px-5 py-3 text-center text-sm font-medium text-stone-50">
                  Manage source content
                </HardLink>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

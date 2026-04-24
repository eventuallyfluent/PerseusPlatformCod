import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { resolveBundlePublicPath, resolveBundleThankYouPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath, resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";
import { saveOfferAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

function formatTypeLabel(type: string) {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
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
  const sourceLabel = product.course ? "Course source" : product.bundle ? "Bundle source" : "Linked source";
  const sourceOwnerId = product.course?.id ?? product.bundle?.id ?? "";
  const primaryOfferPrice = primaryOffer?.prices[0]?.amount ?? primaryOffer?.price ?? product.course?.price ?? product.bundle?.price ?? 0;
  const primaryOfferCurrency = primaryOffer?.prices[0]?.currency ?? primaryOffer?.currency ?? product.course?.currency ?? product.bundle?.currency ?? "USD";
  const primaryOfferCompareAt = primaryOffer?.compareAtPrice ?? product.course?.compareAtPrice ?? product.bundle?.compareAtPrice ?? null;
  const feedbackMessage = resolvedSearchParams?.saved === "offer" ? "Checkout settings saved." : "";
  const errorMessage = resolvedSearchParams?.error === "offer" ? "Checkout settings could not be saved. Check the offer fields and try again." : "";
  const actionLinkClass =
    "inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950";
  const infoCardClass = "rounded-[22px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700";

  return (
    <AdminShell title={product.title} description="This product is the commerce layer. It owns checkout, pricing, and what content unlocks after purchase.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <div className="space-y-6">
          <Card className="space-y-6 bg-white p-8">
            {feedbackMessage ? <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedbackMessage}</p> : null}
            {errorMessage ? <p className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
            <div className="space-y-4 border-b border-[var(--border)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product</p>
              <div className="space-y-3">
                <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Commerce settings, checkout ownership, and unlock rules.</h2>
                <p className="max-w-3xl text-sm leading-7 text-stone-700">
                  Courses and bundles remain the content objects. This product is the commercial layer that decides what buyers purchase, where they go next, and what access they receive.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {salesPagePath ? (
                <HardLink href={salesPagePath} className={`${actionLinkClass} shadow-sm`}>
                  View sales page
                </HardLink>
              ) : null}
              {primaryOffer ? (
                <HardLink href={`/checkout/${primaryOffer.id}`} className={`${actionLinkClass} shadow-sm`}>
                  Preview checkout
                </HardLink>
              ) : null}
              {thankYouPagePath ? (
                <HardLink href={thankYouPagePath} className={`${actionLinkClass} shadow-sm`}>
                  View thank-you page
                </HardLink>
              ) : null}
              {sourceHref ? (
                <HardLink href={sourceHref} className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50 shadow-sm transition hover:bg-stone-800">
                  Manage content
                </HardLink>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Product type</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{formatTypeLabel(product.type)}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Status</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{product.status}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Checkout mode</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{product.checkoutMode.replace(/_/g, " ")}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Unlocks</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">
                  {product.grants.length} course{product.grants.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 bg-white p-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-stone-950">Checkout and page surfaces</h3>
              <p className="text-sm leading-7 text-stone-600">This is where the product sends buyers during the sales, checkout, and post-purchase flow.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Checkout page</span>
                <span className="mt-2 block break-all text-stone-950">{primaryOffer ? `/checkout/${primaryOffer.id}` : "No published checkout offer"}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Sales page</span>
                <span className="mt-2 block break-all text-stone-950">{salesPagePath ?? "No product sales page linked yet"}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Thank-you page</span>
                <span className="mt-2 block break-all text-stone-950">{thankYouPagePath ?? "No thank-you page linked yet"}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Offer count</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{product.offers.length} active offer path{product.offers.length === 1 ? "" : "s"}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 bg-white p-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-stone-950">Checkout settings</h3>
              <p className="text-sm leading-7 text-stone-600">Edit the primary checkout offer here. This product is the commerce object, so one product can unlock one or many courses without changing the product count.</p>
            </div>
            <form action={saveOfferAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={primaryOffer?.id ?? ""} />
              <input type="hidden" name="productId" value={product.id} />
              {product.course ? <input type="hidden" name="courseId" value={sourceOwnerId} /> : null}
              {product.bundle ? <input type="hidden" name="bundleId" value={sourceOwnerId} /> : null}
              <label>
                Offer name
                <input name="name" defaultValue={primaryOffer?.name ?? "Main checkout"} required />
              </label>
              <label>
                Offer type
                <select name="type" defaultValue={primaryOffer?.type ?? "ONE_TIME"}>
                  <option value="ONE_TIME">ONE_TIME</option>
                  <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                </select>
              </label>
              <label>
                Price
                <input name="price" type="number" min="0" step="0.01" defaultValue={primaryOfferPrice.toString()} required />
              </label>
              <label>
                Currency
                <input name="currency" defaultValue={primaryOfferCurrency} required />
              </label>
              <label>
                Compare-at price
                <input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={primaryOfferCompareAt?.toString() ?? ""} />
              </label>
              <label>
                Checkout status
                <span className="mt-2 flex items-center gap-3 text-sm text-stone-700">
                  <input className="w-auto" type="checkbox" name="isPublished" value="true" defaultChecked={primaryOffer?.isPublished ?? true} />
                  Published and available for checkout
                </span>
              </label>
              <div className="md:col-span-2 rounded-[22px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-700">
                Product count and learner library count do not need to match. One product can unlock multiple courses when this product carries multiple course grants.
              </div>
              <div className="md:col-span-2">
                <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
                  Save checkout settings
                </button>
              </div>
            </form>
          </Card>

          <Card className="space-y-5 bg-white p-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-stone-950">Unlocked content</h3>
              <p className="text-sm text-stone-600">These linked courses are what fulfillment grants after successful payment or manual confirmation.</p>
            </div>
            <div className="grid gap-3">
              {product.grants.length > 0 ? (
                product.grants.map((grant, index) => (
                  <div key={grant.id} className="rounded-[22px] border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Unlocked course {index + 1}</span>
                        <span className="mt-2 block text-base font-semibold text-stone-950">{grant.course.title}</span>
                        <span className="mt-1 block text-sm text-stone-600">{grant.course.instructor.name}</span>
                      </div>
                      <HardLink href={`/admin/courses/${grant.course.id}`} className="text-sm font-medium text-stone-700 underline underline-offset-4">
                        Open course
                      </HardLink>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600">
                  No unlocked content is configured yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Linked content source</p>
            <div className="space-y-3 text-sm text-stone-700">
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">{sourceLabel}</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{product.course?.title ?? product.bundle?.title ?? "No linked content source"}</span>
                <p className="mt-2 leading-6 text-stone-600">
                  Edit curriculum, included courses, and sales copy on the content side. Keep checkout and access decisions here on the product.
                </p>
              </div>
              {sourceHref ? (
                <HardLink href={sourceHref} className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-800">
                  Manage content
                </HardLink>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-4 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">At a glance</p>
            <div className="grid gap-3 text-sm text-stone-700">
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Source status</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{product.course?.status ?? product.bundle?.status ?? "No source"}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Offer coverage</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{primaryOffer ? "Checkout ready" : "Missing checkout offer"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

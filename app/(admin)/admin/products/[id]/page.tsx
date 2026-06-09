import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { BooleanChoiceField } from "@/components/ui/boolean-choice-field";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { getActiveGatewayRecord } from "@/lib/payments/gateway-queries";
import { resolveBundlePublicPath, resolveBundleThankYouPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath, resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";
import { deleteOfferAction, saveOfferAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

function formatTypeLabel(type: string) {
  if (type === "COURSE_ACCESS") {
    return "Course";
  }

  if (type === "BUNDLE_ACCESS") {
    return "Bundle";
  }

  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function formatOfferType(type: string) {
  if (type === "ONE_TIME") return "One-off";
  if (type === "SUBSCRIPTION") return "Subscription";
  if (type === "PAYMENT_PLAN") return "Payment plan";
  return formatTypeLabel(type);
}

function formatOfferPrice(offer: { price: unknown; currency: string; type: string; prices: Array<{ amount: unknown; currency: string; billingInterval: string | null; isDefault: boolean }> }) {
  const price = offer.prices.find((item) => item.isDefault) ?? offer.prices[0] ?? null;
  const amount = Number(price?.amount ?? offer.price ?? 0);
  const currency = price?.currency ?? offer.currency;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

  return `${formatted}${offer.type === "SUBSCRIPTION" && price?.billingInterval ? `/${price.billingInterval}` : ""}`;
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
  const [product, activeGateway] = await Promise.all([
    prisma.accessProduct.findUnique({
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
    }),
    getActiveGatewayRecord(),
  ]);

  if (!product) notFound();

  const primaryOffer = getPrimaryOffer(product.offers);
  const sortedOffers = [...product.offers].sort(
    (left, right) =>
      Number(right.isDefault) - Number(left.isDefault) ||
      Number(right.isPublished) - Number(left.isPublished) ||
      left.name.localeCompare(right.name),
  );
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
  const sourceLabel = product.course ? "Linked course" : product.bundle ? "Linked bundle" : "Linked source";
  const sourceOwnerId = product.course?.id ?? product.bundle?.id ?? "";
  const primaryOfferPrice = primaryOffer?.prices[0]?.amount ?? primaryOffer?.price ?? product.course?.price ?? product.bundle?.price ?? 0;
  const primaryOfferCurrency = primaryOffer?.prices[0]?.currency ?? primaryOffer?.currency ?? product.course?.currency ?? product.bundle?.currency ?? "USD";
  const primaryOfferCompareAt = primaryOffer?.compareAtPrice ?? product.course?.compareAtPrice ?? product.bundle?.compareAtPrice ?? null;
  const primaryOfferBillingInterval = primaryOffer?.prices.find((price) => price.isDefault)?.billingInterval ?? primaryOffer?.prices[0]?.billingInterval ?? "month";
  const feedbackMessage = resolvedSearchParams?.saved === "offer" ? "Buying option saved." : "";
  const errorMessage = resolvedSearchParams?.error === "offer" ? "Buying option could not be saved. Check the offer fields and try again." : "";
  const activeGatewayLabel = activeGateway ? `${activeGateway.displayName}${activeGateway.isActive ? "" : " inactive"}` : "No active gateway";
  const actionLinkClass =
    "inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950";
  const infoCardClass = "rounded-[22px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700";

  return (
    <AdminShell title={product.course?.title ?? product.bundle?.title ?? product.title} description="Use this page to control checkout, price, and post-purchase flow for the linked content.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <div className="space-y-6">
          <Card className="space-y-6 bg-white p-8">
            {feedbackMessage ? <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedbackMessage}</p> : null}
            {errorMessage ? <p className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
            <div className="space-y-4 border-b border-[var(--border)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product</p>
              <div className="space-y-3">
                <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Checkout, price, and buyer flow.</h2>
                <p className="max-w-3xl text-sm leading-7 text-stone-700">
                  Keep curriculum, included courses, and sales copy on the content page. Use this page for the actual buying path and what happens after purchase.
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
                  Open {product.course ? "course" : product.bundle ? "bundle" : "content"}
                </HardLink>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Sales page</span>
                <span className="mt-2 block break-all text-stone-950">{salesPagePath ?? "No sales page linked"}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Default checkout</span>
                <span className="mt-2 block break-all text-stone-950">{primaryOffer ? `/checkout/${primaryOffer.id}` : "Missing checkout offer"}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Active gateway</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{activeGatewayLabel}</span>
              </div>
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Buying options</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{product.offers.length} option{product.offers.length === 1 ? "" : "s"}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 bg-white p-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-stone-950">Default buying option</h3>
              <p className="text-sm leading-7 text-stone-600">This is the option used first on the sales page. Add other ways to buy below.</p>
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
                  <option value="ONE_TIME">One-off payment</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="PAYMENT_PLAN">Payment plan</option>
                </select>
              </label>
              <label>
                Subscription interval
                <select name="billingInterval" defaultValue={primaryOfferBillingInterval ?? "month"}>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
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
              <BooleanChoiceField
                label="Checkout status"
                name="isPublished"
                defaultValue={primaryOffer?.isPublished ?? true}
                trueLabel="Published"
                falseLabel="Hidden"
                trueDescription="Available for checkout."
                falseDescription="Not shown to buyers."
              />
              <BooleanChoiceField
                label="Primary option"
                name="isDefault"
                defaultValue={primaryOffer?.isDefault ?? true}
                trueLabel="Primary"
                falseLabel="Secondary"
                trueDescription="Show first on sales pages."
                falseDescription="Keep below the main option."
              />
              <div className="md:col-span-2">
                <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
                  Save default option
                </button>
              </div>
            </form>
          </Card>

          <Card className="space-y-5 bg-white p-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-stone-950">All buying options</h3>
              <p className="text-sm leading-7 text-stone-600">Each option unlocks this same product. Keep only the active ways customers should buy.</p>
            </div>
            <div className="grid gap-4">
              {sortedOffers.map((offer) => {
                const offerPrice = offer.prices.find((price) => price.isDefault) ?? offer.prices[0] ?? null;
                return (
                  <div key={offer.id} className="rounded-[22px] border border-stone-200 bg-stone-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {offer.isDefault ? <span className="rounded-full bg-stone-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Default</span> : null}
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${offer.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                            {offer.isPublished ? "Published" : "Hidden"}
                          </span>
                          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">
                            {formatOfferType(offer.type)}
                          </span>
                        </div>
                        <div>
                          <h4 className="truncate text-lg font-semibold text-stone-950">{offer.name}</h4>
                          <p className="mt-1 text-sm text-stone-600">{formatOfferPrice(offer)} via /checkout/{offer.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <HardLink href={`/checkout/${offer.id}`} className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700">
                          Preview checkout
                        </HardLink>
                      </div>
                    </div>
                    <details className="mt-4">
                      <summary className="inline-flex cursor-pointer rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50 marker:content-['']">
                        Edit option
                      </summary>
                      <form action={saveOfferAction} className="grid gap-4 rounded-[20px] border border-stone-200 bg-white p-5 md:grid-cols-3">
                        <input type="hidden" name="id" value={offer.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        {product.course ? <input type="hidden" name="courseId" value={sourceOwnerId} /> : null}
                        {product.bundle ? <input type="hidden" name="bundleId" value={sourceOwnerId} /> : null}
                        <label>
                          Offer name
                          <input name="name" defaultValue={offer.name} required />
                        </label>
                        <label>
                          Offer type
                          <select name="type" defaultValue={offer.type}>
                            <option value="ONE_TIME">One-off payment</option>
                            <option value="SUBSCRIPTION">Subscription</option>
                            <option value="PAYMENT_PLAN">Payment plan</option>
                          </select>
                        </label>
                        <label>
                          Subscription interval
                          <select name="billingInterval" defaultValue={offerPrice?.billingInterval ?? "month"}>
                            <option value="month">Monthly</option>
                            <option value="year">Yearly</option>
                          </select>
                        </label>
                        <label>
                          Price
                          <input name="price" type="number" min="0" step="0.01" defaultValue={(offerPrice?.amount ?? offer.price).toString()} required />
                        </label>
                        <label>
                          Currency
                          <input name="currency" defaultValue={offerPrice?.currency ?? offer.currency} required />
                        </label>
                        <label>
                          Compare-at price
                          <input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={offer.compareAtPrice?.toString() ?? ""} />
                        </label>
                        <BooleanChoiceField
                          label="Checkout status"
                          name="isPublished"
                          defaultValue={offer.isPublished}
                          trueLabel="Published"
                          falseLabel="Hidden"
                          trueDescription="Visible on the sales page."
                          falseDescription="Unavailable to buyers."
                        />
                        <BooleanChoiceField
                          label="Primary option"
                          name="isDefault"
                          defaultValue={offer.isDefault}
                          trueLabel="Primary"
                          falseLabel="Secondary"
                          trueDescription="Show first on sales pages."
                          falseDescription="Keep below the main option."
                        />
                        <div className="flex flex-wrap items-end gap-3">
                          <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
                            Save option
                          </button>
                        </div>
                      </form>
                    </details>
                    <form action={deleteOfferAction} className="mt-3">
                      <input type="hidden" name="offerId" value={offer.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      {product.course ? <input type="hidden" name="courseId" value={sourceOwnerId} /> : null}
                      {product.bundle ? <input type="hidden" name="bundleId" value={sourceOwnerId} /> : null}
                      <ConfirmSubmitButton confirmMessage="Delete this buying option?" className="text-sm font-medium text-rose-700 underline underline-offset-4">
                        Delete buying option
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                );
              })}
            </div>
            <div className="rounded-[22px] border border-dashed border-stone-300 bg-white p-5">
              <h4 className="text-base font-semibold text-stone-950">Add another buying option</h4>
              <form action={saveOfferAction} className="mt-4 grid gap-4 md:grid-cols-3">
                <input type="hidden" name="productId" value={product.id} />
                {product.course ? <input type="hidden" name="courseId" value={sourceOwnerId} /> : null}
                {product.bundle ? <input type="hidden" name="bundleId" value={sourceOwnerId} /> : null}
                <label>
                  Offer name
                  <input name="name" placeholder="Monthly subscription" required />
                </label>
                <label>
                  Offer type
                  <select name="type" defaultValue="ONE_TIME">
                    <option value="ONE_TIME">One-off payment</option>
                    <option value="SUBSCRIPTION">Subscription</option>
                    <option value="PAYMENT_PLAN">Payment plan</option>
                  </select>
                </label>
                <label>
                  Subscription interval
                  <select name="billingInterval" defaultValue="month">
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </label>
                <label>
                  Price
                  <input name="price" type="number" min="0" step="0.01" required />
                </label>
                <label>
                  Currency
                  <input name="currency" defaultValue={primaryOfferCurrency} required />
                </label>
                <label>
                  Compare-at price
                  <input name="compareAtPrice" type="number" min="0" step="0.01" />
                </label>
                <BooleanChoiceField
                  label="Checkout status"
                  name="isPublished"
                  defaultValue
                  trueLabel="Published"
                  falseLabel="Hidden"
                  trueDescription="Visible on the sales page."
                  falseDescription="Unavailable to buyers."
                />
                <BooleanChoiceField
                  label="Primary option"
                  name="isDefault"
                  defaultValue={false}
                  trueLabel="Primary"
                  falseLabel="Secondary"
                  trueDescription="Show first on sales pages."
                  falseDescription="Keep below the main option."
                />
                <div className="flex items-end">
                  <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
                    Add buying option
                  </button>
                </div>
              </form>
            </div>
          </Card>

          {product.bundle ? (
            <Card className="space-y-5 bg-white p-8">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-stone-950">Included courses</h3>
                <p className="text-sm text-stone-600">These are the courses the bundle purchase unlocks.</p>
              </div>
              <div className="grid gap-3">
                {product.grants.length > 0 ? (
                  product.grants.map((grant, index) => (
                    <div key={grant.id} className="rounded-[22px] border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Included course {index + 1}</span>
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
                    No included courses are configured yet.
                  </div>
                )}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Linked content source</p>
            <div className="space-y-3 text-sm text-stone-700">
              <div className={infoCardClass}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">{sourceLabel}</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{product.course?.title ?? product.bundle?.title ?? "No linked content source"}</span>
                <p className="mt-2 leading-6 text-stone-600">
                  Edit curriculum, included courses, and sales copy on that page. Keep checkout and price decisions here.
                </p>
              </div>
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

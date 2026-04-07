import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Card } from "@/components/ui/card";
import { currencyFormatter } from "@/lib/utils";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";

function buildUpsell(offer: NonNullable<Awaited<ReturnType<typeof getOfferById>>>) {
  const upsellCourse = offer.course?.upsellCourse;
  if (upsellCourse) {
    const upsellOffer = getPrimaryOffer(upsellCourse.offers);

    if (upsellOffer?.isPublished) {
      return {
        title: upsellCourse.title,
        subtitle: upsellCourse.subtitle ?? upsellCourse.shortDescription ?? "Add this course before you complete checkout.",
        price: currencyFormatter(upsellCourse.price.toString(), upsellCourse.currency),
        href: `/checkout/${upsellOffer.id}`,
        label: "Add this course",
      };
    }
  }

  const upsellBundle = offer.course?.upsellBundle ?? offer.bundle?.upsellBundle;
  if (upsellBundle) {
    const upsellOffer = getPrimaryOffer(upsellBundle.offers);

    if (upsellOffer?.isPublished) {
      return {
        title: upsellBundle.title,
        subtitle: upsellBundle.subtitle ?? upsellBundle.shortDescription ?? "Upgrade into the wider bundle before you pay.",
        price: currencyFormatter(upsellBundle.price.toString(), upsellBundle.currency),
        href: `/checkout/${upsellOffer.id}`,
        label: "Upgrade to bundle",
      };
    }
  }

  const bundleUpsellCourse = offer.bundle?.upsellCourse;
  if (bundleUpsellCourse) {
    const upsellOffer = getPrimaryOffer(bundleUpsellCourse.offers);

    if (upsellOffer?.isPublished) {
      return {
        title: bundleUpsellCourse.title,
        subtitle: bundleUpsellCourse.subtitle ?? bundleUpsellCourse.shortDescription ?? "Add this course before you complete checkout.",
        price: currencyFormatter(bundleUpsellCourse.price.toString(), bundleUpsellCourse.currency),
        href: `/checkout/${upsellOffer.id}`,
        label: "Add this course",
      };
    }
  }

  return null;
}

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ offerId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { offerId } = await params;
  const query = await searchParams;
  const offer = await getOfferById(offerId);

  if (!offer) {
    notFound();
  }

  const productTitle = offer.course?.title ?? offer.bundle?.title ?? offer.name;
  const bundleCourseCount = offer.bundle?.courses.length ?? 0;
  const productMeta = offer.course
    ? { label: "Instructor", value: offer.course.instructor.name }
    : offer.bundle
      ? { label: "Includes", value: `${bundleCourseCount} ${bundleCourseCount === 1 ? "course" : "courses"}` }
      : null;
  const productKind = offer.course ? "Course checkout" : offer.bundle ? "Bundle checkout" : "Checkout";
  const upsell = buildUpsell(offer);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <div className="rounded-[38px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,#150a2f,#110a24)] px-8 py-10 text-white shadow-[0_28px_70px_rgba(14,12,30,0.24)]">
            <p className="text-[11px] uppercase tracking-[0.36em] text-[rgba(228,216,255,0.72)]">{productKind}</p>
            <h1 className="mt-5 text-6xl leading-[0.95] tracking-[-0.05em]">{productTitle}</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[rgba(236,229,255,0.78)]">
              Keep this step clean: one product summary, one clear payment decision, and immediate access after purchase.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(228,216,255,0.72)]">
              <span className="rounded-full border border-white/10 px-4 py-2">Secure checkout</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Instant enrollment</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Coupon support</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="space-y-2 p-5">
              <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Offer</p>
              <p className="text-lg font-semibold text-stone-950">{offer.name}</p>
            </Card>
            <Card className="space-y-2 p-5">
              <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Price</p>
              <p className="text-lg font-semibold text-stone-950">{currencyFormatter(offer.price.toString(), offer.currency)}</p>
            </Card>
            {productMeta ? (
              <Card className="space-y-2 p-5">
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">{productMeta.label}</p>
                <p className="text-lg font-semibold text-stone-950">{productMeta.value}</p>
              </Card>
            ) : null}
          </div>
        </div>

        <Card className="space-y-6 p-8">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400">Checkout</p>
            <p className="text-sm leading-7 text-stone-600">Review the offer, apply a coupon if you have one, and continue into secure hosted payment.</p>
          </div>
          {query.status === "cancelled" ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Checkout was cancelled. You can try again at any time.</p>
          ) : null}
          <div className="grid gap-4 rounded-[24px] bg-stone-50 p-5 text-sm text-stone-600">
            <div className="flex items-center justify-between">
              <span>Product</span>
              <span>{productTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Price</span>
              <span>{currencyFormatter(offer.price.toString(), offer.currency)}</span>
            </div>
            {productMeta ? (
              <div className="flex items-center justify-between">
                <span>{productMeta.label}</span>
                <span>{productMeta.value}</span>
              </div>
            ) : null}
          </div>
          {upsell ? (
            <div className="rounded-[26px] border border-[rgba(143,44,255,0.18)] bg-[linear-gradient(135deg,rgba(143,44,255,0.08),rgba(212,168,70,0.08))] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Optional upsell</p>
              <h2 className="mt-3 text-2xl leading-none tracking-[-0.03em] text-stone-950">{upsell.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-700">{upsell.subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-lg font-semibold text-stone-950">{upsell.price}</span>
                <a href={upsell.href} className="rounded-full border border-[rgba(143,44,255,0.25)] bg-white px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(143,44,255,0.06)]">
                  {upsell.label}
                </a>
              </div>
            </div>
          ) : null}
          <CheckoutForm offerId={offer.id} />
        </Card>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
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
    <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-7xl items-center px-6 py-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,#160b30,#110a24)] px-8 py-8 text-white shadow-[0_28px_70px_rgba(14,12,30,0.26)]">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[rgba(228,216,255,0.74)]">{productKind}</p>
          <h1 className="mt-4 max-w-xl text-4xl leading-[0.95] tracking-[-0.05em] lg:text-5xl">{productTitle}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[rgba(236,229,255,0.78)]">
            One clear checkout step. Coupon support, secure hosted payment, and access immediately after purchase.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[rgba(228,216,255,0.64)]">Offer</p>
              <p className="mt-2 text-sm font-semibold text-white">{offer.name}</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[rgba(228,216,255,0.64)]">Price</p>
              <p className="mt-2 text-sm font-semibold text-white">{currencyFormatter(offer.price.toString(), offer.currency)}</p>
            </div>
            {productMeta ? (
              <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[rgba(228,216,255,0.64)]">{productMeta.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{productMeta.value}</p>
              </div>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(228,216,255,0.74)]">
            <span className="rounded-full border border-white/10 px-4 py-2">Secure checkout</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Instant enrollment</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Coupon support</span>
          </div>
        </section>

        <section className="rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[rgba(19,21,42,0.92)] px-8 py-8 shadow-[0_28px_70px_rgba(14,12,30,0.18)]">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[rgba(228,216,255,0.58)]">Checkout</p>
            <p className="text-sm leading-7 text-[rgba(236,229,255,0.76)]">Review the product, apply a coupon if needed, then continue into secure hosted payment.</p>
          </div>
          {query.status === "cancelled" ? (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Checkout was cancelled. You can try again at any time.</p>
          ) : null}
          <div className="mt-5 grid gap-3 rounded-[26px] bg-white px-5 py-5 text-sm text-stone-700 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-500">Product</span>
              <span className="max-w-[18rem] text-right font-medium text-stone-950">{productTitle}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-500">Price</span>
              <span className="font-medium text-stone-950">{currencyFormatter(offer.price.toString(), offer.currency)}</span>
            </div>
            {productMeta ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-stone-500">{productMeta.label}</span>
                <span className="font-medium text-stone-950">{productMeta.value}</span>
              </div>
            ) : null}
          </div>

          {upsell ? (
            <div className="mt-5 rounded-[26px] border border-[rgba(212,168,70,0.22)] bg-[linear-gradient(135deg,rgba(212,168,70,0.12),rgba(143,44,255,0.12))] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f2c45e]">Optional upsell</p>
                  <h2 className="mt-2 text-xl leading-none tracking-[-0.03em] text-white">{upsell.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[rgba(236,229,255,0.78)]">{upsell.subtitle}</p>
                </div>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">{upsell.price}</span>
              </div>
              <a href={upsell.href} className="mt-4 inline-flex rounded-full border border-white/14 bg-white px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(255,255,255,0.92)]">
                {upsell.label}
              </a>
            </div>
          ) : null}

          <div className="mt-5">
            <CheckoutForm offerId={offer.id} />
          </div>
        </section>
      </div>
    </div>
  );
}

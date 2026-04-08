import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { currencyFormatter } from "@/lib/utils";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { buildConfiguredUpsell, resolveAppliedUpsellDiscount } from "@/lib/offers/upsell-config";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<{ status?: string; upsellFrom?: string }>;
}) {
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
  const upsell = buildConfiguredUpsell(offer);
  const appliedUpsellDiscount = await resolveAppliedUpsellDiscount(offer, query.upsellFrom);
  const priceLabel = currencyFormatter(offer.price.toString(), offer.currency);
  const discountedPriceLabel =
    appliedUpsellDiscount && appliedUpsellDiscount.discountAmount > 0
      ? currencyFormatter(Number(offer.price) - appliedUpsellDiscount.discountAmount, offer.currency)
      : priceLabel;

  return (
    <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-6xl items-center px-6 py-5">
      <div className="grid w-full gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,#160b30,#110a24)] px-8 py-8 text-white shadow-[0_28px_70px_rgba(14,12,30,0.26)]">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[rgba(228,216,255,0.74)]">{productKind}</p>
          <h1 className="mt-4 max-w-lg text-3xl leading-[0.98] tracking-[-0.045em] lg:text-[2.85rem]">{productTitle}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[rgba(236,229,255,0.78)]">
            One clear checkout step. Coupon support, secure hosted payment, and access immediately after purchase.
          </p>
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
              <span className="max-w-[20rem] text-right font-medium text-stone-950 [overflow-wrap:anywhere]">{productTitle}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-500">Price</span>
              <span className="font-medium text-stone-950">{discountedPriceLabel}</span>
            </div>
            {appliedUpsellDiscount && appliedUpsellDiscount.discountAmount > 0 ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-stone-500">Original price</span>
                  <span className="font-medium text-stone-500 line-through">{appliedUpsellDiscount.originalPrice}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-stone-500">Upsell discount</span>
                  <span className="font-medium text-emerald-700">{appliedUpsellDiscount.savingsLabel ?? "Discount applied"}</span>
                </div>
              </>
            ) : null}
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
                <div className="space-y-2 text-right">
                  {upsell.savingsLabel ? <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2c45e]">{upsell.savingsLabel}</p> : null}
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">{upsell.price}</span>
                  {upsell.originalPrice !== upsell.price ? <p className="text-sm text-[rgba(236,229,255,0.62)] line-through">{upsell.originalPrice}</p> : null}
                </div>
              </div>
              <Link href={upsell.href} className="mt-4 inline-flex rounded-full border border-white/14 bg-white px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(255,255,255,0.92)]">
                {upsell.label}
              </Link>
            </div>
          ) : null}

          <div className="mt-5">
            <CheckoutForm offerId={offer.id} initialUpsellFromOfferId={query.upsellFrom ?? ""} />
          </div>
        </section>
      </div>
    </div>
  );
}

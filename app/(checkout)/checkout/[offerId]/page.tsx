import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { currencyFormatter } from "@/lib/utils";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { buildConfiguredUpsell, resolveAppliedUpsellDiscount } from "@/lib/offers/upsell-config";
import { getActiveGateway } from "@/lib/payments/active-gateway";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { evaluateGatewayPolicy } from "@/lib/payments/policy";

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
  const activeGateway = await getActiveGateway();
  const activeConnector = activeGateway ? findPaymentConnector(activeGateway.provider) : null;
  const activeGatewayDefinition = activeGateway ? resolveGatewayDefinition(activeGateway, activeConnector) : null;
  const gatewayPolicy = activeGatewayDefinition ? evaluateGatewayPolicy(activeGatewayDefinition.capabilities) : null;
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
  const initialQuote = {
    baseLabel: priceLabel,
    upsellDiscountLabel: appliedUpsellDiscount && appliedUpsellDiscount.discountAmount > 0 ? `-${currencyFormatter(appliedUpsellDiscount.discountAmount, offer.currency)}` : null,
    couponDiscountLabel: null,
    totalLabel: discountedPriceLabel,
    couponCode: null,
  };
  const paymentHeadline =
    activeGatewayDefinition?.kind === "bank_transfer"
      ? "Review what is included, apply any discount, then continue to the transfer instructions."
      : "Review what is included, apply any discount, then continue to payment.";
  const paymentNote =
    activeGatewayDefinition?.kind === "bank_transfer"
      ? "Discounts are confirmed before the order is created. Access starts after the bank transfer is confirmed."
      : activeGatewayDefinition?.kind === "generic_api"
        ? "Discounts are confirmed before redirect. Payment then continues through the configured payment provider."
        : "Discounts are confirmed before redirect. Payment finishes through the active checkout provider.";
  const submitLabel = activeGatewayDefinition?.kind === "bank_transfer" ? "Continue to transfer instructions" : "Continue to payment";
  const checkoutChipLabel = activeGatewayDefinition?.kind === "bank_transfer" ? "Manual confirmation" : "Hosted payment";
  const accessChipLabel = activeGatewayDefinition?.kind === "bank_transfer" ? "Access after confirmation" : "Immediate access";

  return (
    <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-6xl items-center px-6 py-4">
      <div className="grid w-full gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,#160b30,#110a24)] px-8 py-7 text-white shadow-[0_24px_60px_rgba(14,12,30,0.24)]">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[rgba(228,216,255,0.74)]">{productKind}</p>
          <h1 className="mt-4 max-w-lg text-3xl leading-[0.98] tracking-[-0.045em] lg:text-[2.55rem]">{productTitle}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[rgba(236,229,255,0.78)]">
            {activeGatewayDefinition?.kind === "bank_transfer"
              ? "Review the offer now, then follow the transfer instructions to complete your purchase."
              : "Review the offer now, then complete your purchase through one clear payment step."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(228,216,255,0.74)]">
            <span className="rounded-full border border-white/10 px-4 py-2">Secure</span>
            <span className="rounded-full border border-white/10 px-4 py-2">{checkoutChipLabel}</span>
            <span className="rounded-full border border-white/10 px-4 py-2">{accessChipLabel}</span>
          </div>
        </section>

        <section className="rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[rgba(19,21,42,0.92)] px-8 py-7 shadow-[0_24px_60px_rgba(14,12,30,0.16)]">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[rgba(228,216,255,0.58)]">Checkout</p>
            <p className="text-sm leading-7 text-[rgba(236,229,255,0.76)]">{paymentHeadline}</p>
          </div>
          {gatewayPolicy ? (
            <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${gatewayPolicy.tone === "success" ? "bg-emerald-50 text-emerald-700" : gatewayPolicy.tone === "warning" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>
              <span className="font-medium">{gatewayPolicy.heading}.</span> {gatewayPolicy.detail}
            </p>
          ) : (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">No active payment gateway is configured.</p>
          )}
          {query.status === "cancelled" ? (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Checkout was cancelled. You can try again at any time.</p>
          ) : null}
          <div className="mt-5 grid gap-3 rounded-[24px] bg-white px-5 py-4 text-sm text-stone-700 shadow-[0_16px_28px_rgba(15,23,42,0.07)]">
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

          <div className="mt-5">
            {gatewayPolicy?.allowed ? (
            <CheckoutForm
              offerId={offer.id}
              initialUpsellFromOfferId={query.upsellFrom ?? ""}
              initialQuote={initialQuote}
              submitLabel={submitLabel}
              paymentNote={paymentNote}
            >
              {upsell ? (
                <div className="rounded-[24px] border border-[rgba(212,168,70,0.22)] bg-[linear-gradient(135deg,rgba(212,168,70,0.10),rgba(143,44,255,0.10))] px-5 py-4">
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
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-[rgba(236,229,255,0.72)]">Add this only if you want the discounted follow-up offer before completing this purchase.</p>
                    <Link href={upsell.href} className="inline-flex rounded-full border border-white/14 bg-white px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(255,255,255,0.92)]">
                      {upsell.label}
                    </Link>
                  </div>
                </div>
              ) : null}
            </CheckoutForm>
            ) : (
              <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5 text-sm leading-7 text-[rgba(236,229,255,0.78)]">
                Checkout is unavailable until an active payment gateway is fully configured for this storefront.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

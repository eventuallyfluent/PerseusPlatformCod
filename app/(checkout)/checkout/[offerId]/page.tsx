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
import { evaluateGatewayOperationalReadiness } from "@/lib/payments/readiness";

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
  const gatewayReadiness =
    activeGateway && activeGatewayDefinition
      ? evaluateGatewayOperationalReadiness({
          gateway: activeGateway,
          definition: activeGatewayDefinition,
          connector: activeConnector,
        })
      : null;
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
  const pendingLabel =
    activeGatewayDefinition?.kind === "bank_transfer"
      ? "Preparing transfer instructions..."
      : activeGatewayDefinition?.kind === "generic_api"
        ? "Opening payment provider..."
        : "Redirecting to payment...";
  const checkoutChipLabel = activeGatewayDefinition?.kind === "bank_transfer" ? "Manual confirmation" : "Hosted payment";
  const accessChipLabel =
    activeGatewayDefinition?.kind === "bank_transfer"
      ? "Access after confirmation"
      : activeGatewayDefinition?.capabilities.mayRequireManualReview
        ? "Access after approval"
        : "Immediate access";

  return (
    <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-6xl items-center px-6 py-4">
      <div className="grid w-full gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <section className="perseus-checkout-hero rounded-[34px] border border-[var(--checkout-hero-panel-border)] bg-[var(--checkout-hero-panel-background)] px-8 py-7 text-[var(--checkout-hero-text)] shadow-[var(--checkout-hero-shadow)]">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--checkout-hero-chip)]">{productKind}</p>
          <h1 className="mt-4 max-w-lg text-3xl leading-[0.98] tracking-[-0.045em] lg:text-[2.55rem]">{productTitle}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--checkout-hero-muted)]">
            {activeGatewayDefinition?.kind === "bank_transfer"
              ? "Review the offer now, then follow the transfer instructions to complete your purchase."
              : "Review the offer now, then complete your purchase through one clear payment step."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--checkout-hero-chip)]">
            <span className="rounded-full border border-[var(--checkout-hero-panel-border)] px-4 py-2">Secure</span>
            <span className="rounded-full border border-[var(--checkout-hero-panel-border)] px-4 py-2">{checkoutChipLabel}</span>
            <span className="rounded-full border border-[var(--checkout-hero-panel-border)] px-4 py-2">{accessChipLabel}</span>
          </div>
        </section>

        <section className="perseus-checkout-form rounded-[34px] border border-[var(--checkout-form-panel-border)] bg-[var(--checkout-form-panel-background)] px-8 py-7 text-[var(--checkout-form-text)] shadow-[var(--checkout-form-shadow)]">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--checkout-form-muted)]">Checkout</p>
            <p className="text-sm leading-7 text-[var(--checkout-form-muted)]">{paymentHeadline}</p>
          </div>
          {gatewayPolicy ? (
            <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${gatewayPolicy.tone === "success" ? "bg-emerald-50 text-emerald-700" : gatewayPolicy.tone === "warning" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>
              <span className="font-medium">{gatewayPolicy.heading}.</span> {gatewayPolicy.detail}
            </p>
          ) : (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">No active payment gateway is configured.</p>
          )}
          {gatewayReadiness ? (
            <p
              className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                gatewayReadiness.status === "ready"
                  ? "bg-emerald-50 text-emerald-700"
                  : gatewayReadiness.status === "attention"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-rose-50 text-rose-700"
              }`}
            >
              <span className="font-medium">{gatewayReadiness.heading}.</span> {gatewayReadiness.detail}
            </p>
          ) : null}
          {query.status === "cancelled" ? (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Checkout was cancelled. You can try again at any time.</p>
          ) : null}
          <div className="perseus-checkout-summary mt-5 grid gap-3 rounded-[24px] bg-[var(--checkout-summary-background)] px-5 py-4 text-sm shadow-[0_16px_28px_rgba(15,23,42,0.07)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--checkout-summary-muted)]">Product</span>
              <span className="max-w-[20rem] text-right font-medium text-[var(--checkout-summary-text)] [overflow-wrap:anywhere]">{productTitle}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--checkout-summary-muted)]">Price</span>
              <span className="font-medium text-[var(--checkout-summary-text)]">{discountedPriceLabel}</span>
            </div>
            {appliedUpsellDiscount && appliedUpsellDiscount.discountAmount > 0 ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--checkout-summary-muted)]">Original price</span>
                  <span className="font-medium text-[var(--checkout-summary-muted)] line-through">{appliedUpsellDiscount.originalPrice}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--checkout-summary-muted)]">Upsell discount</span>
                  <span className="font-medium text-emerald-700">{appliedUpsellDiscount.savingsLabel ?? "Discount applied"}</span>
                </div>
              </>
            ) : null}
            {productMeta ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--checkout-summary-muted)]">{productMeta.label}</span>
                <span className="font-medium text-[var(--checkout-summary-text)]">{productMeta.value}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            {gatewayPolicy?.allowed && gatewayReadiness?.canRunCheckout ? (
            <CheckoutForm
              offerId={offer.id}
              initialUpsellFromOfferId={query.upsellFrom ?? ""}
              initialQuote={initialQuote}
              submitLabel={submitLabel}
              pendingLabel={pendingLabel}
              paymentNote={paymentNote}
            >
              {upsell ? (
                <div className="rounded-[24px] border border-[var(--checkout-upsell-border)] bg-[var(--checkout-upsell-background)] px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--checkout-upsell-label)]">Optional upsell</p>
                      <h2 className="mt-2 text-xl leading-none tracking-[-0.03em] text-[var(--checkout-upsell-text)]">{upsell.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--checkout-upsell-muted)]">{upsell.subtitle}</p>
                    </div>
                    <div className="space-y-2 text-right">
                      {upsell.savingsLabel ? <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--checkout-upsell-label)]">{upsell.savingsLabel}</p> : null}
                      <span className="rounded-full bg-[var(--checkout-upsell-chip-background)] px-4 py-2 text-sm font-semibold text-[var(--checkout-upsell-chip-text)]">{upsell.price}</span>
                      {upsell.originalPrice !== upsell.price ? <p className="text-sm text-[var(--checkout-upsell-muted)] line-through">{upsell.originalPrice}</p> : null}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-[var(--checkout-upsell-muted)]">Add this only if you want the discounted follow-up offer before completing this purchase.</p>
                    <Link href={upsell.href} className="inline-flex rounded-full border border-[var(--checkout-upsell-border)] bg-[var(--checkout-upsell-button-background)] px-5 py-3 text-sm font-semibold text-[var(--checkout-upsell-button-text)] transition hover:bg-[var(--checkout-upsell-button-hover)]">
                      {upsell.label}
                    </Link>
                  </div>
                </div>
              ) : null}
            </CheckoutForm>
            ) : (
              <div className="rounded-[24px] border border-[var(--checkout-unavailable-border)] bg-[var(--checkout-unavailable-background)] px-5 py-5 text-sm leading-7 text-[var(--checkout-unavailable-text)]">
                Checkout is unavailable until the active gateway is configured for a real payment path, has the required credentials, and passes the current payment policy.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

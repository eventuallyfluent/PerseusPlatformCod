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
import { getTaxSettings } from "@/lib/taxes/tax-calculation";

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
  const [activeGateway, taxSettings] = await Promise.all([getActiveGateway(), getTaxSettings()]);
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
  const defaultOfferPrice = offer.prices.find((price) => price.isDefault) ?? offer.prices[0] ?? null;
  const offerAmount = defaultOfferPrice?.amount ?? offer.price;
  const offerCurrency = defaultOfferPrice?.currency ?? offer.currency;
  const intervalSuffix = offer.type === "SUBSCRIPTION" && defaultOfferPrice?.billingInterval ? `/${defaultOfferPrice.billingInterval}` : "";
  const priceLabel = `${currencyFormatter(offerAmount.toString(), offerCurrency)}${intervalSuffix}`;
  const discountedPriceLabel =
    appliedUpsellDiscount && appliedUpsellDiscount.discountAmount > 0
      ? `${currencyFormatter(Number(offerAmount) - appliedUpsellDiscount.discountAmount, offerCurrency)}${intervalSuffix}`
      : priceLabel;
  const providerHandlesTax =
    taxSettings.enabled &&
    Boolean(
      activeGatewayDefinition?.capabilities.actsAsMerchantOfRecord ||
        (activeGatewayDefinition?.capabilities.supportsHostedTaxCollection && activeGatewayDefinition?.capabilities.supportsTaxCalculation),
    );
  const initialQuote = {
    baseLabel: priceLabel,
    upsellDiscountLabel: appliedUpsellDiscount && appliedUpsellDiscount.discountAmount > 0 ? `-${currencyFormatter(appliedUpsellDiscount.discountAmount, offer.currency)}` : null,
    couponDiscountLabel: null,
    taxLabel: providerHandlesTax ? "Calculated by payment provider" : null,
    taxMode: providerHandlesTax ? "provider_collected" : "not_collected",
    requiresTaxLocation: false,
    taxLines: [],
    totalLabel: discountedPriceLabel,
    couponCode: null,
  };
  const showTaxLocationInitially =
    taxSettings.enabled && !providerHandlesTax && (taxSettings.requireTaxLocation || taxSettings.collectForAllCountries);
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
  const checkoutModeNote =
    activeGatewayDefinition?.kind === "bank_transfer"
      ? "Access begins after payment confirmation."
      : activeGatewayDefinition?.capabilities.mayRequireManualReview
        ? "Access may require approval after payment."
        : "Secure payment handled by the active payment provider.";
  const checkoutAvailable = Boolean(gatewayPolicy?.allowed && gatewayReadiness?.canRunCheckout);

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-5 sm:px-6 lg:py-8">
      <div className="grid w-full gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <aside className="perseus-checkout-hero order-2 rounded-[28px] border border-[var(--checkout-hero-panel-border)] bg-[var(--checkout-hero-panel-background)] px-5 py-5 text-[var(--checkout-hero-text)] shadow-[var(--checkout-hero-shadow)] lg:order-1 lg:sticky lg:top-24 lg:px-7 lg:py-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--checkout-hero-chip)]">Checkout details</p>
          <p className="mt-3 text-sm leading-7 text-[var(--checkout-hero-muted)]">{paymentHeadline}</p>
          <div className="mt-5 grid gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--checkout-hero-chip)]">
            <span className="rounded-full border border-[var(--checkout-hero-panel-border)] px-4 py-3">Secure checkout</span>
            <span className="rounded-full border border-[var(--checkout-hero-panel-border)] px-4 py-3">{checkoutChipLabel}</span>
            <span className="rounded-full border border-[var(--checkout-hero-panel-border)] px-4 py-3">{accessChipLabel}</span>
          </div>
        </aside>

        <section className="perseus-checkout-form order-1 rounded-[28px] border border-[var(--checkout-form-panel-border)] bg-[var(--checkout-form-panel-background)] px-4 py-5 text-[var(--checkout-form-text)] shadow-[var(--checkout-form-shadow)] sm:px-6 lg:order-2 lg:px-8 lg:py-7">
          {query.status === "cancelled" ? (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Checkout was cancelled. You can try again at any time.</p>
          ) : null}
          <div>
            {checkoutAvailable ? (
            <CheckoutForm
              offerId={offer.id}
              productTitle={productTitle}
              productKind={productKind}
              productMeta={productMeta}
              checkoutModeNote={checkoutModeNote}
              initialUpsellFromOfferId={query.upsellFrom ?? ""}
              initialQuote={initialQuote}
              showTaxLocationInitially={showTaxLocationInitially}
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
                Checkout is temporarily unavailable. Please return to the course page and try again later.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

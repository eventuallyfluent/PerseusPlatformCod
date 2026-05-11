import { NextResponse } from "next/server";
import { currencyFormatter } from "@/lib/utils";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { resolveAppliedUpsellDiscount } from "@/lib/offers/upsell-config";
import { buildCheckoutPricing } from "@/lib/payments/pricing";
import { checkoutSessionSchema } from "@/lib/zod/schemas";
import { getActiveGateway } from "@/lib/payments/active-gateway";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { getTaxSettings } from "@/lib/taxes/tax-calculation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = checkoutSessionSchema.parse(json);
    const offer = await getOfferById(input.offerId);

    if (!offer || !offer.isPublished) {
      return NextResponse.json({ error: "Offer not available" }, { status: 404 });
    }

    const upsellDiscount = await resolveAppliedUpsellDiscount(offer, input.upsellFromOfferId);
    const [activeGateway, taxSettings] = await Promise.all([getActiveGateway(), getTaxSettings()]);
    const connector = activeGateway ? findPaymentConnector(activeGateway.provider) : null;
    const gatewayDefinition = activeGateway ? resolveGatewayDefinition(activeGateway, connector) : null;
    const providerHandlesTax =
      taxSettings.enabled &&
      Boolean(
        gatewayDefinition?.capabilities.actsAsMerchantOfRecord ||
          (gatewayDefinition?.capabilities.supportsHostedTaxCollection && gatewayDefinition?.capabilities.supportsTaxCalculation),
      );
    const pricing = await buildCheckoutPricing({
      baseAmount: offer.price,
      couponCode: input.couponCode,
      upsellDiscountAmount: upsellDiscount?.discountAmount ?? 0,
      offer,
      taxLocation: {
        country: input.taxCountry,
        region: input.taxRegion,
        postalCode: input.taxPostalCode,
      },
      collectPlatformTax: taxSettings.enabled && !providerHandlesTax,
    });

    return NextResponse.json({
      pricing: {
        baseAmount: pricing.baseAmount,
        baseLabel: currencyFormatter(pricing.baseAmount, offer.currency),
        upsellDiscountAmount: pricing.upsellDiscountAmount,
        upsellDiscountLabel:
          pricing.upsellDiscountAmount > 0 ? `-${currencyFormatter(pricing.upsellDiscountAmount, offer.currency)}` : null,
        couponDiscountAmount: pricing.discountAmount,
        couponDiscountLabel:
          pricing.discountAmount > 0 ? `-${currencyFormatter(pricing.discountAmount, offer.currency)}` : null,
        taxAmount: pricing.taxAmount,
        taxLabel:
          providerHandlesTax
            ? "Calculated by payment provider"
            : pricing.taxAmount > 0
              ? currencyFormatter(pricing.taxAmount, offer.currency)
              : null,
        taxMode: providerHandlesTax ? "provider_collected" : pricing.taxMode,
        requiresTaxLocation: pricing.requiresTaxLocation,
        taxLines: pricing.taxLines.map((line) => ({
          label: line.label,
          jurisdiction: line.jurisdiction,
          ratePercent: line.ratePercent,
          amount: line.amount,
          amountLabel: currencyFormatter(line.amount, offer.currency),
        })),
        totalAmount: pricing.totalAmount,
        totalLabel: currencyFormatter(pricing.totalAmount, offer.currency),
        couponCode: pricing.coupon?.code ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to quote checkout",
      },
      { status: 400 },
    );
  }
}

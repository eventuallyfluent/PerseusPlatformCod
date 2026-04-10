import { NextResponse } from "next/server";
import { currencyFormatter } from "@/lib/utils";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { resolveAppliedUpsellDiscount } from "@/lib/offers/upsell-config";
import { buildCheckoutPricing } from "@/lib/payments/pricing";
import { checkoutSessionSchema } from "@/lib/zod/schemas";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = checkoutSessionSchema.parse(json);
    const offer = await getOfferById(input.offerId);

    if (!offer || !offer.isPublished) {
      return NextResponse.json({ error: "Offer not available" }, { status: 404 });
    }

    const upsellDiscount = await resolveAppliedUpsellDiscount(offer, input.upsellFromOfferId);
    const pricing = await buildCheckoutPricing({
      baseAmount: offer.price,
      couponCode: input.couponCode,
      upsellDiscountAmount: upsellDiscount?.discountAmount ?? 0,
      offer,
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

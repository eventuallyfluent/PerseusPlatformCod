import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { resolveAppliedUpsellDiscount } from "@/lib/offers/upsell-config";
import { buildCheckoutPricing } from "@/lib/payments/pricing";
import type { TaxLocationInput } from "@/lib/taxes/tax-calculation";

export async function createOrder(input: {
  offerId: string;
  userId?: string | null;
  couponCode?: string | null;
  upsellFromOfferId?: string | null;
  taxLocation?: TaxLocationInput;
  collectPlatformTax?: boolean;
}) {
  const offer = await getOfferById(input.offerId);

  if (!offer || !offer.isPublished) {
    throw new Error("Offer not available");
  }

  const upsellDiscount = await resolveAppliedUpsellDiscount(offer, input.upsellFromOfferId);

  const pricing = await buildCheckoutPricing({
    baseAmount: offer.price,
    couponCode: input.couponCode,
    upsellDiscountAmount: upsellDiscount?.discountAmount ?? 0,
    offer,
    taxLocation: input.taxLocation,
    collectPlatformTax: input.collectPlatformTax,
  });

  return prisma.order.create({
    data: {
      offerId: offer.id,
      userId: input.userId,
      status: OrderStatus.PENDING,
      subtotalAmount: pricing.subtotalAmount,
      discountAmount: pricing.discountAmount + pricing.upsellDiscountAmount,
      taxAmount: pricing.taxAmount,
      totalAmount: pricing.totalAmount,
      currency: offer.currency,
      taxCountry: input.taxLocation?.country?.toUpperCase() || null,
      taxRegion: input.taxLocation?.region?.toUpperCase() || null,
      taxPostalCode: input.taxLocation?.postalCode?.toUpperCase() || null,
      taxMode: pricing.taxMode,
      taxLines: pricing.taxLines.length
        ? {
            create: pricing.taxLines.map((line) => ({
              taxRateId: line.taxRateId,
              label: line.label,
              jurisdiction: line.jurisdiction,
              ratePercent: line.ratePercent,
              amount: line.amount,
            })),
          }
        : undefined,
    },
    include: {
      offer: {
        include: {
          course: true,
          bundle: true,
          accessProduct: true,
        },
      },
    },
  });
}

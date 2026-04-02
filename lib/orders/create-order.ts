import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { buildCheckoutPricing } from "@/lib/payments/pricing";

export async function createOrder(input: { offerId: string; userId?: string | null; couponCode?: string | null }) {
  const offer = await getOfferById(input.offerId);

  if (!offer || !offer.isPublished) {
    throw new Error("Offer not available");
  }

  const pricing = await buildCheckoutPricing({
    baseAmount: offer.price,
    couponCode: input.couponCode,
  });

  return prisma.order.create({
    data: {
      offerId: offer.id,
      userId: input.userId,
      status: OrderStatus.PENDING,
      totalAmount: pricing.totalAmount,
      currency: offer.currency,
    },
    include: {
      offer: {
        include: {
          course: true,
          bundle: true,
        },
      },
    },
  });
}

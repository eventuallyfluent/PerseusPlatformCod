import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/utils";
import { getPaymentConnector } from "@/lib/payments/adapter-registry";
import { createOrder } from "@/lib/orders/create-order";
import { buildCheckoutPricing } from "@/lib/payments/pricing";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { getActiveGateway } from "@/lib/payments/active-gateway";

export async function createCheckoutSession(input: { offerId: string; userId?: string | null; customerEmail?: string; couponCode?: string | null }) {
  const gateway = await getActiveGateway();

  if (!gateway) {
    throw new Error("No active gateway configured");
  }

  const offer = await getOfferById(input.offerId);

  if (!offer || !offer.isPublished) {
    throw new Error("Offer not available");
  }

  const pricing = await buildCheckoutPricing({
    baseAmount: offer.price,
    couponCode: input.couponCode,
  });

  const order = await createOrder({
    offerId: input.offerId,
    userId: input.userId,
    couponCode: input.couponCode,
  });

  const connector = getPaymentConnector(gateway.provider);
  const session = await connector.createCheckoutSession({
    offerId: input.offerId,
    orderId: order.id,
    customerEmail: input.customerEmail,
    successUrl: absoluteUrl(`/api/checkout/confirm?orderId=${order.id}`),
    cancelUrl: absoluteUrl(`/checkout/${input.offerId}?status=cancelled`),
    amountOverride: pricing.totalAmount,
    metadata: pricing.coupon
      ? {
          couponCode: pricing.coupon.code,
          discountAmount: pricing.discountAmount.toFixed(2),
        }
      : undefined,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      externalOrderId: session.externalSessionId,
      payments: {
        create: {
          gatewayId: gateway.id,
          amount: pricing.totalAmount,
          currency: order.currency,
          externalPaymentId: session.externalSessionId,
        },
      },
    },
  });

  return session;
}

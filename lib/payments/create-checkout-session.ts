import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/utils";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { createOrder } from "@/lib/orders/create-order";
import { resolveAppliedUpsellDiscount } from "@/lib/offers/upsell-config";
import { buildCheckoutPricing } from "@/lib/payments/pricing";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { getActiveGateway } from "@/lib/payments/active-gateway";
import { evaluateGatewayPolicy } from "@/lib/payments/policy";
import { resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { OrderStatus, PaymentStatus } from "@prisma/client";

function interpolateCheckoutTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (output, [key, value]) => output.replaceAll(`{{${key}}}`, value).replaceAll(`{{${key}Encoded}}`, encodeURIComponent(value)),
    template,
  );
}

export async function createCheckoutSession(input: {
  offerId: string;
  userId?: string | null;
  customerEmail?: string;
  couponCode?: string | null;
  upsellFromOfferId?: string | null;
}) {
  const gateway = await getActiveGateway();

  if (!gateway) {
    throw new Error("No active gateway configured");
  }

  const connector = findPaymentConnector(gateway.provider);
  const gatewayDefinition = resolveGatewayDefinition(gateway, connector);
  const gatewayPolicy = evaluateGatewayPolicy(gatewayDefinition.capabilities);

  if (!gatewayPolicy.allowed) {
    throw new Error(gatewayPolicy.detail);
  }

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
  });

  const order = await createOrder({
    offerId: input.offerId,
    userId: input.userId,
    couponCode: input.couponCode,
    upsellFromOfferId: input.upsellFromOfferId,
  });

  const successUrl = absoluteUrl(`/api/checkout/confirm?orderId=${order.id}`);
  const cancelUrl = absoluteUrl(`/checkout/${input.offerId}?status=cancelled`);

  if (gatewayDefinition.kind === "bank_transfer" || gatewayDefinition.checkoutModel === "manual_instructions") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.AWAITING_PAYMENT,
        externalOrderId: `bank-transfer:${order.id}`,
        payments: {
          create: {
            gatewayId: gateway.id,
            amount: pricing.totalAmount,
            currency: order.currency,
            status: PaymentStatus.AWAITING_BANK_TRANSFER,
            externalPaymentId: `bank-transfer:${order.id}`,
            rawEvent: {
              mode: "bank_transfer",
              createdAt: new Date().toISOString(),
            },
          },
        },
      },
    });

    return {
      checkoutUrl: absoluteUrl(`/checkout/bank-transfer/${order.id}`),
      externalSessionId: `bank-transfer:${order.id}`,
    };
  }

  if (connector && gatewayDefinition.kind === "native") {
    const session = await connector.createCheckoutSession({
      offerId: input.offerId,
      orderId: order.id,
      customerEmail: input.customerEmail,
      successUrl,
      cancelUrl,
      amountOverride: pricing.totalAmount,
      metadata:
        pricing.coupon || pricing.upsellDiscountAmount > 0
          ? {
              ...(pricing.coupon
                ? {
                    couponCode: pricing.coupon.code,
                    discountAmount: pricing.discountAmount.toFixed(2),
                  }
                : {}),
              ...(pricing.upsellDiscountAmount > 0
                ? {
                    upsellDiscountAmount: pricing.upsellDiscountAmount.toFixed(2),
                  }
                : {}),
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

  if (gateway.checkoutUrlTemplate) {
    const externalSessionId = `generic:${order.id}`;
    const checkoutUrl = interpolateCheckoutTemplate(gateway.checkoutUrlTemplate, {
      orderId: order.id,
      offerId: input.offerId,
      amount: pricing.totalAmount.toFixed(2),
      currency: order.currency,
      successUrl,
      cancelUrl,
      customerEmail: input.customerEmail ?? "",
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        externalOrderId: externalSessionId,
        payments: {
          create: {
            gatewayId: gateway.id,
            amount: pricing.totalAmount,
            currency: order.currency,
            status: gatewayDefinition.capabilities.mayRequireManualReview ? PaymentStatus.UNDER_REVIEW : PaymentStatus.PENDING,
            externalPaymentId: externalSessionId,
            rawEvent: {
              mode: "generic_gateway_redirect",
              createdAt: new Date().toISOString(),
            },
          },
        },
      },
    });

    if (gatewayDefinition.capabilities.mayRequireManualReview) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.UNDER_REVIEW },
      });
    }

    return {
      checkoutUrl,
      externalSessionId,
    };
  }

  throw new Error("This gateway profile is configured, but it does not yet define an executable checkout path.");
}

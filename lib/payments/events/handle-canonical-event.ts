import { OrderStatus, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfill-paid-order";
import type { CanonicalPaymentEvent } from "@/types";

type EventContext = {
  canonicalEvent?: CanonicalPaymentEvent;
  gatewayId: string;
  externalEventId?: string;
  payload: unknown;
};

export async function handleCanonicalEvent(context: EventContext) {
  const metadata =
    context.payload &&
    typeof context.payload === "object" &&
    "data" in context.payload &&
    context.payload.data &&
    typeof context.payload.data === "object" &&
    "object" in context.payload.data &&
    context.payload.data.object &&
    typeof context.payload.data.object === "object" &&
    "metadata" in context.payload.data.object
      ? (context.payload.data.object.metadata as Record<string, string | undefined> | undefined)
      : undefined;
  const orderId = metadata?.orderId ?? metadata?.order_id;

  if (!orderId) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      offer: {
        include: {
          course: true,
          bundle: {
            include: {
              courses: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return;
  }

  if (context.canonicalEvent === "payment.authorized") {
    await prisma.payment.updateMany({
      where: {
        orderId: order.id,
        externalPaymentId: context.externalEventId ?? order.externalOrderId ?? undefined,
      },
      data: {
        status: PaymentStatus.AUTHORIZED,
        rawEvent: JSON.parse(JSON.stringify(context.payload)),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.UNDER_REVIEW },
    });
  }

  if (context.canonicalEvent === "payment.under_review") {
    await prisma.payment.updateMany({
      where: {
        orderId: order.id,
        externalPaymentId: context.externalEventId ?? order.externalOrderId ?? undefined,
      },
      data: {
        status: PaymentStatus.UNDER_REVIEW,
        rawEvent: JSON.parse(JSON.stringify(context.payload)),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.UNDER_REVIEW },
    });
  }

  if (context.canonicalEvent === "payment.succeeded") {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        externalPaymentId: context.externalEventId,
        status: PaymentStatus.SUCCEEDED,
      },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          gatewayId: context.gatewayId,
          status: PaymentStatus.SUCCEEDED,
          amount: order.totalAmount,
          currency: order.currency,
          externalPaymentId: context.externalEventId,
          rawEvent: JSON.parse(JSON.stringify(context.payload)),
        },
      });
    }

    if (!existingPayment) {
      await fulfillPaidOrder(order.id);
    }
  }

  if (context.canonicalEvent === "payment.failed") {
    await prisma.payment.updateMany({
      where: {
        orderId: order.id,
        externalPaymentId: context.externalEventId ?? order.externalOrderId ?? undefined,
      },
      data: {
        status: PaymentStatus.FAILED,
        rawEvent: JSON.parse(JSON.stringify(context.payload)),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.FAILED },
    });
  }

  if (context.canonicalEvent === "subscription.started" || context.canonicalEvent === "subscription.renewed") {
    await prisma.subscription.upsert({
      where: { orderId: order.id },
      update: {
        status: SubscriptionStatus.ACTIVE,
        externalSubscriptionId: context.externalEventId,
      },
      create: {
        orderId: order.id,
        gatewayId: context.gatewayId,
        status: SubscriptionStatus.ACTIVE,
        externalSubscriptionId: context.externalEventId,
      },
    });
  }

  if (context.canonicalEvent === "refund.created") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.REFUNDED },
    });

    await prisma.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: PaymentStatus.REFUNDED,
        rawEvent: JSON.parse(JSON.stringify(context.payload)),
      },
    });
  }
}

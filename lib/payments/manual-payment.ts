import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { fulfillPaidOrder } from "@/lib/payments/fulfill-paid-order";

export async function confirmManualPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.SUCCEEDED,
      rawEvent: {
        source: "manual_confirmation",
        confirmedAt: new Date().toISOString(),
      },
    },
  });

  await fulfillPaidOrder(payment.orderId);

  return payment.orderId;
}

export async function failManualPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      rawEvent: {
        source: "manual_confirmation",
        failedAt: new Date().toISOString(),
      },
    },
  });

  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: OrderStatus.FAILED },
  });

  return payment.orderId;
}

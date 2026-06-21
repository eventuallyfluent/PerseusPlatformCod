import { ContractWithdrawalStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { revokeOrderAccess } from "@/lib/access/course-access-grants";
import { prisma } from "@/lib/db/prisma";

export async function finalizeOrderRefund(orderId: string, rawEvent: unknown) {
  const serializedEvent = JSON.parse(JSON.stringify(rawEvent));

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    }),
    prisma.payment.updateMany({
      where: { orderId },
      data: { status: PaymentStatus.REFUNDED, rawEvent: serializedEvent },
    }),
    prisma.contractWithdrawal.updateMany({
      where: { orderId },
      data: {
        status: ContractWithdrawalStatus.REFUNDED,
        refundedAt: new Date(),
        processingError: null,
      },
    }),
  ]);

  await revokeOrderAccess(orderId);
}

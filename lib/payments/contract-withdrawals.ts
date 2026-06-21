import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendWithdrawalAcknowledgement } from "@/lib/email/send-withdrawal-acknowledgement";
import { finalizeOrderRefund } from "@/lib/payments/refunds";
import { revokeOrderAccess } from "@/lib/access/course-access-grants";

export const STATUTORY_WITHDRAWAL_DAYS = 14;

export function getWithdrawalDeadline(contractDate: Date) {
  const deadline = new Date(contractDate);
  deadline.setUTCDate(deadline.getUTCDate() + STATUTORY_WITHDRAWAL_DAYS);
  return deadline;
}

export function getRefundDueDate(submittedAt: Date) {
  const dueAt = new Date(submittedAt);
  dueAt.setUTCDate(dueAt.getUTCDate() + 14);
  return dueAt;
}

export function isWithinWithdrawalPeriod(contractDate: Date, now = new Date()) {
  return now <= getWithdrawalDeadline(contractDate);
}

export async function submitContractWithdrawal(input: {
  orderId: string;
  userId: string;
  consumerName: string;
  acknowledgementEmail: string;
}, dependencies: {
  sendAcknowledgement?: typeof sendWithdrawalAcknowledgement;
} = {}) {
  const sendAcknowledgement = dependencies.sendAcknowledgement ?? sendWithdrawalAcknowledgement;
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: input.userId },
    include: {
      contractWithdrawal: true,
      offer: { include: { course: true, bundle: true, accessProduct: true } },
    },
  });

  if (!order) throw new Error("Order not found.");
  if (!order.contractWithdrawal && order.status !== OrderStatus.PAID) throw new Error("Only a paid order can be withdrawn.");
  if (!order.contractWithdrawal && !isWithinWithdrawalPeriod(order.createdAt)) throw new Error("The online withdrawal period for this order has ended.");

  const submittedAt = new Date();
  const withdrawal =
    order.contractWithdrawal ??
    (await prisma.contractWithdrawal.create({
      data: {
        orderId: order.id,
        userId: input.userId,
        consumerName: input.consumerName,
        acknowledgementEmail: input.acknowledgementEmail,
        submittedAt,
        refundDueAt: getRefundDueDate(submittedAt),
      },
    }));

  await revokeOrderAccess(order.id);

  const productTitle = order.offer.accessProduct?.title ?? order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name;
  if (!withdrawal.acknowledgementSentAt) {
    try {
      await sendAcknowledgement({
        to: input.acknowledgementEmail,
        consumerName: input.consumerName,
        orderId: order.id,
        productTitle,
        submittedAt: withdrawal.submittedAt,
      });
      await prisma.contractWithdrawal.update({
        where: { id: withdrawal.id },
        data: { acknowledgementSentAt: new Date(), acknowledgementError: null },
      });
    } catch (error) {
      await prisma.contractWithdrawal.update({
        where: { id: withdrawal.id },
        data: { acknowledgementError: error instanceof Error ? error.message : "Acknowledgement email failed." },
      });
    }
  }

  return prisma.contractWithdrawal.findUniqueOrThrow({ where: { id: withdrawal.id } });
}

export async function completeManualContractWithdrawal(withdrawalId: string, reconciledByEmail: string) {
  const withdrawal = await prisma.contractWithdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
  await finalizeOrderRefund(withdrawal.orderId, {
    source: "admin_manual_refund_confirmation",
    withdrawalId: withdrawal.id,
    reconciledByEmail,
  });
  await prisma.contractWithdrawal.update({
    where: { id: withdrawal.id },
    data: { reconciledAt: new Date(), reconciledByEmail },
  });
}

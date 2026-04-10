import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ensureEnrollment } from "@/lib/enrollments/ensure-enrollment";
import { sendOnboardingEmail } from "@/lib/email/send-onboarding-email";
import { sendPurchaseConfirmation } from "@/lib/email/send-purchase-confirmation";

export async function fulfillPaidOrder(orderId: string) {
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

  const wasAlreadyPaid = order.status === OrderStatus.PAID;

  if (!wasAlreadyPaid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });
  }

  if (!order.userId || wasAlreadyPaid) {
    return;
  }

  const courseIds = order.offer.courseId ? [order.offer.courseId] : order.offer.bundle?.courses.map((item) => item.courseId) ?? [];

  await Promise.all(courseIds.map((courseId) => ensureEnrollment(order.userId!, courseId)));

  const purchaseTitle = order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name;
  await sendPurchaseConfirmation({
    to: order.user?.email ?? "",
    courseTitle: purchaseTitle,
    amount: order.totalAmount.toString(),
    currency: order.currency,
  });
  await sendOnboardingEmail({
    to: order.user?.email ?? "",
    courseTitle: purchaseTitle,
  });
}

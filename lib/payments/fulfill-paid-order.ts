import { AccessGrantSourceType, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendOnboardingEmail } from "@/lib/email/send-onboarding-email";
import { sendPurchaseConfirmation } from "@/lib/email/send-purchase-confirmation";
import { grantCourseAccess } from "@/lib/access/course-access-grants";

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
          accessProduct: {
            include: {
              grants: {
                orderBy: { position: "asc" },
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

  const courseIds =
    order.offer.accessProduct?.grants.length
      ? order.offer.accessProduct.grants.map((grant) => grant.courseId)
      : order.offer.courseId
        ? [order.offer.courseId]
        : order.offer.bundle?.courses.map((item) => item.courseId) ?? [];

  if (courseIds.length > 0) {
    await grantCourseAccess({
      userId: order.userId,
      courseIds,
      orderId: order.id,
      sourceType: order.offer.type === "SUBSCRIPTION" ? AccessGrantSourceType.SUBSCRIPTION : AccessGrantSourceType.ONE_TIME_PURCHASE,
    });
  }

  const purchaseTitle = order.offer.accessProduct?.title ?? order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name;
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

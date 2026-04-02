import { OrderStatus, PaymentStatus, PrismaClient } from "@prisma/client";
import { createOrder } from "../lib/orders/create-order";
import { handleCanonicalEvent } from "../lib/payments/events/handle-canonical-event";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "bundle-check@perseus.test" },
    update: { name: "Bundle Check" },
    create: {
      email: "bundle-check@perseus.test",
      name: "Bundle Check",
    },
  });

  const gateway = await prisma.gateway.findFirst({
    where: { isActive: true },
    select: { id: true, provider: true },
  });

  if (!gateway) {
    throw new Error("Bundle payment verification failed: no active gateway found.");
  }

  const offer = await prisma.offer.findFirst({
    where: { name: "Bundle Access", bundleId: { not: null } },
    include: {
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
  });

  if (!offer?.bundle) {
    throw new Error("Bundle payment verification failed: seeded bundle offer was not found.");
  }

  await prisma.enrollment.deleteMany({
    where: {
      userId: user.id,
      courseId: {
        in: offer.bundle.courses.map((item) => item.courseId),
      },
    },
  });

  const order = await createOrder({
    offerId: offer.id,
    userId: user.id,
  });

  const externalEventId = `bundle-check-${Date.now()}`;

  await handleCanonicalEvent({
    canonicalEvent: "payment.succeeded",
    gatewayId: gateway.id,
    externalEventId,
    payload: {
      data: {
        object: {
          metadata: {
            orderId: order.id,
          },
        },
      },
    },
  });

  const [updatedOrder, payments, enrollments] = await Promise.all([
    prisma.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        currency: true,
      },
    }),
    prisma.payment.findMany({
      where: { orderId: order.id },
      select: {
        id: true,
        status: true,
        externalPaymentId: true,
        amount: true,
        currency: true,
      },
    }),
    prisma.enrollment.findMany({
      where: {
        userId: user.id,
        courseId: {
          in: offer.bundle.courses.map((item) => item.courseId),
        },
      },
      select: {
        courseId: true,
      },
    }),
  ]);

  if (!updatedOrder || updatedOrder.status !== OrderStatus.PAID) {
    throw new Error("Bundle payment verification failed: order was not marked PAID.");
  }

  if (
    payments.length !== 1 ||
    payments[0]?.status !== PaymentStatus.SUCCEEDED ||
    payments[0]?.externalPaymentId !== externalEventId
  ) {
    throw new Error("Bundle payment verification failed: succeeded payment row was not created correctly.");
  }

  if (enrollments.length !== offer.bundle.courses.length) {
    throw new Error("Bundle payment verification failed: not all included courses were enrolled.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        gateway: gateway.provider,
        bundle: {
          id: offer.bundle.id,
          slug: offer.bundle.slug,
          title: offer.bundle.title,
          courseCount: offer.bundle.courses.length,
        },
        order: {
          ...updatedOrder,
          totalAmount: updatedOrder.totalAmount.toString(),
        },
        payment: {
          ...payments[0],
          amount: payments[0].amount.toString(),
        },
        enrollments: enrollments.length,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

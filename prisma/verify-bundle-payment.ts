import { OrderStatus, PaymentStatus, PrismaClient } from "@prisma/client";
import { createOrder } from "../lib/orders/create-order";
import { handleCanonicalEvent } from "../lib/payments/events/handle-canonical-event";
import { createCheckoutSession } from "../lib/payments/create-checkout-session";
import { confirmManualPayment } from "../lib/payments/manual-payment";
import { POST } from "../app/api/webhooks/[provider]/route";
import { encryptGatewayCredentialValue } from "../lib/payments/gateway-credentials";

const prisma = new PrismaClient();

async function verifyBundlePayment() {
  const user = await prisma.user.upsert({
    where: { email: "bundle-check@perseus.test" },
    update: { name: "Bundle Check" },
    create: {
      email: "bundle-check@perseus.test",
      name: "Bundle Check",
    },
  });

  const gateway =
    (await prisma.gateway.findFirst({
      where: {
        isActive: true,
        provider: {
          not: "bank-transfer",
        },
      },
      select: { id: true, provider: true },
    })) ??
    (await prisma.gateway.upsert({
      where: { provider: "creem" },
      update: {
        displayName: "Creem",
        kind: "native",
        isNativeAdapter: true,
        checkoutModel: "hosted_redirect",
        taxModel: "merchant_of_record",
        settlementBehavior: "asynchronous",
        supportsSubscriptions: true,
        supportsRefunds: true,
        supportsPaymentPlans: true,
        supportsHostedCheckout: true,
        supportsHostedTaxCollection: true,
        actsAsMerchantOfRecord: true,
        mayRequireManualReview: true,
        suitableForHighRisk: true,
      },
      create: {
        provider: "creem",
        displayName: "Creem",
        kind: "native",
        isNativeAdapter: true,
        isActive: false,
        checkoutModel: "hosted_redirect",
        taxModel: "merchant_of_record",
        settlementBehavior: "asynchronous",
        supportsSubscriptions: true,
        supportsRefunds: true,
        supportsPaymentPlans: true,
        supportsHostedCheckout: true,
        supportsHostedTaxCollection: true,
        actsAsMerchantOfRecord: true,
        mayRequireManualReview: true,
        suitableForHighRisk: true,
      },
      select: { id: true, provider: true },
    }));

  if (!gateway) {
    throw new Error("Bundle payment verification failed: no usable native gateway found.");
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

  return {
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
  };
}

async function verifyBankTransfer() {
  const user = await prisma.user.upsert({
    where: { email: "bank-transfer-check@perseus.test" },
    update: { name: "Bank Transfer Check" },
    create: {
      email: "bank-transfer-check@perseus.test",
      name: "Bank Transfer Check",
    },
  });

  const gateway = await prisma.gateway.upsert({
    where: { provider: "bank-transfer" },
    update: {
      displayName: "Bank Transfer",
      kind: "bank_transfer",
      isNativeAdapter: false,
      checkoutModel: "manual_instructions",
      taxModel: "external_tax_service",
      settlementBehavior: "manual_confirmation",
      supportsRefunds: true,
      taxRequiresExternalConfiguration: true,
      requiresBillingAddress: true,
      mayRequireManualReview: true,
      supportsManualConfirmation: true,
      suitableForHighRisk: true,
      instructionsMarkdown:
        "Send the transfer using the configured bank details. Include the order reference exactly as shown. Enrollment is granted after the payment is confirmed.",
    },
    create: {
      provider: "bank-transfer",
      displayName: "Bank Transfer",
      kind: "bank_transfer",
      isNativeAdapter: false,
      isActive: false,
      checkoutModel: "manual_instructions",
      taxModel: "external_tax_service",
      settlementBehavior: "manual_confirmation",
      supportsRefunds: true,
      taxRequiresExternalConfiguration: true,
      requiresBillingAddress: true,
      mayRequireManualReview: true,
      supportsManualConfirmation: true,
      suitableForHighRisk: true,
      instructionsMarkdown:
        "Send the transfer using the configured bank details. Include the order reference exactly as shown. Enrollment is granted after the payment is confirmed.",
    },
    select: { id: true, provider: true },
  });

  const previouslyActive = await prisma.gateway.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const offer = await prisma.offer.findFirst({
    where: {
      bundleId: { not: null },
      isPublished: true,
    },
    include: {
      bundle: {
        include: {
          courses: true,
        },
      },
    },
  });

  if (!offer?.bundle) {
    throw new Error("Bank transfer verification failed: published bundle offer not found.");
  }

  await prisma.enrollment.deleteMany({
    where: {
      userId: user.id,
      courseId: {
        in: offer.bundle.courses.map((item) => item.courseId),
      },
    },
  });

  try {
    await prisma.$transaction([
      prisma.gateway.updateMany({
        data: { isActive: false },
      }),
      prisma.gateway.update({
        where: { id: gateway.id },
        data: { isActive: true },
      }),
    ]);

    const session = await createCheckoutSession({
      offerId: offer.id,
      userId: user.id,
      customerEmail: user.email,
    });

    const orderId = String(session.checkoutUrl.split("/").pop() ?? "");

    if (!orderId) {
      throw new Error("Bank transfer verification failed: checkout did not return an order instructions path.");
    }

    const createdOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!createdOrder || createdOrder.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new Error("Bank transfer verification failed: order was not created in AWAITING_PAYMENT.");
    }

    const payment = createdOrder.payments[0];

    if (!payment || payment.status !== PaymentStatus.AWAITING_BANK_TRANSFER) {
      throw new Error("Bank transfer verification failed: payment was not created in AWAITING_BANK_TRANSFER.");
    }

    const enrollmentsBefore = await prisma.enrollment.count({
      where: {
        userId: user.id,
        courseId: {
          in: offer.bundle.courses.map((item) => item.courseId),
        },
      },
    });

    if (enrollmentsBefore !== 0) {
      throw new Error("Bank transfer verification failed: enrollments were granted before confirmation.");
    }

    await confirmManualPayment(payment.id);

    const [updatedOrder, updatedPayment, enrollmentsAfter] = await Promise.all([
      prisma.order.findUnique({
        where: { id: createdOrder.id },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          currency: true,
        },
      }),
      prisma.payment.findUnique({
        where: { id: payment.id },
        select: {
          id: true,
          status: true,
          externalPaymentId: true,
        },
      }),
      prisma.enrollment.count({
        where: {
          userId: user.id,
          courseId: {
            in: offer.bundle.courses.map((item) => item.courseId),
          },
        },
      }),
    ]);

    if (!updatedOrder || updatedOrder.status !== OrderStatus.PAID) {
      throw new Error("Bank transfer verification failed: order was not marked PAID after confirmation.");
    }

    if (!updatedPayment || updatedPayment.status !== PaymentStatus.SUCCEEDED) {
      throw new Error("Bank transfer verification failed: payment was not marked SUCCEEDED after confirmation.");
    }

    if (enrollmentsAfter !== offer.bundle.courses.length) {
      throw new Error("Bank transfer verification failed: bundle courses were not all enrolled after confirmation.");
    }

    return {
      ok: true,
      gateway: gateway.provider,
      order: {
        ...updatedOrder,
        totalAmount: updatedOrder.totalAmount.toString(),
      },
      payment: updatedPayment,
      enrollments: enrollmentsAfter,
    };
  } finally {
    await prisma.gateway.updateMany({
      data: { isActive: false },
    });

    if (previouslyActive.length > 0) {
      await prisma.gateway.updateMany({
        where: {
          id: {
            in: previouslyActive.map((item) => item.id),
          },
        },
        data: { isActive: true },
      });
    }
  }
}

async function verifyNativeWebhook() {
  const gateway = await prisma.gateway.upsert({
    where: { provider: "creem" },
    update: {
      displayName: "Creem",
      kind: "native",
      isNativeAdapter: true,
      checkoutModel: "hosted_redirect",
      taxModel: "merchant_of_record",
      settlementBehavior: "asynchronous",
      supportsSubscriptions: true,
      supportsRefunds: true,
      supportsPaymentPlans: true,
      supportsHostedCheckout: true,
      supportsHostedTaxCollection: true,
      actsAsMerchantOfRecord: true,
      requiresBillingAddress: true,
      mayRequireManualReview: true,
      suitableForHighRisk: true,
    },
    create: {
      provider: "creem",
      displayName: "Creem",
      kind: "native",
      isNativeAdapter: true,
      isActive: false,
      checkoutModel: "hosted_redirect",
      taxModel: "merchant_of_record",
      settlementBehavior: "asynchronous",
      supportsSubscriptions: true,
      supportsRefunds: true,
      supportsPaymentPlans: true,
      supportsHostedCheckout: true,
      supportsHostedTaxCollection: true,
      actsAsMerchantOfRecord: true,
      requiresBillingAddress: true,
      mayRequireManualReview: true,
      suitableForHighRisk: true,
    },
    select: { id: true, provider: true },
  });

  const user = await prisma.user.upsert({
    where: { email: "native-webhook-check@perseus.test" },
    update: { name: "Webhook Check" },
    create: {
      email: "native-webhook-check@perseus.test",
      name: "Webhook Check",
    },
  });

  const offer = await prisma.offer.findFirst({
    where: {
      courseId: { not: null },
      isPublished: true,
    },
  });

  if (!offer) {
    throw new Error("Native webhook verification failed: published course offer not found.");
  }

  const webhookSecret = "creem_test_secret";
  const eventId = `evt_test_${Date.now()}`;

  await prisma.gatewayCredential.upsert({
    where: {
      gatewayId_key: {
        gatewayId: gateway.id,
        key: "webhook_secret",
      },
    },
    update: {
      valueEncrypted: encryptGatewayCredentialValue(webhookSecret),
    },
    create: {
      gatewayId: gateway.id,
      key: "webhook_secret",
      valueEncrypted: encryptGatewayCredentialValue(webhookSecret),
    },
  });

  const order = await createOrder({
    offerId: offer.id,
    userId: user.id,
  });

  const eventPayload = JSON.stringify({
    id: eventId,
    type: "payment.succeeded",
    data: {
      object: {
        metadata: {
          orderId: order.id,
        },
      },
    },
  });

  const request = new Request("http://localhost/api/webhooks/creem", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-creem-signature": webhookSecret,
    },
    body: eventPayload,
  });

  const response = await POST(request, {
    params: Promise.resolve({ provider: "creem" }),
  });

  if (!response.ok) {
    throw new Error(`Native webhook verification failed: route returned ${response.status} with ${await response.text()}.`);
  }

  const duplicateResponse = await POST(
    new Request("http://localhost/api/webhooks/creem", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-creem-signature": webhookSecret,
      },
      body: eventPayload,
    }),
    {
      params: Promise.resolve({ provider: "creem" }),
    },
  );
  const duplicatePayload = await duplicateResponse.json();

  const [updatedOrder, payment, webhookEvent] = await Promise.all([
    prisma.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        status: true,
      },
    }),
    prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: PaymentStatus.SUCCEEDED,
      },
      select: {
        id: true,
        status: true,
        externalPaymentId: true,
      },
    }),
    prisma.webhookEvent.findFirst({
      where: {
        gatewayId: gateway.id,
        externalEventId: eventId,
      },
      select: {
        id: true,
        eventType: true,
        processedAt: true,
      },
    }),
  ]);

  if (!updatedOrder || updatedOrder.status !== OrderStatus.PAID) {
    throw new Error("Native webhook verification failed: order was not marked PAID.");
  }

  if (!payment) {
    throw new Error("Native webhook verification failed: succeeded payment row was not created.");
  }

  if (!webhookEvent?.processedAt) {
    throw new Error("Native webhook verification failed: webhook event was not recorded as processed.");
  }

  if (!duplicatePayload?.duplicate) {
    throw new Error("Native webhook verification failed: duplicate delivery was not recognized.");
  }

  return {
    ok: true,
    gateway: gateway.provider,
    order: updatedOrder,
    payment,
    webhookEvent,
    duplicateHandled: true,
  };
}

async function main() {
  const bundlePayment = await verifyBundlePayment();
  const bankTransfer = await verifyBankTransfer();
  const nativeWebhook = await verifyNativeWebhook();

  console.log(
    JSON.stringify(
      {
        ok: true,
        bundlePayment,
        bankTransfer,
        nativeWebhook,
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

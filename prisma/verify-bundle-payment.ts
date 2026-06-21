import { AccessGrantSourceType, ContractWithdrawalStatus, OrderStatus, PaymentStatus, PrismaClient } from "@prisma/client";
import { createHmac } from "node:crypto";
import { createOrder } from "../lib/orders/create-order";
import { handleCanonicalEvent } from "../lib/payments/events/handle-canonical-event";
import { createCheckoutSession } from "../lib/payments/create-checkout-session";
import { confirmManualPayment } from "../lib/payments/manual-payment";
import { POST } from "../app/api/webhooks/[provider]/route";
import { encryptGatewayCredentialValue } from "../lib/payments/gateway-credentials";
import { grantCourseAccess } from "../lib/access/course-access-grants";
import { getRefundDueDate, submitContractWithdrawal } from "../lib/payments/contract-withdrawals";

const prisma = new PrismaClient();

const BANK_TRANSFER_TEST_INSTRUCTIONS = [
  "Account name: Perseus Platform Test",
  "Bank name: Verification Bank",
  "Account number: 00000000",
  "Routing/SWIFT: TESTUS00",
  "Include the order reference exactly as shown.",
].join("\n");

const BANK_TRANSFER_GENERIC_INSTRUCTIONS =
  "Send the transfer using the configured bank details. Include the order reference exactly as shown. Enrollment is granted after the payment is confirmed.";

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
    where: {
      bundleId: { not: null },
      isPublished: true,
    },
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
  const previousBankTransferGateway = await prisma.gateway.findUnique({
    where: { provider: "bank-transfer" },
    select: { instructionsMarkdown: true },
  });

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
      instructionsMarkdown: BANK_TRANSFER_TEST_INSTRUCTIONS,
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
      instructionsMarkdown: BANK_TRANSFER_TEST_INSTRUCTIONS,
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

    await prisma.gateway.update({
      where: { provider: "bank-transfer" },
      data: {
        instructionsMarkdown:
          previousBankTransferGateway?.instructionsMarkdown ?? BANK_TRANSFER_GENERIC_INSTRUCTIONS,
      },
    });
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

async function verifyGenericHostedWebhook() {
  const provider = "generic-hosted-check";
  const webhookSecret = "generic_hosted_secret";
  const signatureHeader = "x-generic-signature";
  const gateway = await prisma.gateway.upsert({
    where: { provider },
    update: {
      displayName: "Generic Hosted Check",
      kind: "generic_api",
      isNativeAdapter: false,
      checkoutModel: "hosted_redirect",
      taxModel: "external_tax_service",
      settlementBehavior: "asynchronous",
      supportsRefunds: true,
      supportsHostedCheckout: true,
      taxRequiresExternalConfiguration: true,
      requiresBillingAddress: true,
      mayRequireManualReview: false,
      supportsManualConfirmation: false,
      suitableForHighRisk: true,
      checkoutUrlTemplate: "https://payments.example.test/checkout?order={{orderId}}&amount={{amount}}&return={{successUrlEncoded}}",
      webhookInstructions: "Post signed JSON payment events to /api/webhooks/generic-hosted-check.",
    },
    create: {
      provider,
      displayName: "Generic Hosted Check",
      kind: "generic_api",
      isNativeAdapter: false,
      isActive: false,
      checkoutModel: "hosted_redirect",
      taxModel: "external_tax_service",
      settlementBehavior: "asynchronous",
      supportsRefunds: true,
      supportsHostedCheckout: true,
      taxRequiresExternalConfiguration: true,
      requiresBillingAddress: true,
      mayRequireManualReview: false,
      supportsManualConfirmation: false,
      suitableForHighRisk: true,
      checkoutUrlTemplate: "https://payments.example.test/checkout?order={{orderId}}&amount={{amount}}&return={{successUrlEncoded}}",
      webhookInstructions: "Post signed JSON payment events to /api/webhooks/generic-hosted-check.",
    },
    select: { id: true, provider: true },
  });

  const credentialEntries = {
    webhook_signature_header: signatureHeader,
    webhook_secret: webhookSecret,
    webhook_signature_mode: "hmac_sha256",
    webhook_event_type_path: "type",
    webhook_event_id_path: "id",
    webhook_order_id_path: "data.metadata.orderId",
    webhook_payment_id_path: "data.payment.id",
    webhook_success_events: "payment.succeeded",
  };

  for (const [key, value] of Object.entries(credentialEntries)) {
    await prisma.gatewayCredential.upsert({
      where: {
        gatewayId_key: {
          gatewayId: gateway.id,
          key,
        },
      },
      update: {
        valueEncrypted: encryptGatewayCredentialValue(value),
      },
      create: {
        gatewayId: gateway.id,
        key,
        valueEncrypted: encryptGatewayCredentialValue(value),
      },
    });
  }

  const previouslyActive = await prisma.gateway.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const user = await prisma.user.upsert({
    where: { email: "generic-hosted-check@perseus.test" },
    update: { name: "Generic Hosted Check" },
    create: {
      email: "generic-hosted-check@perseus.test",
      name: "Generic Hosted Check",
    },
  });

  const offer = await prisma.offer.findFirst({
    where: {
      courseId: { not: null },
      isPublished: true,
    },
  });

  if (!offer) {
    throw new Error("Generic hosted verification failed: published course offer not found.");
  }

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

    const orderId = session.externalSessionId?.replace("generic:", "");

    if (!orderId || !session.checkoutUrl.includes(orderId)) {
      throw new Error("Generic hosted verification failed: checkout did not return a hosted order redirect.");
    }

    const paymentId = `pay_generic_${Date.now()}`;
    const eventPayload = JSON.stringify({
      id: `evt_generic_${Date.now()}`,
      type: "payment.succeeded",
      data: {
        metadata: {
          orderId,
        },
        payment: {
          id: paymentId,
        },
      },
    });
    const signature = createHmac("sha256", webhookSecret).update(eventPayload).digest("hex");
    const response = await POST(
      new Request(`http://localhost/api/webhooks/${provider}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [signatureHeader]: signature,
        },
        body: eventPayload,
      }),
      {
        params: Promise.resolve({ provider }),
      },
    );

    if (!response.ok) {
      throw new Error(`Generic hosted verification failed: route returned ${response.status} with ${await response.text()}.`);
    }

    const [updatedOrder, payment] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
        },
      }),
      prisma.payment.findFirst({
        where: {
          orderId,
          externalPaymentId: paymentId,
        },
        select: {
          id: true,
          status: true,
          externalPaymentId: true,
        },
      }),
    ]);

    if (!updatedOrder || updatedOrder.status !== OrderStatus.PAID) {
      throw new Error("Generic hosted verification failed: order was not marked PAID after signed webhook.");
    }

    if (!payment || payment.status !== PaymentStatus.SUCCEEDED) {
      throw new Error("Generic hosted verification failed: payment was not marked SUCCEEDED after signed webhook.");
    }

    return {
      ok: true,
      gateway: provider,
      order: updatedOrder,
      payment,
      automatedConfirmation: true,
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

async function verifyContractWithdrawalQueue() {
  const gateway = await prisma.gateway.upsert({
    where: { provider: "withdrawal-queue-check" },
    update: { displayName: "Withdrawal Queue Check", isActive: false, supportsRefunds: true },
    create: {
      provider: "withdrawal-queue-check",
      displayName: "Withdrawal Queue Check",
      kind: "generic_api",
      isNativeAdapter: false,
      isActive: false,
      supportsRefunds: true,
    },
  });
  const owner = await prisma.user.upsert({
    where: { email: "withdrawal-owner@perseus.test" },
    update: { name: "Withdrawal Owner" },
    create: { email: "withdrawal-owner@perseus.test", name: "Withdrawal Owner" },
  });
  const otherUser = await prisma.user.upsert({
    where: { email: "withdrawal-other@perseus.test" },
    update: { name: "Other User" },
    create: { email: "withdrawal-other@perseus.test", name: "Other User" },
  });
  const offer = await prisma.offer.findFirst({
    where: { courseId: { not: null }, isPublished: true },
    select: { id: true, courseId: true },
  });

  if (!offer?.courseId) throw new Error("Withdrawal verification failed: published course offer not found.");

  const order = await createOrder({ offerId: offer.id, userId: owner.id });
  const externalPaymentId = `withdrawal-payment-${Date.now()}`;
  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID } }),
    prisma.payment.create({
      data: {
        orderId: order.id,
        gatewayId: gateway.id,
        status: PaymentStatus.SUCCEEDED,
        amount: order.totalAmount,
        currency: order.currency,
        externalPaymentId,
      },
    }),
  ]);
  await grantCourseAccess({
    userId: owner.id,
    courseIds: [offer.courseId],
    orderId: order.id,
    sourceType: AccessGrantSourceType.ONE_TIME_PURCHASE,
  });

  let ownershipRejected = false;
  try {
    await submitContractWithdrawal({
      orderId: order.id,
      userId: otherUser.id,
      consumerName: "Other User",
      acknowledgementEmail: otherUser.email,
    });
  } catch {
    ownershipRejected = true;
  }

  if (!ownershipRejected) throw new Error("Withdrawal verification failed: another user could withdraw the order.");

  let acknowledged = false;
  const withdrawal = await submitContractWithdrawal(
    {
      orderId: order.id,
      userId: owner.id,
      consumerName: "Withdrawal Owner",
      acknowledgementEmail: owner.email,
    },
    {
      sendAcknowledgement: async () => {
        acknowledged = true;
      },
    },
  );
  const duplicate = await submitContractWithdrawal(
    {
      orderId: order.id,
      userId: owner.id,
      consumerName: "Withdrawal Owner",
      acknowledgementEmail: owner.email,
    },
    { sendAcknowledgement: async () => undefined },
  );
  const expectedDueAt = getRefundDueDate(withdrawal.submittedAt);
  const activeGrantCount = await prisma.courseAccessGrant.count({ where: { orderId: order.id, isActive: true } });

  if (withdrawal.status !== ContractWithdrawalStatus.REFUND_QUEUED) throw new Error("Withdrawal verification failed: refund was not queued.");
  if (!acknowledged || !withdrawal.acknowledgementSentAt) throw new Error("Withdrawal verification failed: acknowledgement evidence was not stored.");
  if (withdrawal.refundDueAt.getTime() !== expectedDueAt.getTime()) throw new Error("Withdrawal verification failed: refund deadline is incorrect.");
  if (duplicate.id !== withdrawal.id) throw new Error("Withdrawal verification failed: duplicate submission created another record.");
  if (activeGrantCount !== 0) throw new Error("Withdrawal verification failed: order-derived access remained active.");

  await handleCanonicalEvent({
    canonicalEvent: "refund.created",
    gatewayId: gateway.id,
    orderId: order.id,
    externalPaymentId,
    payload: { source: "withdrawal-queue-verification", orderId: order.id },
  });

  const [refundedOrder, refundedWithdrawal, refundedPayment] = await Promise.all([
    prisma.order.findUnique({ where: { id: order.id }, select: { status: true } }),
    prisma.contractWithdrawal.findUnique({ where: { id: withdrawal.id }, select: { status: true, refundedAt: true } }),
    prisma.payment.findFirst({ where: { orderId: order.id }, select: { status: true } }),
  ]);

  if (refundedOrder?.status !== OrderStatus.REFUNDED || refundedPayment?.status !== PaymentStatus.REFUNDED) {
    throw new Error("Withdrawal verification failed: canonical refund did not finalize financial state.");
  }
  if (refundedWithdrawal?.status !== ContractWithdrawalStatus.REFUNDED || !refundedWithdrawal.refundedAt) {
    throw new Error("Withdrawal verification failed: canonical refund did not complete the withdrawal.");
  }

  return { ok: true, withdrawalId: withdrawal.id, ownershipRejected, duplicateHandled: true };
}

async function main() {
  const bundlePayment = await verifyBundlePayment();
  const bankTransfer = await verifyBankTransfer();
  const nativeWebhook = await verifyNativeWebhook();
  const genericHostedWebhook = await verifyGenericHostedWebhook();
  const contractWithdrawalQueue = await verifyContractWithdrawalQueue();

  console.log(
    JSON.stringify(
      {
        ok: true,
        bundlePayment,
        bankTransfer,
        nativeWebhook,
        genericHostedWebhook,
        contractWithdrawalQueue,
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

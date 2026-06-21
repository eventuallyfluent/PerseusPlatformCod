import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { getGatewayCredentialMap } from "@/lib/payments/gateway-credential-map";
import { handleCanonicalEvent } from "@/lib/payments/events/handle-canonical-event";
import { parseGenericWebhookEvent, verifyGenericWebhookSignature } from "@/lib/payments/generic-webhook";
import { isUnsupportedPaymentProvider } from "@/lib/payments/provider-policy";

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (isUnsupportedPaymentProvider(provider)) {
    return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
  }
  const rawBody = await request.text();
  const gateway = await prisma.gateway.findUnique({
    where: { provider },
    include: { credentials: true },
  });

  if (!gateway) {
    return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
  }

  const credentials = getGatewayCredentialMap(gateway.credentials);
  const connector = findPaymentConnector(provider);

  const verified = connector
    ? await connector.verifyWebhookSignature({
        headers: request.headers,
        rawBody,
        secret: credentials.webhook_secret ?? credentials.webhook_id ?? "",
      })
    : await verifyGenericWebhookSignature({
        headers: request.headers,
        rawBody,
        credentials,
      });

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;

  try {
    event = connector
      ? await connector.parseWebhookEvent({
          headers: request.headers,
          rawBody,
          secret: credentials.webhook_secret ?? credentials.webhook_id ?? "",
          credentials,
        })
      : parseGenericWebhookEvent({
          rawBody,
          credentials,
        });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook payload could not be parsed.",
      },
      { status: 400 },
    );
  }

  const idempotencyKey = event.providerEventId ?? event.externalEventId;

  if (idempotencyKey) {
    const existing = await prisma.webhookEvent.findFirst({
      where: {
        gatewayId: gateway.id,
        externalEventId: idempotencyKey,
      },
    });

    if (existing?.processedAt) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  let webhookEvent;

  try {
    webhookEvent = await prisma.webhookEvent.create({
      data: {
        gatewayId: gateway.id,
        eventType: event.eventType,
        externalEventId: idempotencyKey,
        canonicalEvent: event.canonicalEvent,
        payload: event.payload as object,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    throw error;
  }

  try {
    await handleCanonicalEvent({
      canonicalEvent: event.canonicalEvent,
      gatewayId: gateway.id,
      externalEventId: idempotencyKey,
      orderId: event.orderId,
      externalPaymentId: event.externalPaymentId,
      externalSubscriptionId: event.externalSubscriptionId,
      payload: event.payload,
    });

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processedAt: new Date(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { getGatewayCredentialMap } from "@/lib/payments/gateway-credential-map";
import { handleCanonicalEvent } from "@/lib/payments/events/handle-canonical-event";

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
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

  if (!connector) {
    return NextResponse.json({ error: "This gateway does not expose an automated webhook handler." }, { status: 400 });
  }
  const verified = await connector.verifyWebhookSignature({
    headers: request.headers,
    rawBody,
    secret: credentials.webhook_secret ?? credentials.webhook_id ?? "",
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = await connector.parseWebhookEvent({
    headers: request.headers,
    rawBody,
  });

  if (event.externalEventId) {
    const existing = await prisma.webhookEvent.findFirst({
      where: {
        gatewayId: gateway.id,
        externalEventId: event.externalEventId,
      },
    });

    if (existing?.processedAt) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      gatewayId: gateway.id,
      eventType: event.eventType,
      externalEventId: event.externalEventId,
      canonicalEvent: event.canonicalEvent,
      payload: event.payload as object,
    },
  });

  await handleCanonicalEvent({
    canonicalEvent: event.canonicalEvent,
    gatewayId: gateway.id,
    externalEventId: event.externalEventId,
    payload: event.payload,
  });

  await prisma.webhookEvent.update({
    where: { id: webhookEvent.id },
    data: {
      processedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

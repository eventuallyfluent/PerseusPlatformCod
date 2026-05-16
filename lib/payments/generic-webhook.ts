import { createHmac, timingSafeEqual } from "node:crypto";
import type { CanonicalPaymentEvent } from "@/types";

type GenericWebhookEvent = {
  providerEventId?: string;
  externalEventId?: string;
  orderId?: string;
  externalPaymentId?: string;
  externalSubscriptionId?: string;
  eventType: string;
  canonicalEvent?: CanonicalPaymentEvent;
  payload: unknown;
};

function getPathValue(input: unknown, path?: string) {
  if (!path || !input || typeof input !== "object") {
    return undefined;
  }

  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, input);
}

function stringFromPath(input: unknown, path?: string) {
  const value = getPathValue(input, path);
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function csv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function mapGenericEvent(eventType: string, credentials: Record<string, string>): CanonicalPaymentEvent | undefined {
  const groups: Array<[CanonicalPaymentEvent, string[]]> = [
    ["payment.succeeded", csv(credentials.webhook_success_events || "payment.succeeded,paid,checkout.completed")],
    ["payment.authorized", csv(credentials.webhook_authorized_events || "payment.authorized,authorized")],
    ["payment.under_review", csv(credentials.webhook_review_events || "payment.under_review,under_review")],
    ["payment.failed", csv(credentials.webhook_failed_events || "payment.failed,failed,checkout.failed")],
    ["subscription.started", csv(credentials.webhook_subscription_started_events || "subscription.started,subscription.active")],
    ["subscription.renewed", csv(credentials.webhook_subscription_renewed_events || "subscription.renewed,subscription.updated")],
    ["subscription.canceled", csv(credentials.webhook_subscription_canceled_events || "subscription.canceled,subscription.cancelled")],
    ["subscription.expired", csv(credentials.webhook_subscription_expired_events || "subscription.expired")],
    ["refund.created", csv(credentials.webhook_refund_events || "refund.created,refunded")],
  ];

  return groups.find(([, events]) => events.includes(eventType))?.[0];
}

export function hasGenericWebhookAutomation(credentials: Record<string, string>) {
  return Boolean(
    credentials.webhook_event_type_path?.trim() &&
      credentials.webhook_order_id_path?.trim() &&
      credentials.webhook_payment_id_path?.trim() &&
      credentials.webhook_success_events?.trim() &&
      credentials.webhook_signature_header?.trim() &&
      credentials.webhook_secret?.trim(),
  );
}

export async function verifyGenericWebhookSignature(input: {
  headers: Headers;
  rawBody: string;
  credentials: Record<string, string>;
}) {
  const headerName = input.credentials.webhook_signature_header;
  const secret = input.credentials.webhook_secret;

  if (!headerName || !secret) {
    return false;
  }

  const received = input.headers.get(headerName);

  if (!received) {
    return false;
  }

  const mode = input.credentials.webhook_signature_mode || "hmac_sha256";

  if (mode === "plain") {
    return safeEqual(received, secret);
  }

  const digest = createHmac("sha256", secret).update(input.rawBody).digest("hex");
  const prefixedDigest = `sha256=${digest}`;

  return safeEqual(received, digest) || safeEqual(received, prefixedDigest);
}

export function parseGenericWebhookEvent(input: {
  rawBody: string;
  credentials: Record<string, string>;
}): GenericWebhookEvent {
  const payload = JSON.parse(input.rawBody) as unknown;
  const eventType = stringFromPath(payload, input.credentials.webhook_event_type_path) ?? "unknown";
  const providerEventId =
    stringFromPath(payload, input.credentials.webhook_event_id_path) ??
    stringFromPath(payload, "id") ??
    stringFromPath(payload, "event_id");
  const externalPaymentId =
    stringFromPath(payload, input.credentials.webhook_payment_id_path) ??
    stringFromPath(payload, "payment.id") ??
    providerEventId;
  const orderId =
    stringFromPath(payload, input.credentials.webhook_order_id_path) ??
    stringFromPath(payload, "metadata.orderId") ??
    stringFromPath(payload, "metadata.order_id");

  return {
    providerEventId,
    externalEventId: providerEventId,
    orderId,
    externalPaymentId,
    externalSubscriptionId: stringFromPath(payload, input.credentials.webhook_subscription_id_path),
    eventType,
    canonicalEvent: mapGenericEvent(eventType, input.credentials),
    payload,
  };
}

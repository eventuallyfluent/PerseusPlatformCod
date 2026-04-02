import type { CanonicalPaymentEvent, PaymentGatewayConnector } from "@/types";

function mapPayPalEvent(eventType: string): CanonicalPaymentEvent | undefined {
  switch (eventType) {
    case "CHECKOUT.ORDER.APPROVED":
      return "payment.succeeded";
    case "PAYMENT.CAPTURE.DENIED":
      return "payment.failed";
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      return "subscription.started";
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      return "subscription.renewed";
    case "PAYMENT.CAPTURE.REFUNDED":
      return "refund.created";
    default:
      return undefined;
  }
}

export const paypalConnector: PaymentGatewayConnector = {
  provider: "paypal",
  displayName: "PayPal",
  credentialFields: [
    { key: "client_id", label: "Client ID", inputType: "text", required: true, secret: false },
    { key: "client_secret", label: "Client Secret", inputType: "password", required: true, secret: true },
    { key: "webhook_id", label: "Webhook ID", inputType: "text", required: true, secret: false },
  ],
  capabilities: {
    supportsSubscriptions: true,
    supportsRefunds: true,
    supportsPaymentPlans: false,
    supportsHostedCheckout: true,
  },
  async createCheckoutSession() {
    throw new Error("PayPal connector is registered but requires live API credentials for checkout");
  },
  async testConnection() {
    throw new Error("PayPal connection testing requires live API credentials");
  },
  getWebhookInstructions() {
    return "Create a PayPal webhook endpoint at /api/webhooks/paypal and subscribe to order, capture, refund, and subscription lifecycle events.";
  },
  async verifyWebhookSignature({ headers, rawBody, secret }) {
    return Boolean(headers.get("paypal-transmission-id") && rawBody && secret);
  },
  async parseWebhookEvent({ rawBody }) {
    const event = JSON.parse(rawBody) as { id?: string; event_type?: string };

    return {
      externalEventId: event.id,
      eventType: event.event_type ?? "unknown",
      canonicalEvent: mapPayPalEvent(event.event_type ?? ""),
      payload: event,
    };
  },
};

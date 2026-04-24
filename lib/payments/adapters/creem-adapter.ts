import type { CanonicalPaymentEvent, PaymentGatewayConnector } from "@/types";

function mapCreemEvent(eventType: string): CanonicalPaymentEvent | undefined {
  switch (eventType) {
    case "payment.succeeded":
      return "payment.succeeded";
    case "payment.failed":
      return "payment.failed";
    case "subscription.started":
      return "subscription.started";
    case "subscription.renewed":
      return "subscription.renewed";
    case "refund.created":
      return "refund.created";
    default:
      return undefined;
  }
}

export const creemConnector: PaymentGatewayConnector = {
  provider: "creem",
  displayName: "Creem",
  isCheckoutImplemented: false,
  credentialFields: [
    { key: "api_key", label: "API Key", inputType: "password", required: true, secret: true },
    { key: "webhook_secret", label: "Webhook Secret", inputType: "password", required: true, secret: true },
  ],
  capabilities: {
    supportsSubscriptions: true,
    supportsRefunds: true,
    supportsPaymentPlans: true,
    supportsHostedCheckout: true,
    checkoutModel: "hosted_redirect",
    taxModel: "merchant_of_record",
    settlementBehavior: "asynchronous",
    supportsTaxCalculation: false,
    supportsHostedTaxCollection: true,
    taxRequiresExternalConfiguration: false,
    actsAsMerchantOfRecord: true,
    requiresBillingAddress: true,
    requiresShippingAddress: false,
    requiresBusinessIdentity: false,
    mayRequireManualReview: true,
    suitableForHighRisk: true,
    supportsManualConfirmation: false,
  },
  async createCheckoutSession() {
    throw new Error("Creem connector is registered but requires live API credentials for checkout");
  },
  async testConnection() {
    throw new Error("Creem connection testing requires live API credentials");
  },
  getWebhookInstructions() {
    return "Create a Creem webhook endpoint at /api/webhooks/creem and subscribe to payment, refund, and subscription events.";
  },
  async verifyWebhookSignature({ headers, rawBody, secret }) {
    return Boolean(headers.get("x-creem-signature") && rawBody && secret);
  },
  async parseWebhookEvent({ rawBody }) {
    const event = JSON.parse(rawBody) as { id?: string; type?: string };

    return {
      externalEventId: event.id,
      eventType: event.type ?? "unknown",
      canonicalEvent: mapCreemEvent(event.type ?? ""),
      payload: event,
    };
  },
};

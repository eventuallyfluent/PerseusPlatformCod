import Stripe from "stripe";
import { getOfferById } from "@/lib/offers/get-offer-by-id";
import { getStripeConfig } from "@/lib/payments/stripe-config";
import type { CanonicalPaymentEvent, PaymentGatewayConnector } from "@/types";

async function getStripeClient() {
  const { secretKey } = await getStripeConfig();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
  });
}

function getStripeWebhookClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
    apiVersion: "2025-08-27.basil",
  });
}

function mapStripeEvent(eventType: string): CanonicalPaymentEvent | undefined {
  switch (eventType) {
    case "checkout.session.completed":
      return "payment.succeeded";
    case "checkout.session.async_payment_failed":
    case "payment_intent.payment_failed":
      return "payment.failed";
    case "customer.subscription.created":
      return "subscription.started";
    case "customer.subscription.updated":
      return "subscription.renewed";
    case "charge.refunded":
      return "refund.created";
    default:
      return undefined;
  }
}

export const stripeConnector: PaymentGatewayConnector = {
  provider: "stripe",
  displayName: "Stripe",
  credentialFields: [
    { key: "api_key", label: "API Key", inputType: "password", required: true, secret: true },
    { key: "webhook_secret", label: "Webhook Secret", inputType: "password", required: true, secret: true },
  ],
  capabilities: {
    supportsSubscriptions: true,
    supportsRefunds: true,
    supportsPaymentPlans: false,
    supportsHostedCheckout: true,
    checkoutModel: "hosted_redirect",
    taxModel: "gateway_tax_engine",
    settlementBehavior: "asynchronous",
    supportsTaxCalculation: true,
    supportsHostedTaxCollection: true,
    taxRequiresExternalConfiguration: true,
    actsAsMerchantOfRecord: false,
    requiresBillingAddress: true,
    requiresShippingAddress: false,
    requiresBusinessIdentity: false,
    mayRequireManualReview: false,
    suitableForHighRisk: false,
    supportsManualConfirmation: false,
  },
  async createCheckoutSession(input) {
    const stripe = await getStripeClient();
    const offer = await getOfferById(input.offerId);

    if (!offer) {
      throw new Error("Offer not found");
    }

    const productTitle = offer.course?.title ?? offer.bundle?.title ?? "Perseus Product";
    const session = await stripe.checkout.sessions.create({
      mode: offer.type === "SUBSCRIPTION" ? "subscription" : "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: offer.currency.toLowerCase(),
            product_data: {
              name: `${productTitle} | ${offer.name}`,
            },
            unit_amount: Math.round((input.amountOverride ?? Number(offer.price)) * 100),
            recurring: offer.type === "SUBSCRIPTION" ? { interval: "month" } : undefined,
          },
        },
      ],
      metadata: {
        offerId: input.offerId,
        orderId: input.orderId,
        ...input.metadata,
      },
    });

    if (!session.url) {
      throw new Error("Stripe checkout session did not return a URL");
    }

    return {
      checkoutUrl: session.url,
      externalSessionId: session.id,
    };
  },
  async testConnection() {
    const stripe = await getStripeClient();
    await stripe.accounts.retrieve();

    return {
      ok: true,
      provider: "stripe",
      webhookInstructions: "Create a Stripe webhook endpoint at /api/webhooks/stripe with checkout and subscription events.",
    };
  },
  getWebhookInstructions() {
    return "Create a Stripe webhook endpoint at /api/webhooks/stripe with checkout, payment, refund, and subscription events.";
  },
  async verifyWebhookSignature({ headers, rawBody, secret }) {
    const signature = headers.get("stripe-signature");
    if (!signature) {
      return false;
    }

    try {
      const stripe = getStripeWebhookClient();
      stripe.webhooks.constructEvent(rawBody, signature, secret);
      return true;
    } catch {
      return false;
    }
  },
  async parseWebhookEvent({ headers, rawBody, secret }) {
    const signature = headers.get("stripe-signature");
    const resolvedSecret = secret || (await getStripeConfig()).webhookSecret;

    if (!signature || !resolvedSecret) {
      throw new Error("Missing Stripe webhook configuration");
    }

    const stripe = getStripeWebhookClient();
    const event = stripe.webhooks.constructEvent(rawBody, signature, resolvedSecret);

    return {
      externalEventId: event.id,
      eventType: event.type,
      canonicalEvent: mapStripeEvent(event.type),
      payload: event,
    };
  },
};

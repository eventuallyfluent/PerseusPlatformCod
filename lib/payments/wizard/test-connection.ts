import Stripe from "stripe";

export async function testGatewayConnection(input: { provider: string; apiKey: string }) {
  if (input.provider === "stripe") {
    const stripe = new Stripe(input.apiKey, {
      apiVersion: "2025-08-27.basil",
    });

    await stripe.accounts.retrieve();

    return {
      ok: true,
      provider: "stripe",
      webhookInstructions: "Create a Stripe webhook endpoint pointing to /api/webhooks/stripe with checkout and subscription events.",
    };
  }

  throw new Error(`No gateway test handler registered for ${input.provider}`);
}

import type { PaymentGatewayConnector } from "@/types";
import { stripeConnector } from "@/lib/payments/adapters/stripe-adapter";
import { paypalConnector } from "@/lib/payments/adapters/paypal-adapter";
import { creemConnector } from "@/lib/payments/adapters/creem-adapter";

const connectors = new Map<string, PaymentGatewayConnector>([
  ["stripe", stripeConnector],
  ["paypal", paypalConnector],
  ["creem", creemConnector],
]);

export function findPaymentConnector(provider: string) {
  return connectors.get(provider) ?? null;
}

export function getPaymentConnector(provider: string) {
  const adapter = findPaymentConnector(provider);

  if (!adapter) {
    throw new Error(`No adapter registered for ${provider}`);
  }

  return adapter;
}

export function listPaymentConnectors() {
  return Array.from(connectors.values());
}

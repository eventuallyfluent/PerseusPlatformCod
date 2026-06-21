export const UNSUPPORTED_PAYMENT_PROVIDERS = ["stripe"] as const;
const unsupportedPaymentProviders = new Set<string>(UNSUPPORTED_PAYMENT_PROVIDERS);

export function isUnsupportedPaymentProvider(provider: string) {
  return unsupportedPaymentProviders.has(provider.trim().toLowerCase());
}

export function assertSupportedPaymentProvider(provider: string) {
  if (isUnsupportedPaymentProvider(provider)) {
    throw new Error("This payment provider is not supported by Perseus.");
  }
}

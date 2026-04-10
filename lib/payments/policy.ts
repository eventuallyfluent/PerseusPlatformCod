import type { GatewayCapabilities, GatewayPolicyEvaluation } from "@/types";

export type CommercePolicy = {
  requireTaxCapableGateway: boolean;
  allowUnsupportedGatewayCheckout: boolean;
  preferMerchantOfRecord: boolean;
};

export function getCommercePolicy(): CommercePolicy {
  return {
    requireTaxCapableGateway: true,
    allowUnsupportedGatewayCheckout: false,
    preferMerchantOfRecord: true,
  };
}

export function evaluateGatewayPolicy(capabilities: GatewayCapabilities): GatewayPolicyEvaluation {
  const policy = getCommercePolicy();

  if (capabilities.actsAsMerchantOfRecord) {
    return {
      allowed: true,
      tone: "success",
      heading: "Preferred tax/compliance path",
      detail: "This gateway is treated as Merchant of Record, so tax and compliance responsibility can stay with the provider.",
    };
  }

  if (capabilities.taxModel === "gateway_tax_engine") {
    return {
      allowed: true,
      tone: capabilities.taxRequiresExternalConfiguration ? "warning" : "success",
      heading: capabilities.taxRequiresExternalConfiguration ? "Tax-capable gateway with setup required" : "Tax-capable gateway",
      detail: capabilities.taxRequiresExternalConfiguration
        ? "This gateway can support tax handling, but only after external/operator configuration. It should not be assumed tax-ready by default."
        : "This gateway can calculate and collect tax through its own tax engine.",
    };
  }

  if (capabilities.taxModel === "external_tax_service") {
    return {
      allowed: true,
      tone: "warning",
      heading: "External tax service required",
      detail: "This gateway can be used, but tax handling must come from the platform or an external tax service before final payment execution.",
    };
  }

  if (policy.requireTaxCapableGateway && !policy.allowUnsupportedGatewayCheckout) {
    return {
      allowed: false,
      tone: "danger",
      heading: "Tax handling not supported",
      detail: "This gateway does not provide a tax-capable path for the current platform policy, so checkout should be blocked until a compliant gateway is active.",
    };
  }

  return {
    allowed: true,
    tone: "warning",
    heading: "Tax handling is incomplete",
    detail: "This gateway can process payment, but tax handling is not provided by the gateway and must be handled separately.",
  };
}

export function summarizeGatewayCapabilities(capabilities: GatewayCapabilities) {
  return [
    capabilities.supportsHostedCheckout ? "Hosted checkout" : null,
    capabilities.supportsManualConfirmation ? "Manual confirmation" : null,
    capabilities.supportsSubscriptions ? "Subscriptions" : null,
    capabilities.supportsRefunds ? "Refunds" : null,
    capabilities.supportsPaymentPlans ? "Payment plans" : null,
    capabilities.suitableForHighRisk ? "High-risk ready" : null,
  ]
    .filter(Boolean)
    .join(", ");
}

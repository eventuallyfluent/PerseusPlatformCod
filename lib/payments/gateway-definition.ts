import type { Gateway } from "@prisma/client";
import type {
  GatewayCapabilities,
  GatewayCheckoutModel,
  GatewayKind,
  GatewaySettlementBehavior,
  GatewayTaxModel,
  PaymentGatewayConnector,
  ResolvedGatewayDefinition,
} from "@/types";

type GatewayRecord = Pick<
  Gateway,
  | "id"
  | "provider"
  | "displayName"
  | "kind"
  | "isNativeAdapter"
  | "isActive"
  | "checkoutModel"
  | "taxModel"
  | "settlementBehavior"
  | "supportsSubscriptions"
  | "supportsRefunds"
  | "supportsPaymentPlans"
  | "supportsHostedCheckout"
  | "supportsTaxCalculation"
  | "supportsHostedTaxCollection"
  | "taxRequiresExternalConfiguration"
  | "actsAsMerchantOfRecord"
  | "requiresBillingAddress"
  | "requiresShippingAddress"
  | "requiresBusinessIdentity"
  | "mayRequireManualReview"
  | "supportsManualConfirmation"
  | "suitableForHighRisk"
  | "checkoutUrlTemplate"
  | "instructionsMarkdown"
  | "webhookInstructions"
>;

function normalizeCheckoutModel(value: string): GatewayCheckoutModel {
  if (value === "embedded_hosted_form" || value === "direct_api" || value === "manual_instructions") {
    return value;
  }

  return "hosted_redirect";
}

function normalizeTaxModel(value: string): GatewayTaxModel {
  if (value === "merchant_of_record" || value === "gateway_tax_engine" || value === "external_tax_service") {
    return value;
  }

  return "unsupported";
}

function normalizeSettlementBehavior(value: string): GatewaySettlementBehavior {
  if (value === "asynchronous" || value === "manual_review_possible" || value === "manual_confirmation") {
    return value;
  }

  return "instant";
}

function normalizeKind(value: string): GatewayKind {
  if (value === "generic_api" || value === "bank_transfer") {
    return value;
  }

  return "native";
}

function getStoredCapabilities(gateway: GatewayRecord): GatewayCapabilities {
  return {
    supportsSubscriptions: gateway.supportsSubscriptions,
    supportsRefunds: gateway.supportsRefunds,
    supportsPaymentPlans: gateway.supportsPaymentPlans,
    supportsHostedCheckout: gateway.supportsHostedCheckout,
    checkoutModel: normalizeCheckoutModel(gateway.checkoutModel),
    taxModel: normalizeTaxModel(gateway.taxModel),
    settlementBehavior: normalizeSettlementBehavior(gateway.settlementBehavior),
    supportsTaxCalculation: gateway.supportsTaxCalculation,
    supportsHostedTaxCollection: gateway.supportsHostedTaxCollection,
    taxRequiresExternalConfiguration: gateway.taxRequiresExternalConfiguration,
    actsAsMerchantOfRecord: gateway.actsAsMerchantOfRecord,
    requiresBillingAddress: gateway.requiresBillingAddress,
    requiresShippingAddress: gateway.requiresShippingAddress,
    requiresBusinessIdentity: gateway.requiresBusinessIdentity,
    mayRequireManualReview: gateway.mayRequireManualReview,
    suitableForHighRisk: gateway.suitableForHighRisk,
    supportsManualConfirmation: gateway.supportsManualConfirmation,
  };
}

export function resolveGatewayDefinition(gateway: GatewayRecord, connector?: PaymentGatewayConnector | null): ResolvedGatewayDefinition {
  const kind = normalizeKind(gateway.kind);
  const capabilities = kind === "native" && connector ? connector.capabilities : getStoredCapabilities(gateway);

  return {
    id: gateway.id,
    provider: gateway.provider,
    displayName: gateway.displayName,
    kind,
    isActive: gateway.isActive,
    isNativeAdapter: gateway.isNativeAdapter,
    checkoutModel: capabilities.checkoutModel,
    taxModel: capabilities.taxModel,
    settlementBehavior: capabilities.settlementBehavior,
    checkoutUrlTemplate: gateway.checkoutUrlTemplate,
    instructionsMarkdown: gateway.instructionsMarkdown,
    webhookInstructions: gateway.webhookInstructions,
    capabilities,
  };
}

export function getGatewayCredentialLines(credentials: Array<{ key: string; value: string }>) {
  return credentials.map((credential) => `${credential.key}=${credential.value}`).join("\n");
}

import { prisma } from "@/lib/db/prisma";

export type GatewayCompatRecord = {
  id: string;
  provider: string;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  kind: string;
  isNativeAdapter: boolean;
  checkoutModel: string;
  taxModel: string;
  settlementBehavior: string;
  supportsSubscriptions: boolean;
  supportsRefunds: boolean;
  supportsPaymentPlans: boolean;
  supportsHostedCheckout: boolean;
  supportsTaxCalculation: boolean;
  supportsHostedTaxCollection: boolean;
  taxRequiresExternalConfiguration: boolean;
  actsAsMerchantOfRecord: boolean;
  requiresBillingAddress: boolean;
  requiresShippingAddress: boolean;
  requiresBusinessIdentity: boolean;
  mayRequireManualReview: boolean;
  supportsManualConfirmation: boolean;
  suitableForHighRisk: boolean;
  checkoutUrlTemplate: string | null;
  instructionsMarkdown: string | null;
  webhookInstructions: string | null;
  credentials: Array<{
    id: string;
    key: string;
    valueEncrypted: string;
    createdAt: Date;
    updatedAt: Date;
    gatewayId: string;
  }>;
  webhookEvents: Array<{
    id: string;
    gatewayId: string;
    eventType: string;
    externalEventId: string | null;
    canonicalEvent: string | null;
    payload: unknown;
    processedAt: Date | null;
    createdAt: Date;
  }>;
  schemaCompatMode: "current" | "legacy";
};

function withGatewayDefaults<T extends { id: string; provider: string; displayName: string; isActive: boolean; createdAt: Date; updatedAt: Date; credentials: GatewayCompatRecord["credentials"]; webhookEvents: GatewayCompatRecord["webhookEvents"] }>(
  gateway: T,
  schemaCompatMode: "current" | "legacy",
): GatewayCompatRecord {
  return {
    ...gateway,
    description: "description" in gateway ? (gateway.description as string | null) : null,
    kind: "kind" in gateway ? (gateway.kind as string) : "native",
    isNativeAdapter: "isNativeAdapter" in gateway ? (gateway.isNativeAdapter as boolean) : true,
    checkoutModel: "checkoutModel" in gateway ? (gateway.checkoutModel as string) : "hosted_redirect",
    taxModel: "taxModel" in gateway ? (gateway.taxModel as string) : "external_tax_service",
    settlementBehavior: "settlementBehavior" in gateway ? (gateway.settlementBehavior as string) : "asynchronous",
    supportsSubscriptions: "supportsSubscriptions" in gateway ? (gateway.supportsSubscriptions as boolean) : false,
    supportsRefunds: "supportsRefunds" in gateway ? (gateway.supportsRefunds as boolean) : false,
    supportsPaymentPlans: "supportsPaymentPlans" in gateway ? (gateway.supportsPaymentPlans as boolean) : false,
    supportsHostedCheckout: "supportsHostedCheckout" in gateway ? (gateway.supportsHostedCheckout as boolean) : false,
    supportsTaxCalculation: "supportsTaxCalculation" in gateway ? (gateway.supportsTaxCalculation as boolean) : false,
    supportsHostedTaxCollection: "supportsHostedTaxCollection" in gateway ? (gateway.supportsHostedTaxCollection as boolean) : false,
    taxRequiresExternalConfiguration: "taxRequiresExternalConfiguration" in gateway ? (gateway.taxRequiresExternalConfiguration as boolean) : true,
    actsAsMerchantOfRecord: "actsAsMerchantOfRecord" in gateway ? (gateway.actsAsMerchantOfRecord as boolean) : false,
    requiresBillingAddress: "requiresBillingAddress" in gateway ? (gateway.requiresBillingAddress as boolean) : false,
    requiresShippingAddress: "requiresShippingAddress" in gateway ? (gateway.requiresShippingAddress as boolean) : false,
    requiresBusinessIdentity: "requiresBusinessIdentity" in gateway ? (gateway.requiresBusinessIdentity as boolean) : false,
    mayRequireManualReview: "mayRequireManualReview" in gateway ? (gateway.mayRequireManualReview as boolean) : false,
    supportsManualConfirmation: "supportsManualConfirmation" in gateway ? (gateway.supportsManualConfirmation as boolean) : false,
    suitableForHighRisk: "suitableForHighRisk" in gateway ? (gateway.suitableForHighRisk as boolean) : false,
    checkoutUrlTemplate: "checkoutUrlTemplate" in gateway ? (gateway.checkoutUrlTemplate as string | null) : null,
    instructionsMarkdown: "instructionsMarkdown" in gateway ? (gateway.instructionsMarkdown as string | null) : null,
    webhookInstructions: "webhookInstructions" in gateway ? (gateway.webhookInstructions as string | null) : null,
    schemaCompatMode,
  };
}

export async function listGatewayRecords() {
  try {
    const gateways = await prisma.gateway.findMany({
      include: { credentials: true, webhookEvents: true },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });

    return gateways.map((gateway) => withGatewayDefaults(gateway, "current"));
  } catch {
    const gateways = await prisma.gateway.findMany({
      select: {
        id: true,
        provider: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        credentials: true,
        webhookEvents: true,
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });

    return gateways.map((gateway) => withGatewayDefaults(gateway, "legacy"));
  }
}

export async function getGatewayRecordById(id: string) {
  try {
    const gateway = await prisma.gateway.findUnique({
      where: { id },
      include: { credentials: true, webhookEvents: true },
    });

    return gateway ? withGatewayDefaults(gateway, "current") : null;
  } catch {
    const gateway = await prisma.gateway.findUnique({
      where: { id },
      select: {
        id: true,
        provider: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        credentials: true,
        webhookEvents: true,
      },
    });

    return gateway ? withGatewayDefaults(gateway, "legacy") : null;
  }
}

export async function getActiveGatewayRecord() {
  try {
    const gateway = await prisma.gateway.findFirst({
      where: { isActive: true },
      include: { credentials: true },
      orderBy: { updatedAt: "desc" },
    });

    return gateway ? withGatewayDefaults({ ...gateway, webhookEvents: [] }, "current") : null;
  } catch {
    const gateway = await prisma.gateway.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        provider: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        credentials: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return gateway ? withGatewayDefaults({ ...gateway, webhookEvents: [] }, "legacy") : null;
  }
}

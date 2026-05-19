import type { GatewayCompatRecord } from "@/lib/payments/gateway-queries";
import type { GatewayOperationalIssue, GatewayOperationalReadiness, PaymentGatewayConnector, ResolvedGatewayDefinition } from "@/types";
import { evaluateGatewayPolicy } from "@/lib/payments/policy";
import { hasGenericWebhookAutomation } from "@/lib/payments/generic-webhook";
import { hasSpecificBankTransferInstructions } from "@/lib/payments/bank-transfer-instructions";

export function evaluateGatewayOperationalReadiness(input: {
  gateway: GatewayCompatRecord;
  definition: ResolvedGatewayDefinition;
  connector?: PaymentGatewayConnector | null;
  credentials?: Record<string, string>;
}): GatewayOperationalReadiness {
  const { gateway, definition, connector } = input;
  const credentials =
    input.credentials ??
    Object.fromEntries(
      gateway.credentials.map((credential) => [
        credential.key,
        credential.valueEncrypted,
      ]),
    );
  const issues: GatewayOperationalIssue[] = [];
  const policy = evaluateGatewayPolicy(definition.capabilities);

  if (!gateway.isActive) {
    issues.push({
      tone: "warning",
      label: "Inactive gateway",
      detail: "This profile will not be used for checkout until it is marked active.",
    });
  }

  if (!policy.allowed) {
    issues.push({
      tone: "danger",
      label: policy.heading,
      detail: policy.detail,
    });
  }

  if (connector) {
    if (!connector.isCheckoutImplemented) {
      issues.push({
        tone: "danger",
        label: "Native checkout not implemented",
        detail: `${connector.displayName} is registered for capability modeling and webhook parsing, but live checkout creation is not implemented yet. Use bank transfer, a configured generic redirect profile, or another implemented fallback for real purchases.`,
      });
    }

    const missingRequiredCredentials = connector.credentialFields
      .filter((field) => field.required && !String(credentials[field.key] ?? "").trim())
      .map((field) => field.label);

    if (missingRequiredCredentials.length > 0) {
      issues.push({
        tone: "danger",
        label: "Missing native credentials",
        detail: `Add ${missingRequiredCredentials.join(", ")} before using this gateway live.`,
      });
    }

    const webhookCredentialField = connector.credentialFields.find((field) => field.key === "webhook_secret" || field.key === "webhook_id");
    if (webhookCredentialField && !String(credentials[webhookCredentialField.key] ?? "").trim()) {
      issues.push({
        tone: "warning",
        label: "Webhook automation not configured",
        detail: `Add ${webhookCredentialField.label} so automated payment updates can be verified and processed.`,
      });
    }
  } else if (definition.kind === "generic_api") {
    if (!gateway.checkoutUrlTemplate?.trim() && definition.checkoutModel !== "manual_instructions") {
      issues.push({
        tone: "danger",
        label: "Checkout path missing",
        detail: "Add a hosted checkout URL template before using this gateway for live redirects.",
      });
    }

    if (definition.checkoutModel === "manual_instructions") {
      issues.push({
        tone: "danger",
        label: "Manual checkout is not online checkout",
        detail: "Generic payment profiles must use automated hosted checkout plus verified webhook confirmation. Manual confirmation is only acceptable for bank transfer.",
      });
    }

    if (!hasGenericWebhookAutomation(credentials)) {
      issues.push({
        tone: "danger",
        label: "Automated confirmation missing",
        detail:
          "Hosted gateways must define signed webhook settings in credentials: webhook_signature_header, webhook_secret, webhook_event_type_path, webhook_order_id_path, webhook_payment_id_path, and webhook_success_events.",
      });
    }

    if (gateway.credentials.length === 0) {
      issues.push({
        tone: "warning",
        label: "Credentials not documented",
        detail: "Store API and webhook credential keys so checkout can be verified automatically.",
      });
    }

    if (!gateway.webhookInstructions?.trim()) {
      issues.push({
        tone: "warning",
        label: "Webhook steps missing",
        detail: "Add provider-side webhook setup notes so automated payment confirmation can be reproduced.",
      });
    }
  } else if (definition.kind === "bank_transfer") {
    if (!hasSpecificBankTransferInstructions(gateway.instructionsMarkdown)) {
      issues.push({
        tone: "danger",
        label: "Real transfer details missing",
        detail: "Add real bank-transfer details such as account name, bank name, account number/IBAN/SWIFT/routing details, and the required order reference before using this gateway live.",
      });
    }
  }

  const hasBlockingIssue = issues.some((issue) => issue.tone === "danger");
  const hasAttentionIssue = issues.some((issue) => issue.tone === "warning");

  return {
    status: hasBlockingIssue ? "blocked" : hasAttentionIssue ? "attention" : "ready",
    heading: hasBlockingIssue
      ? "Checkout not ready"
      : hasAttentionIssue
        ? "Operator setup still required"
        : "Ready for live checkout",
    detail: hasBlockingIssue
      ? "One or more blocking setup issues still prevent this gateway from being used safely."
      : hasAttentionIssue
        ? "This gateway can be used, but it still needs operator setup documentation or monitoring."
        : "This gateway has a usable checkout path and no obvious blocking setup gaps.",
    canRunCheckout: gateway.isActive && policy.allowed && !hasBlockingIssue,
    webhookMode: connector || (definition.kind === "generic_api" && hasGenericWebhookAutomation(credentials)) ? "automated" : definition.kind === "bank_transfer" ? "manual" : "unavailable",
    issues,
  };
}

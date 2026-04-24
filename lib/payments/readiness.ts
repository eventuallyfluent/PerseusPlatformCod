import type { GatewayCompatRecord } from "@/lib/payments/gateway-queries";
import type { GatewayOperationalIssue, GatewayOperationalReadiness, PaymentGatewayConnector, ResolvedGatewayDefinition } from "@/types";
import { evaluateGatewayPolicy } from "@/lib/payments/policy";

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

    if (gateway.credentials.length === 0) {
      issues.push({
        tone: "warning",
        label: "Credentials not documented",
        detail: "Store the gateway credential keys or notes here so the operator path is complete.",
      });
    }

    if (!gateway.webhookInstructions?.trim()) {
      issues.push({
        tone: "warning",
        label: "Webhook steps missing",
        detail: "Add provider-side webhook instructions or plan to confirm payments manually.",
      });
    }
  } else if (definition.kind === "bank_transfer" && !gateway.instructionsMarkdown?.trim()) {
    issues.push({
      tone: "warning",
      label: "Transfer instructions still generic",
      detail: "Replace the fallback wording with the real bank details and matching instructions.",
    });
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
        ? "This gateway can be used, but it still needs operator setup or manual handling."
        : "This gateway has a usable checkout path and no obvious blocking setup gaps.",
    canRunCheckout: gateway.isActive && policy.allowed && !hasBlockingIssue,
    webhookMode: connector ? "automated" : definition.kind === "bank_transfer" ? "manual" : "unavailable",
    issues,
  };
}

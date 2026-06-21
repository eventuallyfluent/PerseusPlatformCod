DELETE FROM "GatewayCredential"
USING "Gateway"
WHERE "GatewayCredential"."gatewayId" = "Gateway"."id"
  AND "Gateway"."provider" = 'stripe';

UPDATE "Gateway"
SET
  "isActive" = false,
  "supportsSubscriptions" = false,
  "supportsRefunds" = false,
  "supportsPaymentPlans" = false,
  "supportsHostedCheckout" = false,
  "supportsTaxCalculation" = false,
  "supportsHostedTaxCollection" = false,
  "webhookInstructions" = NULL,
  "checkoutUrlTemplate" = NULL,
  "instructionsMarkdown" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "provider" = 'stripe';

DELETE FROM "Gateway"
WHERE "provider" = 'stripe'
  AND NOT EXISTS (SELECT 1 FROM "Payment" WHERE "Payment"."gatewayId" = "Gateway"."id")
  AND NOT EXISTS (SELECT 1 FROM "Subscription" WHERE "Subscription"."gatewayId" = "Gateway"."id")
  AND NOT EXISTS (SELECT 1 FROM "WebhookEvent" WHERE "WebhookEvent"."gatewayId" = "Gateway"."id");

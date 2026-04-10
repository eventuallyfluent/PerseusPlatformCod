ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_BANK_TRANSFER';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'AUTHORIZED';

ALTER TABLE "Gateway"
ADD COLUMN "description" TEXT,
ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'native',
ADD COLUMN "isNativeAdapter" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "checkoutModel" TEXT NOT NULL DEFAULT 'hosted_redirect',
ADD COLUMN "taxModel" TEXT NOT NULL DEFAULT 'external_tax_service',
ADD COLUMN "settlementBehavior" TEXT NOT NULL DEFAULT 'asynchronous',
ADD COLUMN "supportsSubscriptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supportsRefunds" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supportsPaymentPlans" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supportsHostedCheckout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supportsTaxCalculation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supportsHostedTaxCollection" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "taxRequiresExternalConfiguration" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "actsAsMerchantOfRecord" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requiresBillingAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requiresShippingAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requiresBusinessIdentity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mayRequireManualReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supportsManualConfirmation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "suitableForHighRisk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "checkoutUrlTemplate" TEXT,
ADD COLUMN "instructionsMarkdown" TEXT,
ADD COLUMN "webhookInstructions" TEXT;

UPDATE "Gateway"
SET
  "kind" = 'native',
  "isNativeAdapter" = true;

UPDATE "Gateway"
SET
  "checkoutModel" = 'hosted_redirect',
  "taxModel" = 'gateway_tax_engine',
  "settlementBehavior" = 'asynchronous',
  "supportsSubscriptions" = true,
  "supportsRefunds" = true,
  "supportsHostedCheckout" = true,
  "supportsTaxCalculation" = true,
  "supportsHostedTaxCollection" = true,
  "taxRequiresExternalConfiguration" = true,
  "requiresBillingAddress" = true,
  "mayRequireManualReview" = false,
  "suitableForHighRisk" = false
WHERE "provider" = 'stripe';

UPDATE "Gateway"
SET
  "checkoutModel" = 'hosted_redirect',
  "taxModel" = 'unsupported',
  "settlementBehavior" = 'asynchronous',
  "supportsSubscriptions" = true,
  "supportsRefunds" = true,
  "supportsHostedCheckout" = true,
  "supportsTaxCalculation" = false,
  "supportsHostedTaxCollection" = false,
  "taxRequiresExternalConfiguration" = true,
  "requiresBillingAddress" = true,
  "mayRequireManualReview" = false,
  "suitableForHighRisk" = false
WHERE "provider" = 'paypal';

UPDATE "Gateway"
SET
  "checkoutModel" = 'hosted_redirect',
  "taxModel" = 'merchant_of_record',
  "settlementBehavior" = 'asynchronous',
  "supportsSubscriptions" = true,
  "supportsRefunds" = true,
  "supportsPaymentPlans" = true,
  "supportsHostedCheckout" = true,
  "supportsTaxCalculation" = false,
  "supportsHostedTaxCollection" = true,
  "taxRequiresExternalConfiguration" = false,
  "actsAsMerchantOfRecord" = true,
  "requiresBillingAddress" = true,
  "mayRequireManualReview" = true,
  "supportsManualConfirmation" = false,
  "suitableForHighRisk" = true
WHERE "provider" = 'creem';

CREATE TYPE "ContractWithdrawalStatus" AS ENUM (
  'REFUND_QUEUED',
  'REFUND_PROCESSING',
  'REFUNDED',
  'REFUND_FAILED'
);

CREATE TABLE "ContractWithdrawal" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ContractWithdrawalStatus" NOT NULL DEFAULT 'REFUND_QUEUED',
  "consumerName" TEXT NOT NULL,
  "acknowledgementEmail" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "refundDueAt" TIMESTAMP(3) NOT NULL,
  "acknowledgementSentAt" TIMESTAMP(3),
  "acknowledgementError" TEXT,
  "refundInitiatedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "externalRefundId" TEXT,
  "processingError" TEXT,
  "reconciledAt" TIMESTAMP(3),
  "reconciledByEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContractWithdrawal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContractWithdrawal_orderId_key" ON "ContractWithdrawal"("orderId");
CREATE INDEX "ContractWithdrawal_userId_submittedAt_idx" ON "ContractWithdrawal"("userId", "submittedAt");
CREATE INDEX "ContractWithdrawal_status_submittedAt_idx" ON "ContractWithdrawal"("status", "submittedAt");

ALTER TABLE "ContractWithdrawal"
  ADD CONSTRAINT "ContractWithdrawal_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractWithdrawal"
  ADD CONSTRAINT "ContractWithdrawal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

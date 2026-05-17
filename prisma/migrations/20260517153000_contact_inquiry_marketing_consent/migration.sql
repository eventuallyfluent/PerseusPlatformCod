ALTER TABLE "ContactInquiry"
ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketingConsentAt" TIMESTAMP(3),
ADD COLUMN "marketingConsentSource" TEXT;

CREATE INDEX "ContactInquiry_marketingConsent_createdAt_idx" ON "ContactInquiry"("marketingConsent", "createdAt");

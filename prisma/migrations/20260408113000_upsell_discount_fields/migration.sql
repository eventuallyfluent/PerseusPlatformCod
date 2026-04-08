CREATE TYPE "UpsellDiscountType" AS ENUM ('NONE', 'AMOUNT', 'PERCENT');

ALTER TABLE "Course"
ADD COLUMN "upsellDiscountType" "UpsellDiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "upsellDiscountValue" DECIMAL(10,2),
ADD COLUMN "upsellHeadline" TEXT,
ADD COLUMN "upsellBody" TEXT;

ALTER TABLE "Bundle"
ADD COLUMN "upsellDiscountType" "UpsellDiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "upsellDiscountValue" DECIMAL(10,2),
ADD COLUMN "upsellHeadline" TEXT,
ADD COLUMN "upsellBody" TEXT;

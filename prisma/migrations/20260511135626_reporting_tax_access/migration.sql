-- CreateEnum
CREATE TYPE "AccessGrantSourceType" AS ENUM ('ONE_TIME_PURCHASE', 'SUBSCRIPTION', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "TaxRateRuleType" AS ENUM ('REPLACE', 'ADD');

-- DropIndex
DROP INDEX "Offer_accessProductId_idx";

-- AlterTable
ALTER TABLE "AccessProduct" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxCountry" TEXT,
ADD COLUMN     "taxMode" TEXT NOT NULL DEFAULT 'not_collected',
ADD COLUMN     "taxPostalCode" TEXT,
ADD COLUMN     "taxRegion" TEXT;

-- CreateTable
CREATE TABLE "CourseAccessGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "orderId" TEXT,
    "subscriptionId" TEXT,
    "sourceType" "AccessGrantSourceType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "CourseAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTaxLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "taxRateId" TEXT,
    "label" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "ratePercent" DECIMAL(7,4) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderTaxLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "pricesIncludeTax" BOOLEAN NOT NULL DEFAULT false,
    "requireTaxLocation" BOOLEAN NOT NULL DEFAULT false,
    "collectForAllCountries" BOOLEAN NOT NULL DEFAULT false,
    "defaultTaxName" TEXT NOT NULL DEFAULT 'Tax',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "label" TEXT NOT NULL,
    "ratePercent" DECIMAL(7,4) NOT NULL,
    "ruleType" "TaxRateRuleType" NOT NULL DEFAULT 'REPLACE',
    "appliesToCourses" BOOLEAN NOT NULL DEFAULT true,
    "appliesToBundles" BOOLEAN NOT NULL DEFAULT true,
    "appliesToSubscriptions" BOOLEAN NOT NULL DEFAULT true,
    "appliesToAccessProducts" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseAccessGrant_userId_courseId_isActive_idx" ON "CourseAccessGrant"("userId", "courseId", "isActive");

-- CreateIndex
CREATE INDEX "CourseAccessGrant_orderId_idx" ON "CourseAccessGrant"("orderId");

-- CreateIndex
CREATE INDEX "CourseAccessGrant_subscriptionId_idx" ON "CourseAccessGrant"("subscriptionId");

-- CreateIndex
CREATE INDEX "OrderTaxLine_orderId_idx" ON "OrderTaxLine"("orderId");

-- CreateIndex
CREATE INDEX "OrderTaxLine_jurisdiction_idx" ON "OrderTaxLine"("jurisdiction");

-- CreateIndex
CREATE INDEX "TaxRate_country_region_postalCode_isActive_idx" ON "TaxRate"("country", "region", "postalCode", "isActive");

-- AddForeignKey
ALTER TABLE "CourseAccessGrant" ADD CONSTRAINT "CourseAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAccessGrant" ADD CONSTRAINT "CourseAccessGrant_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAccessGrant" ADD CONSTRAINT "CourseAccessGrant_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAccessGrant" ADD CONSTRAINT "CourseAccessGrant_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTaxLine" ADD CONSTRAINT "OrderTaxLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTaxLine" ADD CONSTRAINT "OrderTaxLine_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

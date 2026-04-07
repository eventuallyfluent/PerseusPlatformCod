-- AlterTable
ALTER TABLE "Course"
ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "compareAtPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Bundle"
ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "compareAtPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Offer"
ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Backfill course pricing from the first published offer, then any offer.
UPDATE "Course" c
SET
  "price" = COALESCE((
    SELECT o."price"
    FROM "Offer" o
    WHERE o."courseId" = c."id"
    ORDER BY o."isPublished" DESC, o."id" ASC
    LIMIT 1
  ), c."price"),
  "currency" = COALESCE((
    SELECT o."currency"
    FROM "Offer" o
    WHERE o."courseId" = c."id"
    ORDER BY o."isPublished" DESC, o."id" ASC
    LIMIT 1
  ), c."currency"),
  "compareAtPrice" = COALESCE((
    SELECT o."compareAtPrice"
    FROM "Offer" o
    WHERE o."courseId" = c."id"
    ORDER BY o."isPublished" DESC, o."id" ASC
    LIMIT 1
  ), c."compareAtPrice");

-- Backfill bundle pricing from the first published offer, then any offer.
UPDATE "Bundle" b
SET
  "price" = COALESCE((
    SELECT o."price"
    FROM "Offer" o
    WHERE o."bundleId" = b."id"
    ORDER BY o."isPublished" DESC, o."id" ASC
    LIMIT 1
  ), b."price"),
  "currency" = COALESCE((
    SELECT o."currency"
    FROM "Offer" o
    WHERE o."bundleId" = b."id"
    ORDER BY o."isPublished" DESC, o."id" ASC
    LIMIT 1
  ), b."currency"),
  "compareAtPrice" = COALESCE((
    SELECT o."compareAtPrice"
    FROM "Offer" o
    WHERE o."bundleId" = b."id"
    ORDER BY o."isPublished" DESC, o."id" ASC
    LIMIT 1
  ), b."compareAtPrice");

-- Mark one existing offer per product as the default internal checkout record.
WITH ranked_course_offers AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "courseId" ORDER BY "isPublished" DESC, "id" ASC) AS rn
  FROM "Offer"
  WHERE "courseId" IS NOT NULL
)
UPDATE "Offer" o
SET "isDefault" = ranked_course_offers.rn = 1
FROM ranked_course_offers
WHERE o."id" = ranked_course_offers."id";

WITH ranked_bundle_offers AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "bundleId" ORDER BY "isPublished" DESC, "id" ASC) AS rn
  FROM "Offer"
  WHERE "bundleId" IS NOT NULL
)
UPDATE "Offer" o
SET "isDefault" = true
FROM ranked_bundle_offers
WHERE o."id" = ranked_bundle_offers."id"
  AND ranked_bundle_offers.rn = 1;

CREATE TYPE "AccessProductType" AS ENUM ('COURSE_ACCESS', 'BUNDLE_ACCESS', 'MEMBERSHIP', 'FREE_REGISTRATION');

CREATE TABLE "AccessProduct" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "AccessProductType" NOT NULL,
  "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
  "checkoutMode" TEXT NOT NULL DEFAULT 'managed_checkout',
  "courseId" TEXT,
  "bundleId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccessProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessProductGrant" (
  "id" TEXT NOT NULL,
  "accessProductId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccessProductGrant_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Offer" ADD COLUMN "accessProductId" TEXT;

CREATE UNIQUE INDEX "AccessProduct_slug_key" ON "AccessProduct"("slug");
CREATE UNIQUE INDEX "AccessProduct_courseId_key" ON "AccessProduct"("courseId");
CREATE UNIQUE INDEX "AccessProduct_bundleId_key" ON "AccessProduct"("bundleId");
CREATE UNIQUE INDEX "AccessProductGrant_accessProductId_courseId_key" ON "AccessProductGrant"("accessProductId", "courseId");
CREATE UNIQUE INDEX "AccessProductGrant_accessProductId_position_key" ON "AccessProductGrant"("accessProductId", "position");
CREATE INDEX "Offer_accessProductId_idx" ON "Offer"("accessProductId");

ALTER TABLE "AccessProduct" ADD CONSTRAINT "AccessProduct_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessProduct" ADD CONSTRAINT "AccessProduct_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessProductGrant" ADD CONSTRAINT "AccessProductGrant_accessProductId_fkey" FOREIGN KEY ("accessProductId") REFERENCES "AccessProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessProductGrant" ADD CONSTRAINT "AccessProductGrant_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_accessProductId_fkey" FOREIGN KEY ("accessProductId") REFERENCES "AccessProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AccessProduct" ("id", "slug", "title", "description", "type", "status", "checkoutMode", "courseId", "createdAt", "updatedAt")
SELECT
  'ap_course_' || "id",
  'course-' || "slug" || '-access',
  "title" || ' access',
  "shortDescription",
  'COURSE_ACCESS'::"AccessProductType",
  "status",
  'managed_checkout',
  "id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Course";

INSERT INTO "AccessProductGrant" ("id", "accessProductId", "courseId", "position", "createdAt")
SELECT
  'apg_course_' || "id",
  'ap_course_' || "id",
  "id",
  1,
  CURRENT_TIMESTAMP
FROM "Course";

INSERT INTO "AccessProduct" ("id", "slug", "title", "description", "type", "status", "checkoutMode", "bundleId", "createdAt", "updatedAt")
SELECT
  'ap_bundle_' || "id",
  'bundle-' || "slug" || '-access',
  "title" || ' access',
  "shortDescription",
  'BUNDLE_ACCESS'::"AccessProductType",
  "status",
  'managed_checkout',
  "id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Bundle";

INSERT INTO "AccessProductGrant" ("id", "accessProductId", "courseId", "position", "createdAt")
SELECT
  'apg_bundle_' || bc."bundleId" || '_' || bc."courseId",
  'ap_bundle_' || bc."bundleId",
  bc."courseId",
  bc."position",
  CURRENT_TIMESTAMP
FROM "BundleCourse" bc;

UPDATE "Offer" o
SET "accessProductId" = ap."id"
FROM "AccessProduct" ap
WHERE (ap."courseId" IS NOT NULL AND ap."courseId" = o."courseId")
   OR (ap."bundleId" IS NOT NULL AND ap."bundleId" = o."bundleId");

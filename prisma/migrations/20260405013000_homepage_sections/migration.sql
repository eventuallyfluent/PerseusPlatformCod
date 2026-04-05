CREATE TYPE "HomepageSectionType" AS ENUM ('HERO', 'COLLECTIONS', 'TESTIMONIES', 'EMAIL_SIGNUP', 'FOOTER');

CREATE TABLE "HomepageSection" (
  "id" TEXT NOT NULL,
  "type" "HomepageSectionType" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "position" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomepageSection_type_key" ON "HomepageSection"("type");

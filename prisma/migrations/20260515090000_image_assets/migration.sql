CREATE TYPE "ImageAssetStatus" AS ENUM ('PENDING', 'COPIED', 'FAILED', 'SKIPPED');

CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "fetchUrl" TEXT,
    "ownedUrl" TEXT,
    "storageKey" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'VERCEL_BLOB',
    "status" "ImageAssetStatus" NOT NULL DEFAULT 'PENDING',
    "contentType" TEXT,
    "byteSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImageAsset_sourceUrl_key" ON "ImageAsset"("sourceUrl");
CREATE INDEX "ImageAsset_status_idx" ON "ImageAsset"("status");
CREATE INDEX "ImageAsset_provider_idx" ON "ImageAsset"("provider");

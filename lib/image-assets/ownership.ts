import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import { ImageAssetStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isRemoteImageCandidate, normalizeImportedImageUrl } from "@/lib/image-assets/url";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;

export type OwnedImageContext = {
  folder: "courses" | "bundles" | "collections" | "instructors" | "sales-gallery" | "imports";
  slug?: string | null;
  role?: string;
};

export type OwnedImageResult = {
  inputUrl: string;
  outputUrl: string;
  status: "copied" | "reused" | "skipped" | "failed";
  assetId?: string;
  error?: string;
};

function truncateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "Unknown image ownership error");
  return message.slice(0, 1000);
}

function extensionForContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  return "jpg";
}

function storageKeyFor(sourceUrl: string, contentType: string, context: OwnedImageContext) {
  const hash = createHash("sha256").update(sourceUrl).digest("hex").slice(0, 18);
  const slug = String(context.slug || "unassigned")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unassigned";
  const role = String(context.role || "image")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";

  return `imports/${context.folder}/${slug}/${role}-${hash}.${extensionForContentType(contentType)}`;
}

function readUint16(buffer: Buffer, offset: number) {
  return buffer.readUInt16BE(offset);
}

function readImageDimensions(buffer: Buffer, contentType: string) {
  if (contentType.includes("png") && buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (contentType.includes("webp") && buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const format = buffer.toString("ascii", 12, 16);
    if (format === "VP8X" && buffer.length >= 30) {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
  }

  if ((contentType.includes("jpeg") || contentType.includes("jpg")) && buffer.length > 4) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = readUint16(buffer, offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker) && offset + 8 < buffer.length) {
        return {
          height: readUint16(buffer, offset + 5),
          width: readUint16(buffer, offset + 7),
        };
      }
      offset += 2 + length;
    }
  }

  return {};
}

async function fetchImage(fetchUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(fetchUrl, {
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Image fetch failed with ${response.status}`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0]?.toLowerCase() ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Remote URL is not an image (${contentType || "unknown content type"})`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit`);
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function ownImageUrl(inputUrl: string | null | undefined, context: OwnedImageContext): Promise<OwnedImageResult> {
  const sourceUrl = String(inputUrl ?? "").trim();

  if (!sourceUrl || !isRemoteImageCandidate(sourceUrl)) {
    return {
      inputUrl: sourceUrl,
      outputUrl: sourceUrl,
      status: "skipped",
    };
  }

  const existing = await prisma.imageAsset.findUnique({
    where: { sourceUrl },
  });

  if (existing?.status === ImageAssetStatus.COPIED && existing.ownedUrl) {
    return {
      inputUrl: sourceUrl,
      outputUrl: existing.ownedUrl,
      status: "reused",
      assetId: existing.id,
    };
  }

  const fetchUrl = normalizeImportedImageUrl(sourceUrl);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const asset = await prisma.imageAsset.upsert({
      where: { sourceUrl },
      update: {
        fetchUrl,
        provider: "VERCEL_BLOB",
        status: ImageAssetStatus.FAILED,
        error: "BLOB_READ_WRITE_TOKEN is not configured",
      },
      create: {
        sourceUrl,
        fetchUrl,
        provider: "VERCEL_BLOB",
        status: ImageAssetStatus.FAILED,
        error: "BLOB_READ_WRITE_TOKEN is not configured",
      },
    });

    return {
      inputUrl: sourceUrl,
      outputUrl: sourceUrl,
      status: "failed",
      assetId: asset.id,
      error: asset.error ?? undefined,
    };
  }

  try {
    const { buffer, contentType } = await fetchImage(fetchUrl);
    const storageKey = storageKeyFor(sourceUrl, contentType, context);
    const blob = await put(storageKey, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const dimensions = readImageDimensions(buffer, contentType);

    const asset = await prisma.imageAsset.upsert({
      where: { sourceUrl },
      update: {
        fetchUrl,
        ownedUrl: blob.url,
        storageKey,
        provider: "VERCEL_BLOB",
        status: ImageAssetStatus.COPIED,
        contentType,
        byteSize: buffer.byteLength,
        width: dimensions.width,
        height: dimensions.height,
        error: null,
      },
      create: {
        sourceUrl,
        fetchUrl,
        ownedUrl: blob.url,
        storageKey,
        provider: "VERCEL_BLOB",
        status: ImageAssetStatus.COPIED,
        contentType,
        byteSize: buffer.byteLength,
        width: dimensions.width,
        height: dimensions.height,
      },
    });

    return {
      inputUrl: sourceUrl,
      outputUrl: blob.url,
      status: "copied",
      assetId: asset.id,
    };
  } catch (error) {
    const message = truncateError(error);
    const asset = await prisma.imageAsset.upsert({
      where: { sourceUrl },
      update: {
        fetchUrl,
        provider: "VERCEL_BLOB",
        status: ImageAssetStatus.FAILED,
        error: message,
      },
      create: {
        sourceUrl,
        fetchUrl,
        provider: "VERCEL_BLOB",
        status: ImageAssetStatus.FAILED,
        error: message,
      },
    });

    return {
      inputUrl: sourceUrl,
      outputUrl: sourceUrl,
      status: "failed",
      assetId: asset.id,
      error: message,
    };
  }
}

export function summarizeOwnedImageResults(results: OwnedImageResult[]) {
  return {
    copied: results.filter((result) => result.status === "copied").length,
    reused: results.filter((result) => result.status === "reused").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
  };
}

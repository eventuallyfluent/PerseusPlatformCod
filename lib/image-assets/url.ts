const PAYHIP_IMPORT_IMAGE_WIDTH = 1600;
const OWNED_IMAGE_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export function normalizeImportedImageUrl(value: string | null | undefined) {
  const url = String(value ?? "").trim();

  if (!url) {
    return url;
  }

  if (!url.includes("payhip.com/cdn-cgi/image/")) {
    return url;
  }

  if (/width=\d+/i.test(url)) {
    return url.replace(/width=\d+/i, `width=${PAYHIP_IMPORT_IMAGE_WIDTH}`);
  }

  if (/width%3D\d+/i.test(url)) {
    return url.replace(/width%3D\d+/i, `width%3D${PAYHIP_IMPORT_IMAGE_WIDTH}`);
  }

  if (/format=auto/i.test(url)) {
    return url.replace(/format=auto/i, `format=auto,width=${PAYHIP_IMPORT_IMAGE_WIDTH}`);
  }

  if (/format%3Dauto/i.test(url)) {
    return url.replace(/format%3Dauto/i, `format%3Dauto%2Cwidth%3D${PAYHIP_IMPORT_IMAGE_WIDTH}`);
  }

  return url;
}

export function isOwnedImageUrl(value: string | null | undefined) {
  const url = String(value ?? "").trim();

  if (!url) {
    return false;
  }

  try {
    return new URL(url).hostname.endsWith(OWNED_IMAGE_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export function isRemoteImageCandidate(value: string | null | undefined) {
  const url = String(value ?? "").trim();

  if (!url || isOwnedImageUrl(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

import type { Bundle } from "@prisma/client";
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";

export function resolveBundlePublicPath(bundle: Pick<Bundle, "slug" | "publicPath" | "legacyUrl">) {
  const publicPath = normalizePublicPathInput(bundle.publicPath);
  if (publicPath) {
    return publicPath;
  }

  const legacyUrl = normalizePublicPathInput(bundle.legacyUrl);
  if (legacyUrl) {
    return legacyUrl;
  }

  return `/bundle/${bundle.slug}`;
}

export function resolveBundleThankYouPath(bundle: Pick<Bundle, "slug" | "publicPath" | "legacyUrl">) {
  return `${resolveBundlePublicPath(bundle)}/purchased`;
}

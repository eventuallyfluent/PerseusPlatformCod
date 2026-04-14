import type { Bundle } from "@prisma/client";

export function resolveBundlePublicPath(bundle: Pick<Bundle, "slug" | "publicPath" | "legacyUrl">) {
  if (bundle.publicPath && bundle.publicPath.startsWith("/")) {
    return bundle.publicPath;
  }

  if (bundle.legacyUrl && bundle.legacyUrl.startsWith("/")) {
    return bundle.legacyUrl;
  }

  return `/bundle/${bundle.slug}`;
}

export function resolveBundleThankYouPath(bundle: Pick<Bundle, "slug" | "publicPath" | "legacyUrl">) {
  return `${resolveBundlePublicPath(bundle)}/purchased`;
}

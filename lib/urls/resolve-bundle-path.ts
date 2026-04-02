import type { Bundle } from "@prisma/client";

export function resolveBundlePublicPath(bundle: Pick<Bundle, "slug" | "publicPath" | "legacyUrl">) {
  return bundle.publicPath ?? bundle.legacyUrl ?? `/bundle/${bundle.slug}`;
}

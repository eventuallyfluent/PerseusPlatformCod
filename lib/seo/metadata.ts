import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const canonicalUrl = input.path ? absoluteUrl(input.path) : undefined;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      url: canonicalUrl,
      images: input.image ? [{ url: input.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: input.image ? [input.image] : undefined,
    },
  };
}

export function buildNoIndexMetadata(input: { title: string; description?: string; path?: string }): Metadata {
  return buildMetadata({
    title: input.title,
    description: input.description ?? SITE_DESCRIPTION,
    path: input.path,
    noIndex: true,
  });
}

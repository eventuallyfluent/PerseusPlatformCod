import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/utils";

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.path ? absoluteUrl(input.path) : undefined,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path ? absoluteUrl(input.path) : undefined,
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

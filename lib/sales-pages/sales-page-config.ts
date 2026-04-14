import type { SalesPageConfig, SalesPageSectionKey } from "@/types";

const sectionKeySet = new Set<SalesPageSectionKey>([
  "description",
  "highlights",
  "curriculum",
  "included-courses",
  "instructor",
  "testimonials",
  "faqs",
  "pricing",
]);

function normalizeSectionKeys(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item))
    .filter((item): item is SalesPageSectionKey => sectionKeySet.has(item as SalesPageSectionKey));
}

export function parseSalesPageConfig(value: unknown): SalesPageConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;

  return {
    heroMetadataLine: typeof source.heroMetadataLine === "string" ? source.heroMetadataLine : undefined,
    primaryCtaLabel: typeof source.primaryCtaLabel === "string" ? source.primaryCtaLabel : undefined,
    secondaryCtaLabel: typeof source.secondaryCtaLabel === "string" ? source.secondaryCtaLabel : undefined,
    sectionOrder: normalizeSectionKeys(source.sectionOrder),
    hiddenSections: normalizeSectionKeys(source.hiddenSections),
    pricingBadge: typeof source.pricingBadge === "string" ? source.pricingBadge : undefined,
    pricingHeadline: typeof source.pricingHeadline === "string" ? source.pricingHeadline : undefined,
    pricingBody: typeof source.pricingBody === "string" ? source.pricingBody : undefined,
    finalCtaLabel: typeof source.finalCtaLabel === "string" ? source.finalCtaLabel : undefined,
    finalCtaBody: typeof source.finalCtaBody === "string" ? source.finalCtaBody : undefined,
    thankYouEyebrow: typeof source.thankYouEyebrow === "string" ? source.thankYouEyebrow : undefined,
    thankYouHeadline: typeof source.thankYouHeadline === "string" ? source.thankYouHeadline : undefined,
    thankYouBody: typeof source.thankYouBody === "string" ? source.thankYouBody : undefined,
    thankYouSignedInLabel: typeof source.thankYouSignedInLabel === "string" ? source.thankYouSignedInLabel : undefined,
    thankYouSignedOutLabel: typeof source.thankYouSignedOutLabel === "string" ? source.thankYouSignedOutLabel : undefined,
  };
}

export function normalizeSectionOrder(
  requested: SalesPageSectionKey[] | undefined,
  defaults: SalesPageSectionKey[],
) {
  const seen = new Set<SalesPageSectionKey>();
  const ordered = (requested ?? []).filter((key) => defaults.includes(key) && !seen.has(key) && seen.add(key));

  for (const key of defaults) {
    if (!seen.has(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }

  return ordered;
}

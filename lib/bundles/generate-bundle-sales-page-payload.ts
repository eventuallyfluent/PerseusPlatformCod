import { currencyFormatter } from "@/lib/utils";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { normalizeSectionOrder, parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import type { BundleSalesPagePayload, BundleWithRelations, SalesPageOfferSummary } from "@/types";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}

function buildOffers(bundle: BundleWithRelations): SalesPageOfferSummary[] {
  const offer = getPrimaryOffer(bundle.offers);

  if (!offer) {
    return [];
  }

  const price = currencyFormatter(bundle.price.toString(), bundle.currency);
  const compareAtPrice = bundle.compareAtPrice ? currencyFormatter(bundle.compareAtPrice.toString(), bundle.currency) : null;
  const savingsLabel =
    bundle.compareAtPrice && Number(bundle.compareAtPrice) > Number(bundle.price)
      ? `Save ${Math.round(((Number(bundle.compareAtPrice) - Number(bundle.price)) / Number(bundle.compareAtPrice)) * 100)}%`
      : null;

  return [{
    offerId: offer.id,
    name: `${bundle.title} access`,
    price,
    currency: bundle.currency,
    checkoutUrl: `/checkout/${offer.id}`,
    compareAtPrice,
    savingsLabel,
  }];
}

export function generateBundleSalesPagePayload(bundle: BundleWithRelations): BundleSalesPagePayload {
  const config = parseSalesPageConfig(bundle.salesPageConfig);
  const offers = buildOffers(bundle);
  const approvedTestimonials = bundle.testimonials.filter((testimonial) => testimonial.isApproved);
  const sectionOrder = normalizeSectionOrder(config.sectionOrder, [
    "description",
    "highlights",
    "included-courses",
    "testimonials",
    "faqs",
    "pricing",
  ]);

  return {
    version: "v2",
    productType: "bundle",
    hero: {
      eyebrow: "Perseus bundle",
      metadataLine: config.heroMetadataLine ?? `${bundle.courses.length} included courses • one checkout path`,
      title: bundle.title,
      subtitle: bundle.subtitle,
      imageUrl: bundle.heroImageUrl,
      primaryCtaLabel: config.primaryCtaLabel || "Get the bundle",
      primaryCtaHref: offers[0]?.checkoutUrl ?? resolveBundlePublicPath(bundle),
      secondaryCtaLabel: config.secondaryCtaLabel || "See included courses",
      secondaryCtaHref: "#included-courses",
      primaryOffer: offers[0] ?? null,
    },
    media: {
      salesVideoUrl: bundle.salesVideoUrl,
    },
    sections: {
      order: sectionOrder,
      hidden: config.hiddenSections ?? [],
    },
    descriptionSection: {
      eyebrow: "Bundle overview",
      title: "What this unlocks in one step.",
      shortDescription: bundle.shortDescription,
      longDescription: bundle.longDescription,
    },
    highlightsSection: {
      eyebrow: "At a glance",
      cards: [
        { id: "outcomes", title: "Outcomes", items: readStringArray(bundle.learningOutcomes) },
        { id: "audience", title: "Who it is for", items: readStringArray(bundle.whoItsFor) },
        { id: "includes", title: "Bundle includes", items: readStringArray(bundle.includes) },
      ],
    },
    includedCoursesSection: {
      eyebrow: "Included courses",
      title: "Each course stays distinct. The purchase path becomes simpler.",
      body: "Buy once, then enter each included course through the normal learner dashboard and lesson flow.",
      courses: bundle.courses.map((item) => ({
        title: item.course.title,
        subtitle: item.course.subtitle,
        instructorName: item.course.instructor.name,
        courseUrl: item.course.publicPath ?? item.course.legacyUrl ?? `/course/${item.course.slug}`,
      })),
    },
    testimonialsSection: {
      eyebrow: "Testimonies",
      title: "What students say after entering the bundle",
      items: approvedTestimonials.map((testimonial) => ({
        name: testimonial.name,
        quote: testimonial.quote,
        rating: testimonial.rating,
        source: bundle.title,
      })),
    },
    faqSection: {
      eyebrow: "FAQ",
      title: "What you should know before buying",
      items: bundle.faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    },
    pricingSection: {
      eyebrow: "Pricing",
      badge: config.pricingBadge || "Multiple enrollments",
      headline: config.pricingHeadline || "One checkout. Multiple course enrollments.",
      body:
        config.pricingBody ||
        "Bundle purchases keep commerce simple while preserving the same learner model underneath. Every included course unlocks as a normal enrollment.",
      offers,
    },
    finalCta: {
      label: config.finalCtaLabel || (offers.length > 0 ? "Unlock the full bundle" : "Bundle coming soon"),
      body:
        config.finalCtaBody ||
        "A bundle should feel as clear as a single product: one decisive CTA, one purchase flow, and a clean transition into study.",
    },
    offers,
  };
}

export function getBundleSalesPagePath(bundle: BundleWithRelations) {
  return resolveBundlePublicPath(bundle);
}

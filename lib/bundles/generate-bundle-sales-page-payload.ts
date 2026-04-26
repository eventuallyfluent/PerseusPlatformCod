import { currencyFormatter } from "@/lib/utils";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { normalizeSectionOrder, parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import type { BundleSalesPagePayload, BundleWithRelations, SalesPageOfferSummary } from "@/types";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { getPublicReviewName } from "@/lib/testimonials/public-review-name";

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
      metadataLine: config.heroMetadataLine ?? `${bundle.courses.length} included courses`,
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
      title: `All ${bundle.courses.length} courses included in this bundle.`,
      body: "Get the full course set in one purchase. Every included course is listed below so you can see exactly what is inside the bundle.",
      courses: bundle.courses.map((item) => ({
        title: item.course.title,
        subtitle: item.course.subtitle,
        imageUrl: item.course.heroImageUrl,
        instructorName: item.course.instructor.name,
        courseUrl: item.course.publicPath ?? item.course.legacyUrl ?? `/course/${item.course.slug}`,
      })),
    },
    testimonialsSection: {
      eyebrow: "Testimonies",
      title: "What students say after entering the bundle",
      items: approvedTestimonials.map((testimonial) => ({
        name: getPublicReviewName(testimonial.name),
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
      badge: config.pricingBadge || "Complete bundle access",
      headline: config.pricingHeadline || "Get the full training bundle in one purchase.",
      body:
        config.pricingBody ||
        "Unlock every included course together and move through the material from your learner dashboard at your own pace.",
      offers,
    },
    finalCta: {
      label: config.finalCtaLabel || (offers.length > 0 ? "Unlock the full bundle" : "Bundle coming soon"),
      body:
        config.finalCtaBody ||
        "Start with one purchase, then move straight into the full bundle from your learner dashboard.",
    },
    offers,
  };
}

export function getBundleSalesPagePath(bundle: BundleWithRelations) {
  return resolveBundlePublicPath(bundle);
}

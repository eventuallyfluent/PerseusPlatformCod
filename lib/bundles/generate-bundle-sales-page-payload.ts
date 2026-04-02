import { currencyFormatter } from "@/lib/utils";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import type { BundleSalesPagePayload, BundleWithRelations } from "@/types";

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}

export function generateBundleSalesPagePayload(bundle: BundleWithRelations): BundleSalesPagePayload {
  return {
    hero: {
      title: bundle.title,
      subtitle: bundle.subtitle,
      imageUrl: bundle.heroImageUrl,
      ctaLabel: "Get the bundle",
    },
    video: {
      salesVideoUrl: bundle.salesVideoUrl,
    },
    description: {
      shortDescription: bundle.shortDescription,
      longDescription: bundle.longDescription,
    },
    outcomes: readStringArray(bundle.learningOutcomes),
    audience: readStringArray(bundle.whoItsFor),
    includes: readStringArray(bundle.includes),
    includedCourses: bundle.courses.map((item) => ({
      title: item.course.title,
      subtitle: item.course.subtitle,
      instructorName: item.course.instructor.name,
      courseUrl: item.course.publicPath ?? item.course.legacyUrl ?? `/course/${item.course.slug}`,
    })),
    testimonials: bundle.testimonials.map((testimonial) => ({
      name: testimonial.name,
      quote: testimonial.quote,
    })),
    faqs: bundle.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
    pricing: bundle.offers
      .filter((offer) => offer.isPublished)
      .map((offer) => ({
        offerId: offer.id,
        price: currencyFormatter(offer.price.toString(), offer.currency),
        currency: offer.currency,
        checkoutUrl: `/checkout/${offer.id}`,
      })),
    finalCta: {
      label: bundle.offers.some((offer) => offer.isPublished) ? "Unlock the full bundle" : "Bundle coming soon",
    },
  };
}

export function getBundleSalesPagePath(bundle: BundleWithRelations) {
  return resolveBundlePublicPath(bundle);
}

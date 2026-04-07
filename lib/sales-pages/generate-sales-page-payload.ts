import { currencyFormatter } from "@/lib/utils";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { normalizeSectionOrder, parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import type { CourseWithRelations, GeneratedSalesPagePayload, SalesPageOfferSummary } from "@/types";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}

function buildOffers(course: CourseWithRelations): SalesPageOfferSummary[] {
  const offer = getPrimaryOffer(course.offers);

  if (!offer) {
    return [];
  }

  const price = currencyFormatter(course.price.toString(), course.currency);
  const compareAtPrice = course.compareAtPrice ? currencyFormatter(course.compareAtPrice.toString(), course.currency) : null;
  const savingsLabel =
    course.compareAtPrice && Number(course.compareAtPrice) > Number(course.price)
      ? `Save ${Math.round(((Number(course.compareAtPrice) - Number(course.price)) / Number(course.compareAtPrice)) * 100)}%`
      : null;

  return [{
    offerId: offer.id,
    name: `${course.title} access`,
    price,
    currency: course.currency,
    checkoutUrl: `/checkout/${offer.id}`,
    compareAtPrice,
    savingsLabel,
  }];
}

export function generateSalesPagePayload(course: CourseWithRelations): GeneratedSalesPagePayload {
  const config = parseSalesPageConfig(course.salesPageConfig);
  const offers = buildOffers(course);
  const approvedTestimonials = course.testimonials.filter((testimonial) => testimonial.isApproved);
  const sectionOrder = normalizeSectionOrder(config.sectionOrder, [
    "description",
    "highlights",
    "curriculum",
    "instructor",
    "testimonials",
    "faqs",
    "pricing",
  ]);
  const outcomes = readStringArray(course.learningOutcomes);
  const audience = readStringArray(course.whoItsFor);
  const includes = readStringArray(course.includes);
  const lessonCount = course.modules.reduce((count, module) => count + module.lessons.length, 0);

  return {
    version: "v2",
    productType: "course",
    hero: {
      eyebrow: "Perseus course",
      metadataLine: config.heroMetadataLine ?? `${course.instructor.name} • ${lessonCount} lessons`,
      title: course.title,
      subtitle: course.subtitle,
      imageUrl: course.heroImageUrl,
      primaryCtaLabel: config.primaryCtaLabel || "Enroll now - get instant access",
      primaryCtaHref: offers[0]?.checkoutUrl ?? resolveCoursePublicPath(course),
      secondaryCtaLabel: config.secondaryCtaLabel || "View curriculum",
      secondaryCtaHref: "#curriculum",
      primaryOffer: offers[0] ?? null,
    },
    media: {
      salesVideoUrl: course.salesVideoUrl,
    },
    sections: {
      order: sectionOrder,
      hidden: config.hiddenSections ?? [],
    },
    descriptionSection: {
      eyebrow: "Course overview",
      title: "What this course opens up.",
      shortDescription: course.shortDescription,
      longDescription: course.longDescription,
    },
    highlightsSection: {
      eyebrow: "At a glance",
      cards: [
        { id: "outcomes", title: "Outcomes", items: outcomes },
        { id: "audience", title: "Who it is for", items: audience },
        { id: "includes", title: "Included", items: includes },
      ],
    },
    curriculumSection: {
      eyebrow: "Curriculum",
      title: "See the full curriculum before you join.",
      body: "Every module and lesson is listed here so the structure, pacing, and progression are visible before checkout.",
      modules: course.modules.map((module) => ({
        moduleTitle: module.title,
        lessonCount: module.lessons.length,
        lessons: module.lessons
          .sort((left, right) => left.position - right.position)
          .map((lesson) => ({
            title: lesson.title,
            isPreview: lesson.isPreview,
            type: lesson.type,
            durationLabel: lesson.durationLabel,
            dripDays: lesson.dripDays,
          })),
      })),
    },
    instructorSection: {
      eyebrow: "Instructor",
      title: "",
      body: "",
      name: course.instructor.name,
      imageUrl: course.instructor.imageUrl,
      shortBio: course.instructor.shortBio,
      socialLinks: ([
        ["Website", course.instructor.websiteUrl],
        ["YouTube", course.instructor.youtubeUrl],
        ["Instagram", course.instructor.instagramUrl],
        ["X", course.instructor.xUrl],
        ["Facebook", course.instructor.facebookUrl],
        ["Discord", course.instructor.discordUrl],
        ["Telegram", course.instructor.telegramUrl],
      ] as Array<[string, string | null]>)
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([label, url]) => ({ label, url })),
      pageUrl: `/instructors/${course.instructor.slug}`,
    },
    testimonialsSection: {
      eyebrow: "Testimonies",
      title: "What students say after entering the work",
      items: approvedTestimonials.map((testimonial) => ({
        name: testimonial.name,
        quote: testimonial.quote,
        source: course.title,
      })),
    },
    faqSection: {
      eyebrow: "FAQ",
      title: "What you should know before buying",
      items: course.faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    },
    pricingSection: {
      eyebrow: "Pricing",
      badge: config.pricingBadge || "Instant access",
      headline: config.pricingHeadline || "A single clear offer, then straight into study.",
      body:
        config.pricingBody ||
        "Use the sales page to understand the promise. Use checkout only when you are ready to enter the course.",
      offers,
    },
    finalCta: {
      label: config.finalCtaLabel || (offers.length > 0 ? "Enroll now - get instant access" : "Join the waitlist"),
      body:
        config.finalCtaBody ||
        "One dominant action, one clean buying path, and a clear move into the learner portal after enrollment.",
    },
    offers,
  };
}

export function getSalesPagePath(course: CourseWithRelations) {
  return resolveCoursePublicPath(course);
}

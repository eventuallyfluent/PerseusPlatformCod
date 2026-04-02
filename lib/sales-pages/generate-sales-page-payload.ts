import { currencyFormatter } from "@/lib/utils";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import type { CourseWithRelations, GeneratedSalesPagePayload } from "@/types";

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}

export function generateSalesPagePayload(course: CourseWithRelations): GeneratedSalesPagePayload {
  return {
    hero: {
      title: course.title,
      subtitle: course.subtitle,
      imageUrl: course.heroImageUrl,
      ctaLabel: "Enroll now",
    },
    video: {
      salesVideoUrl: course.salesVideoUrl,
    },
    description: {
      shortDescription: course.shortDescription,
      longDescription: course.longDescription,
    },
    outcomes: readStringArray(course.learningOutcomes),
    audience: readStringArray(course.whoItsFor),
    includes: readStringArray(course.includes),
    curriculum: course.modules.map((module) => ({
      moduleTitle: module.title,
      lessons: module.lessons
        .sort((left, right) => left.position - right.position)
        .map((lesson) => ({
          title: lesson.title,
          isPreview: lesson.isPreview,
        })),
    })),
    instructor: {
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
    testimonials: course.testimonials.map((testimonial) => ({
      name: testimonial.name,
      quote: testimonial.quote,
    })),
    faqs: course.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
    pricing: course.offers
      .filter((offer) => offer.isPublished)
      .map((offer) => ({
        offerId: offer.id,
        price: currencyFormatter(offer.price.toString(), offer.currency),
        currency: offer.currency,
        checkoutUrl: `/checkout/${offer.id}`,
      })),
    finalCta: {
      label: course.offers.some((offer) => offer.isPublished) ? "Start learning today" : "Join the waitlist",
    },
  };
}

export function getSalesPagePath(course: CourseWithRelations) {
  return resolveCoursePublicPath(course);
}

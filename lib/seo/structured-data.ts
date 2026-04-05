import { absoluteUrl } from "@/lib/utils";
import type { BundleSalesPagePayload, BundleWithRelations, CourseWithRelations, GeneratedSalesPagePayload } from "@/types";

export function buildCourseStructuredData(course: CourseWithRelations, payload: GeneratedSalesPagePayload) {
  const offers = payload.offers.map((price) => ({
    "@type": "Offer",
    price: price.price.replace(/[^0-9.]/g, ""),
    priceCurrency: price.currency,
    url: absoluteUrl(price.checkoutUrl),
    availability: "https://schema.org/InStock",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription ?? course.longDescription ?? course.title,
    provider: {
      "@type": "Organization",
      name: "Perseus Arcane Academy",
    },
    instructor: {
      "@type": "Person",
      name: course.instructor.name,
      url: absoluteUrl(`/instructors/${course.instructor.slug}`),
    },
    hasCourseInstance: offers.length > 0 ? offers : undefined,
  };
}

export function buildProductStructuredData(course: CourseWithRelations, payload: GeneratedSalesPagePayload) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: course.title,
    description: course.shortDescription ?? course.longDescription ?? course.title,
    image: course.heroImageUrl ? [course.heroImageUrl] : undefined,
    brand: {
      "@type": "Brand",
      name: "Perseus Arcane Academy",
    },
    offers: payload.offers.map((price) => ({
      "@type": "Offer",
      price: price.price.replace(/[^0-9.]/g, ""),
      priceCurrency: price.currency,
      url: absoluteUrl(price.checkoutUrl),
      availability: "https://schema.org/InStock",
    })),
  };
}

export function buildBundleProductStructuredData(bundle: BundleWithRelations, payload: BundleSalesPagePayload) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bundle.title,
    description: bundle.shortDescription ?? bundle.longDescription ?? bundle.title,
    image: bundle.heroImageUrl ? [bundle.heroImageUrl] : undefined,
    brand: {
      "@type": "Brand",
      name: "Perseus Arcane Academy",
    },
    isRelatedTo: payload.includedCoursesSection.courses.map((course) => ({
      "@type": "Course",
      name: course.title,
      url: absoluteUrl(course.courseUrl),
    })),
    offers: payload.offers.map((price) => ({
      "@type": "Offer",
      price: price.price.replace(/[^0-9.]/g, ""),
      priceCurrency: price.currency,
      url: absoluteUrl(price.checkoutUrl),
      availability: "https://schema.org/InStock",
    })),
  };
}

export function buildFaqStructuredData(payload: { faqs: Array<{ question: string; answer: string }> }) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: payload.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildPersonStructuredData(input: {
  name: string;
  description?: string | null;
  image?: string | null;
  url: string;
  sameAs: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    url: absoluteUrl(input.url),
    sameAs: input.sameAs.length > 0 ? input.sameAs : undefined,
  };
}

import { absoluteUrl } from "@/lib/utils";
import type { BundleSalesPagePayload, BundleWithRelations, CourseWithRelations, GeneratedSalesPagePayload } from "@/types";
import { LEGAL_COMPANY } from "@/lib/legal/company";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";

export function buildCourseStructuredData(course: CourseWithRelations, payload: GeneratedSalesPagePayload) {
  const offers = payload.offers.map((price) => ({
    "@type": "Offer",
    price: price.price.replace(/[^0-9.]/g, ""),
    priceCurrency: price.currency,
    url: absoluteUrl(price.checkoutUrl),
    availability: "https://schema.org/InStock",
  }));

  const approvedReviews = payload.testimonialsSection.items.filter((item) => item.quote && item.rating > 0);
  const aggregateRating =
    approvedReviews.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number((approvedReviews.reduce((sum, item) => sum + item.rating, 0) / approvedReviews.length).toFixed(1)),
          reviewCount: approvedReviews.length,
        }
      : undefined;
  const review =
    approvedReviews.length > 0
      ? approvedReviews.map((item) => ({
          "@type": "Review",
          reviewBody: item.quote,
          reviewRating: {
            "@type": "Rating",
            ratingValue: item.rating,
          },
          author: {
            "@type": "Person",
            name: item.name ?? "Student",
          },
        }))
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    url: absoluteUrl(resolveCoursePublicPath(course)),
    description: course.shortDescription ?? course.longDescription ?? course.title,
    image: course.heroImageUrl ? [course.heroImageUrl] : undefined,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    instructor: {
      "@type": "Person",
      name: course.instructor.name,
      url: absoluteUrl(`/instructors/${course.instructor.slug}`),
    },
    hasCourseInstance: offers.length > 0 ? offers : undefined,
    aggregateRating,
    review,
  };
}

export function buildProductStructuredData(course: CourseWithRelations, payload: GeneratedSalesPagePayload) {
  const approvedReviews = payload.testimonialsSection.items.filter((item) => item.quote && item.rating > 0);
  const aggregateRating =
    approvedReviews.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number((approvedReviews.reduce((sum, item) => sum + item.rating, 0) / approvedReviews.length).toFixed(1)),
          reviewCount: approvedReviews.length,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: course.title,
    url: absoluteUrl(payload.hero.secondaryCtaHref),
    description: course.shortDescription ?? course.longDescription ?? course.title,
    image: course.heroImageUrl ? [course.heroImageUrl] : undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: payload.offers.map((price) => ({
      "@type": "Offer",
      price: price.price.replace(/[^0-9.]/g, ""),
      priceCurrency: price.currency,
      url: absoluteUrl(price.checkoutUrl),
      availability: "https://schema.org/InStock",
    })),
    aggregateRating,
  };
}

export function buildBundleProductStructuredData(bundle: BundleWithRelations, payload: BundleSalesPagePayload) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bundle.title,
    url: absoluteUrl(resolveBundlePublicPath(bundle)),
    description: bundle.shortDescription ?? bundle.longDescription ?? bundle.title,
    image: bundle.heroImageUrl ? [bundle.heroImageUrl] : undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
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

export function buildOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: LEGAL_COMPANY.legalName,
    url: absoluteUrl("/"),
    email: LEGAL_COMPANY.supportEmail,
    description: SITE_DESCRIPTION,
  };
}

export function buildWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/courses")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbStructuredData(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildItemListStructuredData(input: {
  name: string;
  path: string;
  items: Array<{ name: string; path: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(input.path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}

export function buildProfilePageStructuredData(input: {
  name: string;
  path: string;
  description?: string | null;
  image?: string | null;
  sameAs: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: input.name,
    url: absoluteUrl(input.path),
    about: {
      "@type": "Person",
      name: input.name,
      description: input.description ?? undefined,
      image: input.image ?? undefined,
      url: absoluteUrl(input.path),
      sameAs: input.sameAs.length > 0 ? input.sameAs : undefined,
    },
  };
}

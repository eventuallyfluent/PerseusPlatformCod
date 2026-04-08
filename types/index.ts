import { Prisma } from "@prisma/client";

export type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    instructor: true;
    modules: {
      include: {
        lessons: true;
      };
      orderBy: {
        position: "asc";
      };
    };
    faqs: {
      orderBy: {
        position: "asc";
      };
    };
    testimonials: {
      orderBy: {
        position: "asc";
      };
    };
    offers: {
      include: {
        prices: true;
      };
    };
    pages: true;
  };
}>;

export type BundleWithRelations = Prisma.BundleGetPayload<{
  include: {
    courses: {
      include: {
        course: {
          include: {
            instructor: true;
            offers: {
              include: {
                prices: true;
              };
            };
          };
        };
      };
      orderBy: {
        position: "asc";
      };
    };
    faqs: {
      orderBy: {
        position: "asc";
      };
    };
    testimonials: {
      orderBy: {
        position: "asc";
      };
    };
    offers: {
      include: {
        prices: true;
      };
    };
    pages: true;
  };
}>;

export type SalesPageSectionKey =
  | "description"
  | "highlights"
  | "curriculum"
  | "included-courses"
  | "instructor"
  | "testimonials"
  | "faqs"
  | "pricing";

export type SalesPageConfig = {
  heroMetadataLine?: string | null;
  primaryCtaLabel?: string | null;
  secondaryCtaLabel?: string | null;
  sectionOrder?: SalesPageSectionKey[];
  hiddenSections?: SalesPageSectionKey[];
  pricingBadge?: string | null;
  pricingHeadline?: string | null;
  pricingBody?: string | null;
  finalCtaLabel?: string | null;
  finalCtaBody?: string | null;
};

export type SalesPageOfferSummary = {
  offerId: string;
  name: string;
  price: string;
  currency: string;
  checkoutUrl: string;
  compareAtPrice?: string | null;
  savingsLabel?: string | null;
};

type SalesPageBasePayload = {
  version: "v2";
  productType: "course" | "bundle";
  hero: {
    eyebrow: string;
    metadataLine?: string | null;
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    primaryOffer?: SalesPageOfferSummary | null;
  };
  media: {
    salesVideoUrl?: string | null;
  };
  sections: {
    order: SalesPageSectionKey[];
    hidden: SalesPageSectionKey[];
  };
  descriptionSection: {
    eyebrow: string;
    title: string;
    shortDescription?: string | null;
    longDescription?: string | null;
  };
  highlightsSection: {
    eyebrow: string;
    cards: Array<{
      id: "outcomes" | "audience" | "includes";
      title: string;
      items: string[];
    }>;
  };
  testimonialsSection: {
    eyebrow: string;
    title: string;
    items: {
      name?: string | null;
      quote: string;
      rating: number;
      source?: string | null;
    }[];
  };
  faqSection: {
    eyebrow: string;
    title: string;
    items: {
      question: string;
      answer: string;
    }[];
  };
  pricingSection: {
    eyebrow: string;
    badge: string;
    headline: string;
    body: string;
    offers: SalesPageOfferSummary[];
  };
  finalCta: {
    label: string;
    body: string;
  };
  offers: SalesPageOfferSummary[];
};

export type GeneratedSalesPagePayload = SalesPageBasePayload & {
  productType: "course";
  curriculumSection: {
    eyebrow: string;
    title: string;
    body?: string | null;
    modules: {
      moduleTitle: string;
      lessonCount: number;
      lessons: {
        title: string;
        isPreview: boolean;
        previewHref?: string | null;
        type: string;
        durationLabel?: string | null;
        dripDays?: number | null;
      }[];
    }[];
  };
  instructorSection: {
    eyebrow: string;
    title: string;
    body?: string | null;
    name: string;
    imageUrl?: string | null;
    shortBio?: string | null;
    socialLinks: { label: string; url: string }[];
    pageUrl: string;
  };
};

export type BundleSalesPagePayload = SalesPageBasePayload & {
  productType: "bundle";
  includedCoursesSection: {
    eyebrow: string;
    title: string;
    body: string;
    courses: {
      title: string;
      subtitle?: string | null;
      instructorName?: string | null;
      courseUrl: string;
    }[];
  };
};

export type CanonicalPaymentEvent =
  | "payment.succeeded"
  | "payment.failed"
  | "subscription.started"
  | "subscription.renewed"
  | "refund.created";

export type GatewayCredentialField = {
  key: string;
  label: string;
  inputType: "text" | "password";
  required: boolean;
  secret: boolean;
  description?: string;
};

export type GatewayCapabilities = {
  supportsSubscriptions: boolean;
  supportsRefunds: boolean;
  supportsPaymentPlans: boolean;
  supportsHostedCheckout: boolean;
};

export interface PaymentGatewayConnector {
  provider: string;
  displayName: string;
  credentialFields: GatewayCredentialField[];
  capabilities: GatewayCapabilities;
  createCheckoutSession(input: {
    offerId: string;
    orderId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    amountOverride?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    checkoutUrl: string;
    externalSessionId?: string;
  }>;
  testConnection(input: {
    credentials: Record<string, string>;
  }): Promise<{
    ok: boolean;
    provider: string;
    webhookInstructions: string;
  }>;
  getWebhookInstructions(): string;
  verifyWebhookSignature(input: {
    headers: Headers;
    rawBody: string;
    secret: string;
  }): Promise<boolean>;
  parseWebhookEvent(input: {
    headers: Headers;
    rawBody: string;
  }): Promise<{
    externalEventId?: string;
    eventType: string;
    canonicalEvent?: CanonicalPaymentEvent;
    payload: unknown;
  }>;
}

export type DryRunResult<Row> = {
  validRows: Row[];
  invalidRows: Array<{ index: number; errors: string[]; row: Row }>;
};

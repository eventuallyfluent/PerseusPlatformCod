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

export type GeneratedSalesPagePayload = {
  hero: {
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    ctaLabel: string;
  };
  video: {
    salesVideoUrl?: string | null;
  };
  description: {
    shortDescription?: string | null;
    longDescription?: string | null;
  };
  outcomes: string[];
  audience: string[];
  includes: string[];
  curriculum: {
    moduleTitle: string;
    lessons: { title: string; isPreview: boolean }[];
  }[];
  instructor: {
    name: string;
    imageUrl?: string | null;
    shortBio?: string | null;
    socialLinks: { label: string; url: string }[];
    pageUrl: string;
  };
  testimonials: {
    name?: string | null;
    quote: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  pricing: {
    offerId: string;
    price: string;
    currency: string;
    checkoutUrl: string;
  }[];
  finalCta: {
    label: string;
  };
};

export type BundleSalesPagePayload = {
  hero: {
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    ctaLabel: string;
  };
  video: {
    salesVideoUrl?: string | null;
  };
  description: {
    shortDescription?: string | null;
    longDescription?: string | null;
  };
  outcomes: string[];
  audience: string[];
  includes: string[];
  includedCourses: {
    title: string;
    subtitle?: string | null;
    instructorName?: string | null;
    courseUrl: string;
  }[];
  testimonials: {
    name?: string | null;
    quote: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  pricing: {
    offerId: string;
    price: string;
    currency: string;
    checkoutUrl: string;
  }[];
  finalCta: {
    label: string;
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

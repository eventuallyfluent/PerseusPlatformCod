import type { HomepageSectionType } from "@prisma/client";
import { LEGAL_COMPANY, LEGAL_PAGE_LINKS } from "@/lib/legal/company";

export type HomepageHeroPayload = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type HomepageCollectionsPayload = {
  eyebrow: string;
  title: string;
  description: string;
  featuredCollectionIds?: string[];
};

export type HomepageTestimoniesPayload = {
  eyebrow: string;
  title: string;
  description?: string;
  sourceMode?: "selected" | "latest-approved";
  selectedTestimonialIds: string[];
};

export type HomepageEmailSignupPayload = {
  eyebrow: string;
  title: string;
  description: string;
  inputPlaceholder: string;
  buttonLabel: string;
  formActionUrl: string;
  legalText: string;
};

export type HomepageLinkItem = {
  label: string;
  href: string;
};

export type HomepageFooterPayload = {
  brandTitle: string;
  brandSubtitle: string;
  brandDescription: string;
  platformHeading: string;
  platformLinks: HomepageLinkItem[];
  legalHeading: string;
  legalLinks: HomepageLinkItem[];
  socialLabels: string[];
  bottomLeftText: string;
  bottomRightText: string;
  themeFamily?: "original" | "modern";
};

export type HomepageSectionPayloadMap = {
  HERO: HomepageHeroPayload;
  COLLECTIONS: HomepageCollectionsPayload;
  TESTIMONIES: HomepageTestimoniesPayload;
  EMAIL_SIGNUP: HomepageEmailSignupPayload;
  FOOTER: HomepageFooterPayload;
};

export type HomepageSectionRecord<T extends HomepageSectionType = HomepageSectionType> = {
  type: T;
  enabled: boolean;
  position: number;
  payload: HomepageSectionPayloadMap[T];
};

export const HOMEPAGE_SECTION_ORDER: HomepageSectionType[] = [
  "HERO",
  "COLLECTIONS",
  "TESTIMONIES",
  "EMAIL_SIGNUP",
  "FOOTER",
];

export function defaultHomepageSections(): HomepageSectionRecord[] {
  return [
    {
      type: "HERO",
      enabled: true,
      position: 1,
      payload: {
        eyebrow: "Perseus Arcane Academy",
        title: "PERSEUS ARCANE ACADEMY",
        description:
          "A structured academy for tarot, ritual, symbolism, and serious magical study. Enter through a course, then continue through a path designed for real practice.",
        primaryCtaLabel: "Explore Courses",
        primaryCtaHref: "/courses",
        secondaryCtaLabel: "See Instructors",
        secondaryCtaHref: "/instructors",
      },
    },
    {
      type: "COLLECTIONS",
      enabled: true,
      position: 2,
      payload: {
        eyebrow: "Collections",
        title: "Perseus study collections",
        description: "Enter the academy through a collection of courses that feels closest to your current line of study.",
        featuredCollectionIds: [],
      },
    },
    {
      type: "TESTIMONIES",
      enabled: true,
      position: 3,
      payload: {
        eyebrow: "Testimonies",
        title: "What students say after entering the work",
        description: "",
        sourceMode: "latest-approved",
        selectedTestimonialIds: [],
      },
    },
    {
      type: "EMAIL_SIGNUP",
      enabled: true,
      position: 4,
      payload: {
        eyebrow: "Stay in the loop",
        title: "Stay close to the work.",
        description: "Keep track of new course releases, collection updates, and Perseus study announcements.",
        inputPlaceholder: "your@email.com",
        buttonLabel: "Join Free",
        formActionUrl: "/login",
        legalText: "By subscribing you agree to our Privacy Policy. Unsubscribe any time.",
      },
    },
    {
      type: "FOOTER",
      enabled: true,
      position: 5,
      payload: {
        brandTitle: "Perseus Arcane Academy",
        brandSubtitle: "Structured magical training",
        brandDescription: "Ancient wisdom for the modern initiate. Structured courses in Hermetics, esoteric traditions, and martial arts.",
        platformHeading: "Browse",
        platformLinks: [
          { label: "Courses", href: "/courses" },
          { label: "Instructors", href: "/instructors" },
          { label: "FAQ", href: "/faq" },
          { label: "Login", href: "/login" },
        ],
        legalHeading: "Legal",
        legalLinks: [...LEGAL_PAGE_LINKS],
        socialLabels: ["X", "IG", "YT", "TT"],
        bottomLeftText: `(c) 2026 ${LEGAL_COMPANY.legalName}, DBA ${LEGAL_COMPANY.dbaName}. All rights reserved.`,
        bottomRightText: `Support: ${LEGAL_COMPANY.supportEmail}`,
      },
    },
  ];
}

export function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseLinkLines(value: string): HomepageLinkItem[] {
  return parseLines(value).map((line) => {
    const [label, href] = line.split("|").map((part) => part.trim());
    return {
      label: label || "",
      href: href || "#",
    };
  });
}

export function stringifyLinkLines(links: HomepageLinkItem[]) {
  return links.map((link) => `${link.label}|${link.href}`).join("\n");
}

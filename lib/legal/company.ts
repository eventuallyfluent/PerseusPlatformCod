export const LEGAL_COMPANY = {
  legalName: "Watson Ellis LLC",
  dbaName: "Perseus Arcane Academy",
  jurisdiction: "United States",
  supportEmail: "contact@perseusarcaneacademy.com",
  legalEmail: "contact@perseusarcaneacademy.com",
  supportHours: "Monday through Friday, 9:00 AM to 5:00 PM U.S. business time",
  businessAddressLines: [] as string[],
};

export const LEGAL_PAGE_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Fulfillment Policy", href: "/fulfillment" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Contact", href: "/contact" },
  { label: "Payment Disclosures", href: "/payment-disclosures" },
] as const;

const footerLegalHrefByLabel: Record<string, string> = {
  "privacy policy": "/privacy",
  privacy: "/privacy",
  "terms of service": "/terms",
  terms: "/terms",
  "refund policy": "/refund-policy",
  refunds: "/refund-policy",
  "cookie policy": "/cookie-policy",
  cookies: "/cookie-policy",
  contact: "/contact",
  "payment disclosures": "/payment-disclosures",
  "fulfillment policy": "/fulfillment",
  "gdpr data request": "/privacy#data-rights",
};

export function resolveLegalLink(label: string, href: string) {
  const normalizedLabel = label.trim().toLowerCase();

  if (!href || href === "#") {
    return footerLegalHrefByLabel[normalizedLabel] ?? href;
  }

  return href;
}

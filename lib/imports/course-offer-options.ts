import { OfferType } from "@prisma/client";

export type ImportedCourseOfferOption = {
  name: string;
  type: OfferType;
  price: number;
  currency: string;
  compareAtPrice?: number | null;
  billingInterval?: "month" | "year" | null;
};

function parseMoney(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function normalizeCurrency(currency: string) {
  return (currency || "USD").trim().toUpperCase();
}

function inferOfferFromText(text: string, currency: string, compareAtPrice?: number | null): ImportedCourseOfferOption | null {
  const price = parseMoney(text);
  if (price === null || Number.isNaN(price) || price < 0) {
    return null;
  }

  const normalized = text.toLowerCase();
  const isMonthly = /\b(month|monthly|per month|\/\s*mo|\/\s*month)\b/.test(normalized);
  const isYearlySubscription = /\b(yearly subscription|annual subscription|per year|\/\s*year|\/\s*yr|annually)\b/.test(normalized);
  const isAnnual = /\b(year|yearly|annual|annually|12\s*month)\b/.test(normalized);
  const isOneOff = /\b(one[\s-]?off|one[\s-]?time|lifetime|single payment|pay in full|full payment)\b/.test(normalized);

  if (isMonthly) {
    return {
      name: "Monthly subscription",
      type: OfferType.SUBSCRIPTION,
      price,
      currency,
      compareAtPrice: null,
      billingInterval: "month",
    };
  }

  if (isYearlySubscription) {
    return {
      name: "Annual subscription",
      type: OfferType.SUBSCRIPTION,
      price,
      currency,
      compareAtPrice,
      billingInterval: "year",
    };
  }

  if (isAnnual) {
    return {
      name: "Annual access",
      type: OfferType.ONE_TIME,
      price,
      currency,
      compareAtPrice,
      billingInterval: null,
    };
  }

  if (isOneOff) {
    return {
      name: "One-off payment",
      type: OfferType.ONE_TIME,
      price,
      currency,
      compareAtPrice,
      billingInterval: null,
    };
  }

  return null;
}

function splitOfferText(value: string) {
  return value
    .split(/\s+(?:\/|or|\+|and)\s+|\s*[|;]\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseExplicitOfferOption(value: string, currency: string): ImportedCourseOfferOption | null {
  const parts = value
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const price = parseMoney(parts[1]);
  if (price === null || Number.isNaN(price) || price < 0) {
    return null;
  }

  const rawType = (parts[2] ?? "").toUpperCase().replace(/[\s-]+/g, "_");
  const type = rawType === OfferType.SUBSCRIPTION || rawType === OfferType.PAYMENT_PLAN ? rawType : OfferType.ONE_TIME;
  const interval = (parts[3] ?? "").toLowerCase();
  const billingInterval = interval === "month" || interval === "monthly" ? "month" : interval === "year" || interval === "annual" || interval === "yearly" ? "year" : null;

  return {
    name: parts[0],
    type,
    price,
    currency,
    compareAtPrice: null,
    billingInterval: type === OfferType.SUBSCRIPTION ? billingInterval ?? "month" : null,
  };
}

export function parseImportedCourseOfferOptions(input: {
  title: string;
  price: number;
  priceText?: string | null;
  currency: string;
  compareAtPrice?: number | null;
  offerOptions?: string | null;
}): ImportedCourseOfferOption[] {
  const currency = normalizeCurrency(input.currency);

  const explicitOptions = String(input.offerOptions ?? "")
    .split("|")
    .map((part) => parseExplicitOfferOption(part, currency))
    .filter((option): option is ImportedCourseOfferOption => Boolean(option));

  if (explicitOptions.length > 0) {
    return explicitOptions;
  }

  const parsedFromText = splitOfferText(String(input.priceText ?? ""))
    .map((part) => inferOfferFromText(part, currency, input.compareAtPrice))
    .filter((option): option is ImportedCourseOfferOption => Boolean(option));

  const unique = new Map<string, ImportedCourseOfferOption>();
  for (const option of parsedFromText) {
    unique.set(`${option.name}:${option.price}:${option.type}`, option);
  }

  if (unique.size > 0) {
    return [...unique.values()];
  }

  return [
    {
      name: `${input.title} access`,
      type: OfferType.ONE_TIME,
      price: input.price,
      currency,
      compareAtPrice: input.compareAtPrice,
      billingInterval: null,
    },
  ];
}

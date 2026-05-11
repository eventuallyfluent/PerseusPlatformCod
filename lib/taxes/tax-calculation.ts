import { TaxRateRuleType, type Offer, type Price, type TaxRate, type TaxSetting } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type TaxLocationInput = {
  country?: string | null;
  region?: string | null;
  postalCode?: string | null;
};

export type TaxCalculationLine = {
  taxRateId: string | null;
  label: string;
  jurisdiction: string;
  ratePercent: number;
  amount: number;
};

export type TaxCalculationResult = {
  settings: TaxSetting;
  taxMode: "not_collected" | "provider_collected" | "platform_added" | "platform_included";
  requiresLocation: boolean;
  subtotalAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: TaxCalculationLine[];
};

type TaxableOffer = Offer & {
  prices?: Price[];
};

function roundCurrency(amount: number) {
  return Math.max(0, Number(amount.toFixed(2)));
}

function normalizeCountry(value?: string | null) {
  return value?.trim().toUpperCase() || null;
}

function normalizeRegion(value?: string | null) {
  return value?.trim().toUpperCase() || null;
}

function normalizePostal(value?: string | null) {
  return value?.trim().toUpperCase().replace(/\s+/g, "") || null;
}

export async function getTaxSettings() {
  return prisma.taxSetting.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  });
}

function appliesToOffer(rate: TaxRate, offer: TaxableOffer) {
  if (offer.type === "SUBSCRIPTION" && !rate.appliesToSubscriptions) return false;
  if (offer.courseId && !rate.appliesToCourses) return false;
  if (offer.bundleId && !rate.appliesToBundles) return false;
  if (offer.accessProductId && !rate.appliesToAccessProducts) return false;
  return true;
}

function rankRate(rate: TaxRate, region: string | null, postalCode: string | null) {
  if (rate.postalCode && postalCode && normalizePostal(rate.postalCode) === postalCode) return 3;
  if (rate.region && region && normalizeRegion(rate.region) === region) return 2;
  if (!rate.region && !rate.postalCode) return 1;
  return 0;
}

export async function calculatePlatformTax(input: {
  amountAfterDiscount: number;
  offer: TaxableOffer;
  location?: TaxLocationInput;
}) {
  const settings = await getTaxSettings();
  const subtotalAmount = roundCurrency(input.amountAfterDiscount);
  const country = normalizeCountry(input.location?.country);
  const region = normalizeRegion(input.location?.region);
  const postalCode = normalizePostal(input.location?.postalCode);

  if (!settings.enabled) {
    return {
      settings,
      taxMode: "not_collected" as const,
      requiresLocation: false,
      subtotalAmount,
      taxableAmount: subtotalAmount,
      taxAmount: 0,
      totalAmount: subtotalAmount,
      lines: [],
    };
  }

  if (!country) {
    return {
      settings,
      taxMode: settings.pricesIncludeTax ? ("platform_included" as const) : ("platform_added" as const),
      requiresLocation: settings.requireTaxLocation || settings.collectForAllCountries,
      subtotalAmount,
      taxableAmount: subtotalAmount,
      taxAmount: 0,
      totalAmount: subtotalAmount,
      lines: [],
    };
  }

  const candidateRates = (
    await prisma.taxRate.findMany({
      where: {
        isActive: true,
        country,
      },
      orderBy: [{ postalCode: "desc" }, { region: "desc" }, { createdAt: "asc" }],
    })
  ).filter((rate) => appliesToOffer(rate, input.offer));

  const ranked = candidateRates
    .map((rate) => ({ rate, rank: rankRate(rate, region, postalCode) }))
    .filter((item) => item.rank > 0)
    .sort((left, right) => right.rank - left.rank);

  const bestRank = ranked[0]?.rank ?? 0;
  const matchingRates =
    bestRank > 1
      ? ranked.filter((item) => item.rank === bestRank).map((item) => item.rate)
      : ranked.map((item) => item.rate);
  const replacementRates = matchingRates.filter((rate) => rate.ruleType === TaxRateRuleType.REPLACE);
  const appliedRates = replacementRates.length > 0 ? replacementRates : matchingRates;
  const totalRate = appliedRates.reduce((sum, rate) => sum + Number(rate.ratePercent), 0);
  const taxableAmount = settings.pricesIncludeTax && totalRate > 0 ? roundCurrency(subtotalAmount / (1 + totalRate / 100)) : subtotalAmount;
  const taxAmount = settings.pricesIncludeTax
    ? roundCurrency(subtotalAmount - taxableAmount)
    : roundCurrency((taxableAmount * totalRate) / 100);
  const totalAmount = settings.pricesIncludeTax ? subtotalAmount : roundCurrency(subtotalAmount + taxAmount);

  return {
    settings,
    taxMode: settings.pricesIncludeTax ? ("platform_included" as const) : ("platform_added" as const),
    requiresLocation: false,
    subtotalAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
    lines: appliedRates.map((rate) => {
      const ratePercent = Number(rate.ratePercent);
      const amount = totalRate > 0 ? roundCurrency((taxAmount * ratePercent) / totalRate) : 0;
      const jurisdiction = [rate.country, rate.region, rate.postalCode].filter(Boolean).join("-");

      return {
        taxRateId: rate.id,
        label: rate.label || settings.defaultTaxName,
        jurisdiction,
        ratePercent,
        amount,
      };
    }),
  };
}

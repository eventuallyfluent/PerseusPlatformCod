import { UpsellDiscountType } from "@prisma/client";
import { currencyFormatter } from "@/lib/utils";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { getOfferById } from "@/lib/offers/get-offer-by-id";

type OfferRecord = NonNullable<Awaited<ReturnType<typeof getOfferById>>>;

function roundCurrency(amount: number) {
  return Math.max(0, Number(amount.toFixed(2)));
}

function toNumber(value: unknown) {
  return value === null || value === undefined ? 0 : Number(value);
}

export function calculateUpsellDiscountAmount(baseAmount: number, type: UpsellDiscountType, value: number) {
  if (type === UpsellDiscountType.AMOUNT) {
    return roundCurrency(Math.min(baseAmount, value));
  }

  if (type === UpsellDiscountType.PERCENT) {
    return roundCurrency(Math.min(baseAmount, (baseAmount * value) / 100));
  }

  return 0;
}

export function buildConfiguredUpsell(sourceOffer: OfferRecord) {
  const sourceCourse = sourceOffer.course;
  const sourceBundle = sourceOffer.bundle;
  const sourceProduct = sourceCourse ?? sourceBundle;

  if (!sourceProduct) {
    return null;
  }

  const targetCourse = sourceCourse?.upsellCourse ?? sourceBundle?.upsellCourse ?? null;
  const targetBundle = sourceCourse?.upsellBundle ?? sourceBundle?.upsellBundle ?? null;

  if (targetCourse) {
    const targetOffer = getPrimaryOffer(targetCourse.offers);

    if (!targetOffer?.isPublished) {
      return null;
    }

    const baseAmount = toNumber(targetCourse.price);
    const discountValue = toNumber(sourceProduct.upsellDiscountValue);
    const discountAmount = calculateUpsellDiscountAmount(baseAmount, sourceProduct.upsellDiscountType, discountValue);
    const discountedAmount = roundCurrency(baseAmount - discountAmount);

    return {
      targetOfferId: targetOffer.id,
      targetCourseId: targetCourse.id,
      targetBundleId: null,
      title: sourceProduct.upsellHeadline || targetCourse.title,
      subtitle:
        sourceProduct.upsellBody ||
        targetCourse.subtitle ||
        targetCourse.shortDescription ||
        "Add this course before you complete checkout.",
      originalPrice: currencyFormatter(baseAmount, targetCourse.currency),
      price: currencyFormatter(discountedAmount, targetCourse.currency),
      savingsLabel:
        discountAmount > 0
          ? sourceProduct.upsellDiscountType === UpsellDiscountType.PERCENT
            ? `${discountValue}% off`
            : `${currencyFormatter(discountAmount, targetCourse.currency)} off`
          : null,
      href: `/checkout/${targetOffer.id}?upsellFrom=${encodeURIComponent(sourceOffer.id)}`,
      label: sourceBundle ? "Add this course" : "Add this course",
      discountAmount,
    };
  }

  if (targetBundle) {
    const targetOffer = getPrimaryOffer(targetBundle.offers);

    if (!targetOffer?.isPublished) {
      return null;
    }

    const baseAmount = toNumber(targetBundle.price);
    const discountValue = toNumber(sourceProduct.upsellDiscountValue);
    const discountAmount = calculateUpsellDiscountAmount(baseAmount, sourceProduct.upsellDiscountType, discountValue);
    const discountedAmount = roundCurrency(baseAmount - discountAmount);

    return {
      targetOfferId: targetOffer.id,
      targetCourseId: null,
      targetBundleId: targetBundle.id,
      title: sourceProduct.upsellHeadline || targetBundle.title,
      subtitle:
        sourceProduct.upsellBody ||
        targetBundle.subtitle ||
        targetBundle.shortDescription ||
        "Upgrade into the wider bundle before you pay.",
      originalPrice: currencyFormatter(baseAmount, targetBundle.currency),
      price: currencyFormatter(discountedAmount, targetBundle.currency),
      savingsLabel:
        discountAmount > 0
          ? sourceProduct.upsellDiscountType === UpsellDiscountType.PERCENT
            ? `${discountValue}% off`
            : `${currencyFormatter(discountAmount, targetBundle.currency)} off`
          : null,
      href: `/checkout/${targetOffer.id}?upsellFrom=${encodeURIComponent(sourceOffer.id)}`,
      label: "Upgrade to bundle",
      discountAmount,
    };
  }

  return null;
}

export async function resolveAppliedUpsellDiscount(targetOffer: OfferRecord, sourceOfferId?: string | null) {
  if (!sourceOfferId) {
    return null;
  }

  const sourceOffer = await getOfferById(sourceOfferId);

  if (!sourceOffer) {
    return null;
  }

  const configuredUpsell = buildConfiguredUpsell(sourceOffer);

  if (!configuredUpsell) {
    return null;
  }

  const targetCourseId = targetOffer.course?.id ?? null;
  const targetBundleId = targetOffer.bundle?.id ?? null;
  const matchesCourse = configuredUpsell.targetCourseId && configuredUpsell.targetCourseId === targetCourseId;
  const matchesBundle = configuredUpsell.targetBundleId && configuredUpsell.targetBundleId === targetBundleId;

  if (!matchesCourse && !matchesBundle) {
    return null;
  }

  return {
    sourceOfferId: sourceOffer.id,
    discountAmount: configuredUpsell.discountAmount,
    originalPrice: configuredUpsell.originalPrice,
    savingsLabel: configuredUpsell.savingsLabel,
  };
}

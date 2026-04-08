import { Decimal } from "@prisma/client/runtime/library";
import { resolveCoupon } from "@/lib/coupons/resolve-coupon";
import type { Prisma } from "@prisma/client";

type PricingOffer = Prisma.OfferGetPayload<{
  include: {
    course: {
      include: {
        collectionCourses: true;
      };
    };
    bundle: true;
  };
}>;

function toNumber(value: Decimal | number | string) {
  return typeof value === "number" ? value : Number(value);
}

function roundCurrency(amount: number) {
  return Math.max(0, Number(amount.toFixed(2)));
}

export async function buildCheckoutPricing(input: {
  baseAmount: Decimal | number | string;
  couponCode?: string | null;
  upsellDiscountAmount?: number;
  offer?: PricingOffer | null;
}) {
  const baseAmount = roundCurrency(toNumber(input.baseAmount));
  const upsellDiscountAmount = roundCurrency(Math.min(baseAmount, input.upsellDiscountAmount ?? 0));
  const couponBaseAmount = roundCurrency(baseAmount - upsellDiscountAmount);
  const coupon = await resolveCoupon(input.couponCode, input.offer);

  if (!coupon) {
    return {
      baseAmount,
      totalAmount: couponBaseAmount,
      discountAmount: 0,
      upsellDiscountAmount,
      coupon: null,
    };
  }

  const amountOff = coupon.amountOff ? toNumber(coupon.amountOff) : 0;
  const percentOff = coupon.percentOff ? (couponBaseAmount * coupon.percentOff) / 100 : 0;
  const discountAmount = roundCurrency(Math.min(couponBaseAmount, amountOff || percentOff));

  return {
    baseAmount,
    totalAmount: roundCurrency(couponBaseAmount - discountAmount),
    discountAmount,
    upsellDiscountAmount,
    coupon,
  };
}

import { Decimal } from "@prisma/client/runtime/library";
import { resolveCoupon } from "@/lib/coupons/resolve-coupon";

function toNumber(value: Decimal | number | string) {
  return typeof value === "number" ? value : Number(value);
}

function roundCurrency(amount: number) {
  return Math.max(0, Number(amount.toFixed(2)));
}

export async function buildCheckoutPricing(input: {
  baseAmount: Decimal | number | string;
  couponCode?: string | null;
}) {
  const baseAmount = roundCurrency(toNumber(input.baseAmount));
  const coupon = await resolveCoupon(input.couponCode);

  if (!coupon) {
    return {
      baseAmount,
      totalAmount: baseAmount,
      discountAmount: 0,
      coupon: null,
    };
  }

  const amountOff = coupon.amountOff ? toNumber(coupon.amountOff) : 0;
  const percentOff = coupon.percentOff ? (baseAmount * coupon.percentOff) / 100 : 0;
  const discountAmount = roundCurrency(Math.min(baseAmount, amountOff || percentOff));

  return {
    baseAmount,
    totalAmount: roundCurrency(baseAmount - discountAmount),
    discountAmount,
    coupon,
  };
}

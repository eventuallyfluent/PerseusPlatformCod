"use client";

import { useId, useState } from "react";

type CouponFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  couponId?: string;
  defaultCode?: string;
  defaultAmountOff?: string;
  defaultPercentOff?: string;
  defaultExpiresAt?: string;
  defaultIsActive?: boolean;
};

export function CouponForm({
  action,
  couponId,
  defaultCode = "",
  defaultAmountOff = "",
  defaultPercentOff = "",
  defaultExpiresAt = "",
  defaultIsActive = true,
}: CouponFormProps) {
  const formId = useId();
  const defaultType = defaultAmountOff ? "amount" : defaultPercentOff ? "percent" : "amount";
  const [discountType, setDiscountType] = useState<"amount" | "percent">(defaultType);
  const formElementId = couponId ? `coupon-form-${couponId}` : "new-coupon-form";

  return (
    <form id={formElementId} action={action} className="grid gap-3 md:grid-cols-2">
      {couponId ? <input type="hidden" name="couponId" value={couponId} /> : null}
      <label>
        Code
        <input name="code" defaultValue={defaultCode} required />
      </label>
      <label>
        Expires at
        <input name="expiresAt" type="date" defaultValue={defaultExpiresAt} />
      </label>

      <div className="space-y-3 md:col-span-2">
        <span className="text-sm font-medium text-stone-900">Discount type</span>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800">
            <input
              className="w-auto"
              type="radio"
              name="discountType"
              value="amount"
              checked={discountType === "amount"}
              onChange={() => setDiscountType("amount")}
            />
            Amount off
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800">
            <input
              className="w-auto"
              type="radio"
              name="discountType"
              value="percent"
              checked={discountType === "percent"}
              onChange={() => setDiscountType("percent")}
            />
            Percentage off
          </label>
        </div>
      </div>

      {discountType === "amount" ? (
        <label className="md:col-span-2" htmlFor={`${formId}-amount`}>
          Amount off
          <input id={`${formId}-amount`} name="amountOff" type="number" min="0.01" step="0.01" defaultValue={defaultAmountOff} required />
        </label>
      ) : (
        <label className="md:col-span-2" htmlFor={`${formId}-percent`}>
          Percentage off
          <input id={`${formId}-percent`} name="percentOff" type="number" min="1" max="100" step="1" defaultValue={defaultPercentOff} required />
        </label>
      )}

      <label className="flex items-center gap-3 text-stone-700 md:col-span-2">
        <input className="w-auto" name="isActive" type="checkbox" value="true" defaultChecked={defaultIsActive} />
        Active
      </label>

      {discountType === "amount" ? <input type="hidden" name="percentOff" value="" /> : <input type="hidden" name="amountOff" value="" />}
    </form>
  );
}

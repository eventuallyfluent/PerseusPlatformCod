"use client";

import { useId, useState } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type CouponFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  couponId?: string;
  defaultCode?: string;
  defaultScope?: "TOTAL_ORDER" | "PRODUCT" | "COLLECTION";
  defaultProductTarget?: string;
  defaultCollectionId?: string;
  defaultAmountOff?: string;
  defaultPercentOff?: string;
  defaultExpiresAt?: string;
  defaultIsActive?: boolean;
  courseOptions: SelectOption[];
  bundleOptions: SelectOption[];
  collectionOptions: SelectOption[];
};

export function CouponForm({
  action,
  couponId,
  defaultCode = "",
  defaultScope = "TOTAL_ORDER",
  defaultProductTarget = "",
  defaultCollectionId = "",
  defaultAmountOff = "",
  defaultPercentOff = "",
  defaultExpiresAt = "",
  defaultIsActive = true,
  courseOptions,
  bundleOptions,
  collectionOptions,
}: CouponFormProps) {
  const formId = couponId ? `coupon-form-${couponId}` : "new-coupon-form";
  const discountInputId = useId();
  const [scope, setScope] = useState<"TOTAL_ORDER" | "PRODUCT" | "COLLECTION">(defaultScope);
  const [discountType, setDiscountType] = useState<"amount" | "percent">(defaultAmountOff ? "amount" : "percent");

  return (
    <form id={formId} action={action} className="grid gap-5">
      {couponId ? <input type="hidden" name="couponId" value={couponId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-900">Apply coupon to</span>
          <select name="scope" value={scope} onChange={(event) => setScope(event.target.value as "TOTAL_ORDER" | "PRODUCT" | "COLLECTION")}>
            <option value="TOTAL_ORDER">Total order amount</option>
            <option value="PRODUCT">Specific product</option>
            <option value="COLLECTION">Specific collection</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-900">Coupon code</span>
          <input name="code" defaultValue={defaultCode} required placeholder="SAVE25" />
        </label>
      </div>

      {scope === "PRODUCT" ? (
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-900">Specific product</span>
          <select name="productTarget" defaultValue={defaultProductTarget}>
            <option value="">Select product</option>
            {courseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {bundleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="productTarget" value="" />
      )}

      {scope === "COLLECTION" ? (
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-900">Specific collection</span>
          <select name="collectionId" defaultValue={defaultCollectionId}>
            <option value="">Select collection</option>
            {collectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="collectionId" value="" />
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-900">Type</span>
          <select name="discountType" value={discountType} onChange={(event) => setDiscountType(event.target.value as "amount" | "percent")}>
            <option value="percent">Percentage discount</option>
            <option value="amount">Fixed amount discount</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-900">
            {discountType === "percent" ? "Percentage off buyers receive" : "Amount off buyers receive"}
          </span>
          <div className="flex overflow-hidden rounded-[18px] border border-stone-300 bg-white">
            <input
              id={discountInputId}
              name={discountType === "percent" ? "percentOff" : "amountOff"}
              type="number"
              min={discountType === "percent" ? "1" : "0.01"}
              max={discountType === "percent" ? "100" : undefined}
              step={discountType === "percent" ? "1" : "0.01"}
              defaultValue={discountType === "percent" ? defaultPercentOff : defaultAmountOff}
              required
              className="w-full border-0 px-4 py-3 text-sm text-stone-950 outline-none"
            />
            <span className="inline-flex min-w-[52px] items-center justify-center border-l border-stone-300 bg-stone-50 px-4 text-sm font-medium text-stone-600">
              {discountType === "percent" ? "%" : "$"}
            </span>
          </div>
          {discountType === "percent" ? <input type="hidden" name="amountOff" value="" /> : <input type="hidden" name="percentOff" value="" />}
        </label>
      </div>

      <details className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-stone-600">Advanced options</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-900">End date</span>
            <input name="expiresAt" type="date" defaultValue={defaultExpiresAt} />
          </label>
          <label className="flex items-center gap-3 text-stone-700 md:pt-8">
            <input className="w-auto" name="isActive" type="checkbox" value="true" defaultChecked={defaultIsActive} />
            Active
          </label>
        </div>
      </details>
    </form>
  );
}

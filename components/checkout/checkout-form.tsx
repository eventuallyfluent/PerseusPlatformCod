"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutForm({
  offerId,
  initialCouponCode = "",
  initialUpsellFromOfferId = "",
}: {
  offerId: string;
  initialCouponCode?: string;
  initialUpsellFromOfferId?: string;
}) {
  const [pending, setPending] = useState(false);
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-white">Coupon code</span>
        <input
          className="w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value)}
          name="coupon"
          placeholder="Optional coupon code"
        />
      </label>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-3 rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-[rgba(236,229,255,0.76)]">
        <p>Payment is completed on the active hosted checkout provider. Discounts are validated before redirect.</p>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(236,229,255,0.62)]">
          <span>Secure checkout</span>
          <span>Instant enrollment</span>
          <span>Coupon support</span>
        </div>
      </div>
      <Button
        type="button"
        className="w-full justify-center rounded-full bg-[linear-gradient(135deg,#d4a846,#8f2cff)] py-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(143,44,255,0.24)] hover:opacity-95"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);

          try {
            const response = await fetch("/api/checkout/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ offerId, couponCode, upsellFromOfferId: initialUpsellFromOfferId || undefined }),
            });
            const data = await response.json();

            if (!response.ok) {
              setError(data.error ?? "Checkout failed");
              return;
            }

            if (data.checkoutUrl) {
              window.location.href = data.checkoutUrl;
            }
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Redirecting..." : "Continue to payment"}
      </Button>
    </div>
  );
}

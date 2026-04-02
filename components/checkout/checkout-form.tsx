"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutForm({ offerId, initialCouponCode = "" }: { offerId: string; initialCouponCode?: string }) {
  const [pending, setPending] = useState(false);
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <label>
        Coupon code
        <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} name="coupon" placeholder="Optional coupon code" />
      </label>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <p className="text-sm leading-7 text-stone-600">Payment is completed on the active hosted checkout provider. Discounts are validated before redirect.</p>
      <Button
        type="button"
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
              body: JSON.stringify({ offerId, couponCode }),
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

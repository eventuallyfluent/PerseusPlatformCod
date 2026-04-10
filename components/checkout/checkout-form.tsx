"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckoutQuote = {
  baseLabel: string;
  upsellDiscountLabel: string | null;
  couponDiscountLabel: string | null;
  totalLabel: string;
  couponCode: string | null;
};

export function CheckoutForm({
  offerId,
  initialCouponCode = "",
  initialUpsellFromOfferId = "",
  initialQuote,
  submitLabel = "Continue to payment",
  paymentNote = "Discounts are verified before redirect. Payment finishes on the active hosted checkout provider.",
  children,
}: {
  offerId: string;
  initialCouponCode?: string;
  initialUpsellFromOfferId?: string;
  initialQuote: CheckoutQuote;
  submitLabel?: string;
  paymentNote?: string;
  children?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote>(initialQuote);

  useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote]);

  async function refreshQuote(nextCouponCode: string) {
    setQuoting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerId,
          couponCode: nextCouponCode || undefined,
          upsellFromOfferId: initialUpsellFromOfferId || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to validate coupon");
        return false;
      }

      setQuote(data.pricing);
      return true;
    } finally {
      setQuoting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-medium text-white">Coupon code</span>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            name="coupon"
            placeholder="Optional coupon code"
          />
          <Button
            type="button"
            variant="ghost"
            className="rounded-full border-white/10 bg-white/8 px-5 py-3 text-white hover:bg-white/12 hover:text-white"
            disabled={quoting || pending}
            onClick={async () => {
              await refreshQuote(couponCode.trim());
            }}
          >
            {quoting ? "Checking..." : "Apply coupon"}
          </Button>
        </div>
      </div>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 text-sm text-[rgba(236,229,255,0.84)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[rgba(236,229,255,0.62)]">Offer price</span>
            <span className="font-semibold text-white">{quote.baseLabel}</span>
          </div>
          {quote.upsellDiscountLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[rgba(236,229,255,0.62)]">Upsell discount</span>
              <span className="font-semibold text-emerald-300">{quote.upsellDiscountLabel}</span>
            </div>
          ) : null}
          {quote.couponDiscountLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[rgba(236,229,255,0.62)]">{quote.couponCode ? `Coupon (${quote.couponCode})` : "Coupon"}</span>
              <span className="font-semibold text-emerald-300">{quote.couponDiscountLabel}</span>
            </div>
          ) : null}
          <div className={cn("flex items-center justify-between gap-4 border-t border-white/10 pt-3", (quote.upsellDiscountLabel || quote.couponDiscountLabel) && "text-white")}>
            <span className="text-[rgba(236,229,255,0.68)]">Total due today</span>
            <span className="text-xl font-semibold text-white">{quote.totalLabel}</span>
          </div>
        </div>
      </div>
      {children}
      <p className="text-sm leading-6 text-[rgba(236,229,255,0.74)]">{paymentNote}</p>
      <Button
        type="button"
        className="w-full justify-center rounded-full bg-[linear-gradient(135deg,#d4a846,#8f2cff)] py-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(143,44,255,0.24)] hover:opacity-95"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);

          try {
            const quoteOk = await refreshQuote(couponCode.trim());

            if (!quoteOk) {
              return;
            }

            const response = await fetch("/api/checkout/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ offerId, couponCode: couponCode.trim() || undefined, upsellFromOfferId: initialUpsellFromOfferId || undefined }),
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
        {pending ? "Redirecting..." : submitLabel}
      </Button>
    </div>
  );
}

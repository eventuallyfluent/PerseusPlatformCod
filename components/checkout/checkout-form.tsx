"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckoutQuote = {
  baseLabel: string;
  upsellDiscountLabel: string | null;
  couponDiscountLabel: string | null;
  taxLabel?: string | null;
  taxMode?: string;
  requiresTaxLocation?: boolean;
  taxLines?: Array<{ label: string; jurisdiction: string; ratePercent: number; amountLabel: string }>;
  totalLabel: string;
  couponCode: string | null;
};

export function CheckoutForm({
  offerId,
  initialCouponCode = "",
  initialUpsellFromOfferId = "",
  initialQuote,
  submitLabel = "Continue to payment",
  pendingLabel = "Redirecting...",
  paymentNote = "Discounts are confirmed before redirect. Payment finishes through the active checkout provider.",
  children,
}: {
  offerId: string;
  initialCouponCode?: string;
  initialUpsellFromOfferId?: string;
  initialQuote: CheckoutQuote;
  submitLabel?: string;
  pendingLabel?: string;
  paymentNote?: string;
  children?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [taxCountry, setTaxCountry] = useState("");
  const [taxRegion, setTaxRegion] = useState("");
  const [taxPostalCode, setTaxPostalCode] = useState("");
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
          taxCountry: taxCountry || undefined,
          taxRegion: taxRegion || undefined,
          taxPostalCode: taxPostalCode || undefined,
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
      <div className="grid gap-3 rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Country</span>
          <input
            className="w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
            value={taxCountry}
            onChange={(event) => setTaxCountry(event.target.value.toUpperCase())}
            placeholder="US"
            maxLength={2}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">State/region</span>
          <input
            className="w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
            value={taxRegion}
            onChange={(event) => setTaxRegion(event.target.value.toUpperCase())}
            placeholder="CA"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Postal code</span>
          <input
            className="w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
            value={taxPostalCode}
            onChange={(event) => setTaxPostalCode(event.target.value.toUpperCase())}
            placeholder="Optional"
          />
        </label>
        {quote.requiresTaxLocation ? <p className="sm:col-span-3 text-sm text-amber-200">Enter your tax location to calculate the final checkout total.</p> : null}
      </div>
      <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 text-sm text-[rgba(236,229,255,0.84)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[rgba(236,229,255,0.62)]">Price</span>
            <span className="font-semibold text-white">{quote.baseLabel}</span>
          </div>
          {quote.upsellDiscountLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[rgba(236,229,255,0.62)]">Offer discount</span>
              <span className="font-semibold text-emerald-300">{quote.upsellDiscountLabel}</span>
            </div>
          ) : null}
          {quote.couponDiscountLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[rgba(236,229,255,0.62)]">{quote.couponCode ? `Coupon (${quote.couponCode})` : "Coupon"}</span>
              <span className="font-semibold text-emerald-300">{quote.couponDiscountLabel}</span>
            </div>
          ) : null}
          {quote.taxLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[rgba(236,229,255,0.62)]">Tax</span>
              <span className="font-semibold text-white">{quote.taxLabel}</span>
            </div>
          ) : null}
          {quote.taxLines?.map((line) => (
            <div key={`${line.jurisdiction}-${line.label}`} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-[rgba(236,229,255,0.52)]">{line.label} ({line.ratePercent}%)</span>
              <span className="font-semibold text-[rgba(236,229,255,0.78)]">{line.amountLabel}</span>
            </div>
          ))}
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
              body: JSON.stringify({
                offerId,
                couponCode: couponCode.trim() || undefined,
                upsellFromOfferId: initialUpsellFromOfferId || undefined,
                taxCountry: taxCountry || undefined,
                taxRegion: taxRegion || undefined,
                taxPostalCode: taxPostalCode || undefined,
              }),
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
        {pending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}

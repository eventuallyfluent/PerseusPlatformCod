"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  productTitle,
  productKind = "Checkout",
  productMeta,
  checkoutModeNote,
  initialCouponCode = "",
  initialUpsellFromOfferId = "",
  initialQuote,
  showTaxLocationInitially = false,
  submitLabel = "Continue to payment",
  pendingLabel = "Redirecting...",
  paymentNote = "Discounts are confirmed before redirect. Payment finishes through the active checkout provider.",
  children,
}: {
  offerId: string;
  productTitle: string;
  productKind?: string;
  productMeta?: { label: string; value: string } | null;
  checkoutModeNote?: string;
  initialCouponCode?: string;
  initialUpsellFromOfferId?: string;
  initialQuote: CheckoutQuote;
  showTaxLocationInitially?: boolean;
  submitLabel?: string;
  pendingLabel?: string;
  paymentNote?: string;
  children?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [couponOpen, setCouponOpen] = useState(Boolean(initialCouponCode));
  const [taxCountry, setTaxCountry] = useState("");
  const [taxRegion, setTaxRegion] = useState("");
  const [taxPostalCode, setTaxPostalCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote>(initialQuote);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const primaryButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote]);

  const shouldShowTaxLocation = showTaxLocationInitially || Boolean(quote.requiresTaxLocation);
  const taxSummaryLabel =
    quote.taxMode === "platform_included"
      ? "Tax included"
      : quote.taxMode === "provider_collected"
        ? "Tax"
        : "Tax";

  const refreshQuote = useCallback(async (nextCouponCode: string, errorTarget: "coupon" | "tax" | "checkout" = "checkout") => {
    setQuoting(true);
    setCouponError(null);
    setTaxError(null);
    setCheckoutError(null);

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
        const message = data.error ?? "Unable to update checkout total";
        if (errorTarget === "coupon") {
          setCouponError(message);
        } else if (errorTarget === "tax") {
          setTaxError(message);
        } else {
          setCheckoutError(message);
        }
        return false;
      }

      setQuote(data.pricing);
      return true;
    } finally {
      setQuoting(false);
    }
  }, [initialUpsellFromOfferId, offerId, taxCountry, taxPostalCode, taxRegion]);

  const startCheckout = useCallback(async () => {
    setPending(true);
    setCouponError(null);
    setTaxError(null);
    setCheckoutError(null);

    try {
      const quoteOk = await refreshQuote(couponCode.trim(), "checkout");

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
        const message = data.error ?? "Checkout failed";
        if (message.toLowerCase().includes("tax location")) {
          setTaxError("Enter your tax location to calculate the final checkout total.");
        } else {
          setCheckoutError(message);
        }
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } finally {
      setPending(false);
    }
  }, [couponCode, initialUpsellFromOfferId, offerId, refreshQuote, taxCountry, taxPostalCode, taxRegion]);

  useEffect(() => {
    if (!shouldShowTaxLocation) {
      return;
    }

    const handle = window.setTimeout(() => {
      void refreshQuote(couponCode.trim(), "tax");
    }, 550);

    return () => window.clearTimeout(handle);
  }, [couponCode, refreshQuote, shouldShowTaxLocation]);

  useEffect(() => {
    const button = primaryButtonRef.current;
    if (!button || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCta(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.2 },
    );

    observer.observe(button);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <div className="rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(228,216,255,0.72)]">{productKind}</p>
        <h1 className="mt-3 text-2xl leading-tight text-white [overflow-wrap:anywhere] sm:text-3xl">{productTitle}</h1>
        {checkoutModeNote ? <p className="mt-3 text-sm leading-6 text-[rgba(236,229,255,0.74)]">{checkoutModeNote}</p> : null}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 text-sm text-[rgba(236,229,255,0.84)]">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[rgba(236,229,255,0.62)]">Product</span>
            <span className="max-w-[18rem] text-right font-semibold text-white [overflow-wrap:anywhere]">{productTitle}</span>
          </div>
          {productMeta ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[rgba(236,229,255,0.62)]">{productMeta.label}</span>
              <span className="max-w-[18rem] text-right font-semibold text-white [overflow-wrap:anywhere]">{productMeta.value}</span>
            </div>
          ) : null}
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
              <span className="text-[rgba(236,229,255,0.62)]">{taxSummaryLabel}</span>
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
            <span className="text-2xl font-semibold text-white">{quote.totalLabel}</span>
          </div>
        </div>
      </div>

      {shouldShowTaxLocation ? (
        <div className="grid gap-3 rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 sm:grid-cols-3">
          <label className="space-y-2" htmlFor="checkout-tax-country">
            <span className="text-sm font-medium text-white">Country/region</span>
            <input
              id="checkout-tax-country"
              className="min-h-12 w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
              value={taxCountry}
              onChange={(event) => setTaxCountry(event.target.value.toUpperCase())}
              name="country"
              autoComplete="country"
              inputMode="text"
              enterKeyHint="next"
              placeholder="US"
              maxLength={2}
            />
          </label>
          <label className="space-y-2" htmlFor="checkout-tax-region">
            <span className="text-sm font-medium text-white">State/province/region</span>
            <input
              id="checkout-tax-region"
              className="min-h-12 w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
              value={taxRegion}
              onChange={(event) => setTaxRegion(event.target.value.toUpperCase())}
              name="address-level1"
              autoComplete="address-level1"
              inputMode="text"
              enterKeyHint="next"
              placeholder="CA"
            />
          </label>
          <label className="space-y-2" htmlFor="checkout-tax-postal">
            <span className="text-sm font-medium text-white">Postal code</span>
            <input
              id="checkout-tax-postal"
              className="min-h-12 w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
              value={taxPostalCode}
              onChange={(event) => setTaxPostalCode(event.target.value.toUpperCase())}
              name="postal-code"
              autoComplete="postal-code"
              inputMode="text"
              enterKeyHint="done"
              placeholder="Optional"
            />
          </label>
          <p className="text-sm text-[rgba(236,229,255,0.7)] sm:col-span-3">Use a two-letter country code such as US, CA, GB, or AU. Your final total updates before payment.</p>
          {quote.requiresTaxLocation ? <p className="text-sm text-amber-200 sm:col-span-3">Enter your tax location to calculate the final checkout total.</p> : null}
          {taxError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-3">{taxError}</p> : null}
        </div>
      ) : null}

      <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4">
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-white"
          onClick={() => setCouponOpen((current) => !current)}
          aria-expanded={couponOpen}
          aria-controls="checkout-coupon-panel"
        >
          <span>Have a coupon?</span>
          <span className="text-[rgba(236,229,255,0.62)]">{couponOpen ? "Hide" : "Add code"}</span>
        </button>
        {couponOpen ? (
          <div id="checkout-coupon-panel" className="mt-3 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="checkout-coupon">Coupon code</label>
              <input
                id="checkout-coupon"
                className="min-h-12 w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[rgba(236,229,255,0.5)] focus:border-[rgba(212,168,70,0.45)]"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                name="coupon"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="Optional coupon code"
              />
              <Button
                type="button"
                variant="ghost"
                className="min-h-12 rounded-full border-white/10 bg-white/8 px-5 py-3 text-white hover:bg-white/12 hover:text-white"
                disabled={quoting || pending}
                onClick={async () => {
                  await refreshQuote(couponCode.trim(), "coupon");
                }}
              >
                {quoting ? "Checking..." : "Apply coupon"}
              </Button>
            </div>
            {couponError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{couponError}</p> : null}
          </div>
        ) : null}
      </div>

      {children}
      <p className="text-sm leading-6 text-[rgba(236,229,255,0.74)]">{paymentNote}</p>
      {checkoutError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{checkoutError}</p> : null}
      <div ref={primaryButtonRef}>
        <Button
          type="button"
          className="min-h-14 w-full justify-center whitespace-normal rounded-full bg-[linear-gradient(135deg,#d4a846,#8f2cff)] px-6 py-4 text-center text-base font-semibold text-white shadow-[0_18px_34px_rgba(143,44,255,0.24)] hover:opacity-95"
          disabled={pending}
          onClick={startCheckout}
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
      {showStickyCta ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#111326]/95 px-4 py-3 shadow-[0_-14px_34px_rgba(0,0,0,0.32)] backdrop-blur sm:hidden">
          <Button
            type="button"
            className="min-h-12 w-full justify-center whitespace-normal rounded-full bg-[linear-gradient(135deg,#d4a846,#8f2cff)] px-5 py-3 text-center text-base font-semibold text-white"
            disabled={pending}
            onClick={startCheckout}
          >
            {pending ? pendingLabel : `${submitLabel} - ${quote.totalLabel}`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

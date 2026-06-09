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

const checkoutCardClass = "rounded-[20px] border border-[var(--checkout-card-border)] bg-[var(--checkout-card-background)]";
const checkoutLabelClass = "text-[var(--checkout-card-muted)]";
const checkoutValueClass = "font-semibold text-[var(--checkout-card-text)]";
const checkoutInputClass =
  "min-h-12 w-full rounded-[12px] border border-[var(--checkout-field-border)] bg-[var(--checkout-field-background)] px-4 py-3 text-sm text-[var(--checkout-field-text)] outline-none transition placeholder:text-[var(--checkout-field-placeholder)] focus:border-[var(--checkout-field-focus)]";
const checkoutErrorClass = "rounded-[14px] bg-[var(--checkout-error-background)] px-4 py-3 text-sm text-[var(--checkout-error-text)]";
const checkoutPrimaryButtonClass =
  "min-h-14 w-full justify-center whitespace-normal rounded-full px-6 py-4 text-center text-base font-semibold text-[var(--checkout-cta-text)] shadow-[var(--checkout-cta-shadow)] transition [background:var(--checkout-cta-background)] hover:[background:var(--checkout-cta-hover-background)] hover:opacity-95";

const taxCountryOptions = [
  ["", "Select country"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["NZ", "New Zealand"],
  ["IE", "Ireland"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["ES", "Spain"],
  ["IT", "Italy"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["AT", "Austria"],
  ["CH", "Switzerland"],
  ["SE", "Sweden"],
  ["NO", "Norway"],
  ["DK", "Denmark"],
  ["FI", "Finland"],
  ["PT", "Portugal"],
  ["PL", "Poland"],
  ["CZ", "Czechia"],
  ["GR", "Greece"],
  ["HU", "Hungary"],
  ["RO", "Romania"],
  ["JP", "Japan"],
  ["KR", "South Korea"],
  ["SG", "Singapore"],
  ["HK", "Hong Kong"],
  ["TW", "Taiwan"],
  ["MY", "Malaysia"],
  ["TH", "Thailand"],
  ["PH", "Philippines"],
  ["IN", "India"],
  ["ZA", "South Africa"],
  ["BR", "Brazil"],
  ["MX", "Mexico"],
  ["AR", "Argentina"],
  ["CL", "Chile"],
  ["OTHER", "Other country code"],
] as const;

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
  const [customTaxCountry, setCustomTaxCountry] = useState("");
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
  const resolvedTaxCountry = taxCountry === "OTHER" ? customTaxCountry : taxCountry;
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
          taxCountry: resolvedTaxCountry || undefined,
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
  }, [initialUpsellFromOfferId, offerId, resolvedTaxCountry, taxPostalCode, taxRegion]);

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
          taxCountry: resolvedTaxCountry || undefined,
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
  }, [couponCode, initialUpsellFromOfferId, offerId, refreshQuote, resolvedTaxCountry, taxPostalCode, taxRegion]);

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
      <div className={cn(checkoutCardClass, "px-5 py-5")}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--checkout-card-subtle)]">{productKind}</p>
        <h1 className="mt-3 text-2xl leading-tight text-[var(--checkout-card-text)] [overflow-wrap:anywhere] sm:text-3xl">{productTitle}</h1>
        {checkoutModeNote ? <p className="mt-3 text-sm leading-6 text-[var(--checkout-card-muted)]">{checkoutModeNote}</p> : null}
      </div>

      <div className={cn(checkoutCardClass, "px-5 py-4 text-sm text-[var(--checkout-card-text)]")}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <span className={checkoutLabelClass}>Product</span>
            <span className={cn(checkoutValueClass, "max-w-[18rem] text-right [overflow-wrap:anywhere]")}>{productTitle}</span>
          </div>
          {productMeta ? (
            <div className="flex items-center justify-between gap-4">
              <span className={checkoutLabelClass}>{productMeta.label}</span>
              <span className={cn(checkoutValueClass, "max-w-[18rem] text-right [overflow-wrap:anywhere]")}>{productMeta.value}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <span className={checkoutLabelClass}>Price</span>
            <span className={checkoutValueClass}>{quote.baseLabel}</span>
          </div>
          {quote.upsellDiscountLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className={checkoutLabelClass}>Offer discount</span>
              <span className="font-semibold text-[var(--checkout-success-text)]">{quote.upsellDiscountLabel}</span>
            </div>
          ) : null}
          {quote.couponDiscountLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className={checkoutLabelClass}>{quote.couponCode ? `Coupon (${quote.couponCode})` : "Coupon"}</span>
              <span className="font-semibold text-[var(--checkout-success-text)]">{quote.couponDiscountLabel}</span>
            </div>
          ) : null}
          {quote.taxLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className={checkoutLabelClass}>{taxSummaryLabel}</span>
              <span className={checkoutValueClass}>{quote.taxLabel}</span>
            </div>
          ) : null}
          {quote.taxLines?.map((line) => (
            <div key={`${line.jurisdiction}-${line.label}`} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-[var(--checkout-card-subtle)]">{line.label} ({line.ratePercent}%)</span>
              <span className="font-semibold text-[var(--checkout-card-muted)]">{line.amountLabel}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-[var(--checkout-card-divider)] pt-3">
            <span className="text-[var(--checkout-card-muted)]">Total due today</span>
            <span className="text-2xl font-semibold text-[var(--checkout-card-text)]">{quote.totalLabel}</span>
          </div>
        </div>
      </div>

      {shouldShowTaxLocation ? (
        <div className={cn(checkoutCardClass, "grid gap-3 px-5 py-4 sm:grid-cols-3")}>
          <label className="space-y-2" htmlFor="checkout-tax-country">
            <span className="text-sm font-medium text-[var(--checkout-card-text)]">Country</span>
            <select
              id="checkout-tax-country"
              className={checkoutInputClass}
              value={taxCountry}
              onChange={(event) => {
                setTaxCountry(event.target.value);
                if (event.target.value !== "OTHER") {
                  setCustomTaxCountry("");
                }
              }}
              name="country"
              autoComplete="country"
            >
              {taxCountryOptions.map(([code, label]) => (
                <option key={code || "placeholder"} value={code}>
                  {code && code !== "OTHER" ? `${label} (${code})` : label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2" htmlFor="checkout-tax-region">
            <span className="text-sm font-medium text-[var(--checkout-card-text)]">Region/state/province</span>
            <input
              id="checkout-tax-region"
              className={cn(checkoutInputClass, "uppercase")}
              value={taxRegion}
              onChange={(event) => setTaxRegion(event.target.value.toUpperCase())}
              name="address-level1"
              autoComplete="address-level1"
              inputMode="text"
              enterKeyHint="next"
              placeholder="Optional"
            />
          </label>
          <label className="space-y-2" htmlFor="checkout-tax-postal">
            <span className="text-sm font-medium text-[var(--checkout-card-text)]">Postal/postcode</span>
            <input
              id="checkout-tax-postal"
              className={cn(checkoutInputClass, "uppercase")}
              value={taxPostalCode}
              onChange={(event) => setTaxPostalCode(event.target.value.toUpperCase())}
              name="postal-code"
              autoComplete="postal-code"
              inputMode="text"
              enterKeyHint="done"
              placeholder="Optional"
            />
          </label>
          {taxCountry === "OTHER" ? (
            <label className="space-y-2 sm:col-span-3" htmlFor="checkout-tax-country-other">
              <span className="text-sm font-medium text-[var(--checkout-card-text)]">Other country code</span>
              <input
                id="checkout-tax-country-other"
                className={cn(checkoutInputClass, "uppercase")}
                value={customTaxCountry}
                onChange={(event) => setCustomTaxCountry(event.target.value.toUpperCase().slice(0, 2))}
                autoComplete="country"
                inputMode="text"
                enterKeyHint="next"
                placeholder="Two-letter code"
                maxLength={2}
              />
            </label>
          ) : null}
          <p className="text-sm text-[var(--checkout-card-muted)] sm:col-span-3">
            Your final total updates before payment. Use the fallback only when your country is not in the list.
          </p>
          {quote.requiresTaxLocation ? <p className="text-sm text-[var(--checkout-warning-text)] sm:col-span-3">Enter your tax location to calculate the final checkout total.</p> : null}
          {taxError ? <p className={cn(checkoutErrorClass, "sm:col-span-3")}>{taxError}</p> : null}
        </div>
      ) : null}

      <div className={cn(checkoutCardClass, "px-5 py-4")}>
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-[var(--checkout-card-text)]"
          onClick={() => setCouponOpen((current) => !current)}
          aria-expanded={couponOpen}
          aria-controls="checkout-coupon-panel"
        >
          <span>Have a coupon?</span>
          <span className="text-[var(--checkout-card-muted)]">{couponOpen ? "Hide" : "Add code"}</span>
        </button>
        {couponOpen ? (
          <div id="checkout-coupon-panel" className="mt-3 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="checkout-coupon">Coupon code</label>
              <input
                id="checkout-coupon"
                className={checkoutInputClass}
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
                className="min-h-12 rounded-full border border-[var(--checkout-field-border)] bg-[var(--checkout-field-background)] px-5 py-3 text-[var(--checkout-card-text)] hover:bg-[var(--surface-panel-strong)] hover:text-[var(--checkout-card-text)]"
                disabled={quoting || pending}
                onClick={async () => {
                  await refreshQuote(couponCode.trim(), "coupon");
                }}
              >
                {quoting ? "Checking..." : "Apply coupon"}
              </Button>
            </div>
            {couponError ? <p className={checkoutErrorClass}>{couponError}</p> : null}
          </div>
        ) : null}
      </div>

      {children}
      <p className="text-sm leading-6 text-[var(--checkout-card-muted)]">{paymentNote}</p>
      {checkoutError ? <p className={checkoutErrorClass}>{checkoutError}</p> : null}
      <div ref={primaryButtonRef}>
        <Button
          type="button"
          className={checkoutPrimaryButtonClass}
          disabled={pending}
          onClick={startCheckout}
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
      {showStickyCta ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--checkout-sticky-border)] bg-[var(--checkout-sticky-background)] px-4 py-3 shadow-[var(--checkout-sticky-shadow)] backdrop-blur sm:hidden">
          <Button
            type="button"
            className={cn(checkoutPrimaryButtonClass, "min-h-12 px-5 py-3")}
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

# Checkout Route Instructions

## Purpose

Owns checkout pages and buyer-facing payment return flows.

## Ownership

- Checkout pages live under `app/(checkout)/checkout`.
- Checkout UI should use `components/checkout`, `components/public`, and payment/order helpers in `lib/payments`, `lib/offers`, and `lib/orders`.

## Local Contracts

- Checkout must remain provider-agnostic. Stripe is unsupported and must not be introduced as a dependency, adapter, configured gateway, or fallback.
- Bank transfer is a valid manual/offline path; normal online gateway paths should rely on trusted provider confirmation.
- Checkout routes must bind buyer intent to platform orders before fulfillment.

## Work Guidance

- Keep checkout copy customer-facing and concrete about what happens after purchase.
- Handle unavailable gateway states honestly rather than hiding maturity gaps.
- Keep checkout shell styling aligned with public theme rules.

## Verification

- Run `npm run prisma:check:bundle-payment` after payment, checkout, order, webhook, or fulfillment changes.
- Run `npm run lint` for route/component changes.

## Child DOX Index

This subtree is not further indexed yet.

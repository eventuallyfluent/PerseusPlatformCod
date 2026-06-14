# Payment Gateway Principles

Perseus must stay genuinely payment-provider agnostic.

## Core Constraint

Stripe is not the target gateway. Stripe may remain useful as a fallback, compatibility check, or reference adapter, but future payment architecture must assume Stripe may not be available long term.

The target is true agnostic gateway support: any viable provider API can be supported when Perseus can safely create or redirect checkout, bind the attempt to a platform order, verify payment through a trusted confirmation path, and normalize the result before fulfillment.

## Implementation Principles

- Treat non-Stripe providers as first-class payment paths.
- Do not make core checkout, webhook, fulfillment, tax, or reporting logic depend on Stripe-specific payloads, metadata shapes, event names, tax assumptions, or checkout behavior.
- Normalize provider-specific events at the connector boundary before they reach order fulfillment.
- Keep merchant-of-record providers, high-risk-compatible providers, generic hosted gateways, and manual/bank-transfer workflows viable.
- Label gateway maturity honestly: a registered connector is not the same as a production-ready checkout path.
- Treat admin payment confirmation as unacceptable for normal online selling. It is only valid for bank transfer, exceptional provider review states, failed webhook recovery, or reconciliation.
- Hosted-only gateways are viable when they provide a signed webhook or trusted confirmation API that can carry the platform order reference and confirm success automatically.
- Generic API profiles are first-class when they can express checkout URL/session creation, credential mapping, webhook signature or trusted status confirmation, and event normalization without custom platform-core changes.
- Native adapters are preferred when a provider's API or verification model is too nuanced for a generic profile or when deeper automation materially improves reliability.
- Bank transfer and explicit admin reconciliation remain valid manual paths, but manual confirmation is not the normal success path for online API gateways.

## Review Standard

When auditing or extending the gateway layer, the question is not "does this work with Stripe?" The question is "can this work with any viable provider without leaking provider-specific assumptions into the platform core?"

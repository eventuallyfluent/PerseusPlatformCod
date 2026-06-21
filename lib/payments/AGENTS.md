# Payment Library Instructions

## Purpose

Owns gateway-agnostic payment definitions, adapters, checkout session creation, manual/bank-transfer flows, webhook normalization, readiness checks, pricing, policy, paid-order fulfillment, contract withdrawals, and refund finalization.

## Ownership

- `adapters` contains provider-specific native adapters.
- `events` contains normalized payment event handling.
- `wizard` contains admin gateway test/setup helpers.
- Core payment modules must stay provider-neutral.

## Local Contracts

- Stripe is unsupported. Do not add it as an adapter, dependency, credential surface, seed, configurable gateway, webhook path, or fallback.
- Provider-specific payloads, event names, signatures, metadata, and tax assumptions must stop at connector boundaries.
- Normal online gateway success must come from a trusted provider confirmation path, not routine admin confirmation.
- Bank transfer remains a valid manual/offline exception.
- Fulfillment must be idempotent and tied to verified paid order state.
- A contract withdrawal is legally received before its refund finishes. Persist and acknowledge it first, then process the refund; all refund paths must converge on shared finalization and order-access revocation.

## Work Guidance

- Add native adapters when a provider needs nuanced API or verification behavior.
- Use generic API profiles only when checkout creation, credential mapping, confirmation, and event normalization can be expressed safely.
- Keep gateway maturity labels and readiness states honest in code paths consumed by admin UI.
- Persist confirmed contract withdrawals as provider-neutral refund queue records. Provider confirmation or explicit external reconciliation finalizes the refund; submission must never call a hard-coded provider.

## Verification

- Run `npm run prisma:check:bundle-payment` after payment, checkout, webhook, bank-transfer, order, access, or fulfillment changes.
- Run `npm run lint` for TypeScript changes.
- Run `npm run payments:check:providers` after payment dependency, registry, gateway, seed, webhook, or provider-policy changes.

## Child DOX Index

This subtree is not further indexed yet.

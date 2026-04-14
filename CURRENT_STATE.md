# Current Platform State

## Positioning

Perseus is a single-tenant course and commerce platform oriented around:

- Payhip-style operator simplicity
- SCP-style course-first public structure
- customer-facing public pages
- separated backend/admin access
- gateway-agnostic payment architecture

## Auth

- Student/customer login: `/login`
- Admin/backend login: `/admin/login`
- Admin access is currently controlled by:
  - `ADMIN_EMAIL_ALLOWLIST`
  - `ADMIN_LOGIN_PASSWORD`
- Student flow should never surface admin login on public pages.
- Admin magic-link can return later if email delivery becomes reliable enough.

## Payments

Current payment model:

- native connectors
- generic API gateway profiles
- bank transfer/manual confirmation

Current truth:

- the platform is gateway-agnostic in architecture
- not every gateway is equally automated
- native connectors are the strongest automation path
- generic and bank-transfer flows may require manual operator handling

Verified in the local commerce suite:

- bundle fulfillment grants all included course enrollments
- bank transfer creates awaiting-payment state and only grants access after manual confirmation
- native webhook ingestion persists events, deduplicates duplicates, and fulfills paid orders on the verified native path

Still provisional:

- live provider-hosted checkout execution with real external credentials
- Stripe webhook signature handling is code-hardened, but the verified native webhook suite currently runs against Creem in local checks
- generic API gateways still depend on operator-supplied templates, credentials, and provider-side setup quality

## Public Product Direction

Public pages should:

- sell courses and bundles
- show curriculum and included value clearly
- avoid explaining platform mechanics
- avoid backend/operator language

Customer-facing copy should focus on:

- what is included
- why it matters
- what happens after purchase
- how to continue learning

## Known Gaps

- docs had drifted from real auth and payment behavior
- some seeded/default public copy still needs continued cleanup over time
- gateway maturity needs to stay described honestly in admin and docs
- admin auth is currently practical rather than final-form

## Next Priority Areas

1. keep auth stable and production-usable
2. continue customer-facing copy cleanup
3. verify real hosted-checkout providers with live credentials
4. keep gateway/operator guidance and planning state current

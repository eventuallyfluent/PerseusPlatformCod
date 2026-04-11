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
3. tighten gateway/operator guidance
4. replace reactive fixes with a maintained in-repo planning/state habit

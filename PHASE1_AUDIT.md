# Phase 1 Audit

Date: 2026-04-01

This audit checks the current Perseus Platform codebase against the original Phase 1 requirements. Status values:

- `met`
- `partially met`
- `not met`
- `implemented but unverified`

## Summary

High-confidence areas:

- Data model coverage is present in [prisma/schema.prisma](C:\Users\stude\OneDrive\Desktop\Perseus Platform\prisma\schema.prisma).
- Generated sales page persistence exists.
- Stripe is implemented behind a gateway adapter interface.
- CSV imports support dry run, execute, idempotent re-import, and error export.
- Lint and production build pass.

Primary gaps:

1. Exact preserved legacy paths are not fully routable unless they fit `/b/[legacyId]`.
2. SEO canonical and structured-data behavior is wrong for migrated courses on legacy public paths.
3. Checkout includes a coupon field in the UI, but coupon application is not implemented.
4. Learner access does not enforce drip scheduling, and video handling is link-based rather than embedded.
5. Gateway wizard and admin course editing are still thinner than the original Phase 1 contract.
6. Gateway credentials are stored as plain text in fields named `valueEncrypted`.

## Requirement Status

### Scope Boundaries

- Phase 1 only: `met`
- No funnels/community/advanced analytics found: `met`

### Data Model

- Required Phase 1 entities present: `met`
- Naming drift: `Page` implemented as `GeneratedPage`: `partially met`
  - This was an intentional implementation choice but differs from the original strict model list.

### URL System

- New-course generated URLs `/course/{slug}`: `met`
- Migrated legacy path preservation: `partially met`
- Collision detection: `met`
- Redirect table exists: `met`
- Redirect behavior actually wired into request handling: `not met`

### Sales Page System

- Generated from structured course data: `met`
- Generated on create/import/update: `met`
- Standardized payload/template: `met`
- Manual override protection in regeneration: `met`

### Course System

- Modules, lessons, ordering, preview lessons, downloads: `met`
- Basic drip: `not met`
- Streamable video embed: `not met`

### Instructor System

- Structured instructor model and public page: `met`

### Payment System

- Provider-agnostic adapter interface: `met`
- One concrete gateway in Phase 1: `met`
- Canonical webhook event mapping: `met`
- Basic gateway wizard: `partially met`

### CSV Migration

- Dry run, validation, idempotent execution, error report: `met`
- Preserve legacy URLs without silent rewrites: `partially met`
  - Validation exists, but exact public routing for arbitrary preserved paths is incomplete.

### Checkout

- Order summary, payment integration, success flow, email trigger: `met`
- Coupon entry: `partially met`
  - Field exists in UI, but coupon application logic is missing.

### Email

- Purchase confirmation and onboarding hooks: `met`
- Real provider delivery with credentials: `implemented but unverified`

### SEO + AI Visibility

- Server-rendered pages, sitemap, robots, canonical metadata helpers, JSON-LD: `partially met`
  - Legacy-route canonical/source-of-truth behavior is not correct yet.

### Admin UI Contract

- Basic admin exists: `met`
- Courses list/edit, instructors, offers, orders, students, imports, gateways, settings pages exist: `met`
- Course edit sections fully actionable for offers/FAQ/testimonials/sidebar actions: `partially met`
- Gateway page with test connection and webhook status: `partially met`
- Template download in import center: `not met`

### Auth / Public Routes

- Login and dashboard: `met`
- Register route from the recommended structure: `not met`

## Findings

### 1. Exact preserved legacy paths are not fully supported

Status: `not met`

Requirement:

- Migration must preserve exact public URLs, not only `/b/{legacyId}` examples.
- Redirect table must be meaningful in request handling.

Current state:

- Public legacy rendering only exists at [app/(public)/b/[legacyId]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(public)\b\[legacyId]\page.tsx#L8).
- The data access layer can resolve arbitrary `publicPath` or `legacyUrl` in [lib/courses/get-course-by-public-path.ts](C:\Users\stude\OneDrive\Desktop\Perseus Platform\lib\courses\get-course-by-public-path.ts#L3).
- Redirect lookup exists in [lib/redirects/get-redirect.ts](C:\Users\stude\OneDrive\Desktop\Perseus Platform\lib\redirects\get-redirect.ts#L3) but is not connected to any request-time route or middleware.

Concrete gap:

- A course preserved to an exact path outside `/b/...` cannot be served publicly even if `publicPath` is reserved in the database.
- Redirect records cannot affect live routing.

Smallest corrective action:

- Add request-time public-path resolution for arbitrary preserved paths and route redirect-table lookups through that same entrypoint.

### 2. Canonical URLs and structured data are wrong for migrated courses

Status: `not met`

Requirement:

- Canonical URLs must reflect the actual bound public route.
- SEO should work for migrated legacy URLs as first-class public pages.

Current state:

- Course metadata always sets the canonical path to `/course/{slug}` in [app/(public)/course/[slug]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(public)\course\[slug]\page.tsx#L17).
- The legacy-route page renders the sales page but emits no metadata or JSON-LD in [app/(public)/b/[legacyId]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(public)\b\[legacyId]\page.tsx#L18).

Concrete gap:

- Migrated courses with `publicPath = /b/OWFpo` still canonicalize to `/course/{slug}` on the slug route.
- The legacy route itself is SEO-thin.

Smallest corrective action:

- Make canonical metadata derive from `course.publicPath`.
- Add the same metadata and structured-data emission to the legacy-path rendering entrypoint.

### 3. Coupon entry exists in the checkout UI but does not work

Status: `partially met`

Requirement:

- Phase 1 checkout must include coupon entry.

Current state:

- The checkout page renders a disabled coupon input in [app/(public)/checkout/[offerId]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(public)\checkout\[offerId]\page.tsx#L43).
- The checkout route ignores `couponCode` when creating sessions in [app/api/checkout/session/route.ts](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\api\checkout\session\route.ts#L11).
- Checkout session creation has no coupon handling in [lib/payments/create-checkout-session.ts](C:\Users\stude\OneDrive\Desktop\Perseus Platform\lib\payments\create-checkout-session.ts#L6).

Concrete gap:

- The platform presents coupon entry but cannot validate, apply, persist, or reflect coupon discounts in the order.

Smallest corrective action:

- Accept a coupon code in the checkout flow, validate it against `Coupon`, compute the adjusted total, and persist the applied discount on the order/payment path.

### 4. Drip access is not enforced, and video is not embedded

Status: `not met`

Requirement:

- Course system must support basic drip.
- Video handling should support Streamable embeds.

Current state:

- Learner access only checks enrollment in [app/(public)/learn/[courseSlug]/[lessonSlug]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(public)\learn\[courseSlug]\[lessonSlug]\page.tsx#L18).
- The player renders links for every lesson regardless of `dripDays` in [components/course-player/course-player-layout.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\components\course-player\course-player-layout.tsx#L31).
- Lesson video is an outbound link rather than an embed in [components/course-player/course-player-layout.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\components\course-player\course-player-layout.tsx#L52).
- Sales video is also an outbound link in [components/sales-page/render-sales-page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\components\sales-page\render-sales-page.tsx#L45).

Concrete gap:

- `dripDays` is stored and editable but does not change learner access.
- Streamable URLs are not embedded in sales or lesson views.

Smallest corrective action:

- Compute lesson availability from `Enrollment.enrolledAt + dripDays`.
- Gate lesson navigation/rendering by availability.
- Replace link-only video handling with safe Streamable embed rendering.

### 5. The gateway wizard is incomplete

Status: `partially met`

Requirement:

- Gateway setup should include API key input, webhook setup instructions, and test connection.

Current state:

- The gateway page includes API key and webhook secret inputs in [app/(admin)/admin/gateways/[id]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(admin)\admin\gateways\[id]\page.tsx#L24).
- A test helper exists in [lib/payments/wizard/test-connection.ts](C:\Users\stude\OneDrive\Desktop\Perseus Platform\lib\payments\wizard\test-connection.ts#L3).
- No UI action actually calls that helper.

Concrete gap:

- “Test connection” is not exposed, and webhook status is represented only as event counts.

Smallest corrective action:

- Add a server action or route to run the connection test and surface its result in the gateway detail UI.

### 6. Gateway credentials are stored in plain text

Status: `not met`

Requirement:

- The model and production-ready standard imply encrypted secret storage.

Current state:

- Gateway credentials are written directly into `valueEncrypted` without encryption in [app/(admin)/admin/actions.ts](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(admin)\admin\actions.ts#L232).

Concrete gap:

- Secrets are stored as raw values despite the field contract indicating encrypted storage.

Smallest corrective action:

- Introduce a small encryption/decryption utility for gateway credentials and migrate existing stored secrets.

### 7. Course admin does not fully satisfy the editing contract

Status: `partially met`

Requirement:

- Course edit page should cover offers, FAQ, testimonials, SEO/URL, publish state, preview sales page, preview checkout, regenerate, publish/unpublish.

Current state:

- The course page handles basic course fields and curriculum in [app/(admin)/admin/courses/[id]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(admin)\admin\courses\[id]\page.tsx#L47).
- Offers/FAQ/testimonials are only listed, not editable, in [app/(admin)/admin/courses/[id]/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(admin)\admin\courses\[id]\page.tsx#L349).
- Offer creation exists on a separate page in [app/(admin)/admin/offers/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(admin)\admin\offers\page.tsx#L20), but there is no edit action from the course screen and no preview-checkout action.

Concrete gap:

- The admin surface is usable but not yet aligned with the Phase 1 contract for the course edit experience.

Smallest corrective action:

- Add course-scoped CRUD/edit controls for offers, FAQ, and testimonials, plus preview-checkout and explicit publish/unpublish actions.

### 8. Import center does not provide actual template downloads

Status: `not met`

Requirement:

- Each import tab should support template download.

Current state:

- Template CSV headers are displayed as text on the main import page in [app/(admin)/admin/imports/page.tsx](C:\Users\stude\OneDrive\Desktop\Perseus Platform\app\(admin)\admin\imports\page.tsx#L19).
- Dry run, execute, batch review, and error export are present.

Concrete gap:

- Users can copy template text, but there is no download action for template files.

Smallest corrective action:

- Expose one download link per import type that returns the exact CSV template as a file.

### 9. Register route from the approved structure is missing

Status: `not met`

Requirement:

- The approved app structure included `/register/page.tsx`.

Current state:

- Login exists, but there is no `app/(public)/register/page.tsx`.

Concrete gap:

- The route is absent.

Smallest corrective action:

- Add the register route or formally collapse registration into the existing magic-link login flow and remove the route from the accepted contract.

## Drift Notes

- `GeneratedPage` is used instead of `Page`.
- Auth implementation adds NextAuth account/session/token models beyond the strict original list.
- Gateway configuration currently assumes Stripe-shaped credential fields in the admin flow.

## Verification Notes

- Verified locally: `npm run lint`, `npm run build`
- Verified previously during milestone work: Prisma migration, seed, sanity check, import workflow, canonical payment event persistence
- Still unverified with real providers:
  - live Resend delivery
  - live Stripe connection test through the admin UI
  - live webhook round-trip against Stripe-hosted events

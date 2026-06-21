# Admin Route Instructions

## Purpose

Owns backend/admin pages for operating courses, bundles, instructors, offers, imports, gateways, orders, reports, reviews, settings, students, inquiries, and admin actions.

## Ownership

- Admin pages live under `app/(admin)/admin`.
- Admin-only server actions live under `app/(admin)/admin/actions`.
- Admin UI composition should use `components/admin` and domain logic in `lib/admin`, `lib/auth`, and the relevant `lib/*` domain folder.

## Local Contracts

- Admin access must remain separate from student/customer login.
- Enforce admin auth boundaries through `lib/auth/admin-boundary` and related guards.
- Do not import admin-only modules into public or learner surfaces.
- Admin copy may use operational language; public/customer copy may not inherit it.
- The admin layout owns the persistent operator frame and navigation; individual pages own only their page header and content.
- Internal admin navigation must use App Router transitions with route loading feedback. Fix route instability at its source instead of forcing full-document reloads.
- Catalog is the shared navigation entry for products, courses, and bundles; keep those related operator routes grouped rather than duplicating global navigation items.
- The overview should prioritize actionable queues, while the global command menu owns fast route and create-action discovery.

## Work Guidance

- Prefer dense, readable, form/table-oriented flows over storefront styling.
- Keep gateway maturity labels honest and avoid implying an unverified provider path is production-ready.
- Imports pages must honor the import safety contract: upload/start routes create or start batches, not process rows.
- Admin withdrawal completion confirms that an external refund already occurred; it must not imply that the admin action itself moved money.
- The orders page owns the deadline-ordered withdrawal refund queue and must keep it visible above the general order list.

## Verification

- Run `npm run admin:check:auth` after admin boundary changes.
- Run `npm run imports:check:boundaries` after import admin flow changes.
- Run `npm run lint` for page/action changes.

## Child DOX Index

This subtree is not further indexed yet.

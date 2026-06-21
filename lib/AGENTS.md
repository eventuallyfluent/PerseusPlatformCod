# Library Instructions

## Purpose

Owns domain logic, data access helpers, integrations, validation, URL handling, SEO helpers, payment architecture, imports, auth, email, and shared utilities.

## Ownership

- Domain folders map to platform capabilities such as courses, bundles, offers, payments, imports, access, auth, enrollments, SEO, and theme.
- `db` owns Prisma client access.
- `zod` owns shared validation schemas.
- `payments` and `imports` have child AGENTS.md files because their contracts are high-risk.

## Local Contracts

- Keep business rules in `lib/` rather than route handlers or UI components.
- Preserve the boundary between public/customer behavior and admin/operator behavior.
- Database writes should use Prisma through existing helpers and remain idempotent where workflows may retry.
- Do not make gateway-neutral flows depend on provider-specific payloads, event names, or metadata shapes.
- Do not make import workflows perform slow media/network work in request paths that should only upload/start batches.

## Work Guidance

- Prefer adding focused functions in the relevant domain folder over growing broad utility modules.
- Keep return shapes explicit and typed.
- Use Zod or existing validators for external/user-provided data.
- When touching auth, confirm public/admin boundaries and return-path behavior.

## Verification

- Run `npm run lint` for library changes.
- Run the relevant Prisma check for domain behavior:
  - payments/orders/access: `npm run prisma:check:bundle-payment`
  - imports: `npm run prisma:check:imports` and `npm run imports:check:boundaries`
  - general data integrity: `npm run prisma:check`

## Child DOX Index

- `payments/AGENTS.md` - Gateway-agnostic payment, checkout, webhook, fulfillment, and pricing rules.
- `imports/AGENTS.md` - CSV/course migration import safety and batch processing rules.

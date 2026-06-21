# Prisma Instructions

## Purpose

Owns the Prisma schema, migration history, seed data, and database verification scripts.

## Ownership

- `schema.prisma` is the canonical data model.
- `migrations` stores immutable migration history.
- `seed.ts` creates local/sample platform content.
- `verify-*.ts` and `sanity-check.ts` exercise database-backed platform behavior.

## Local Contracts

- Do not hand-edit applied migration files to change history; add a new migration for schema changes.
- Do not run development migrations against hosted production databases.
- Keep seed data realistic enough to exercise courses, bundles, offers, gateways, users, and access flows.
- Verification scripts should be deterministic and safe to rerun against an intended local/dev database.

## Work Guidance

- After schema changes, run `npm run prisma:generate`.
- Prefer explicit relations, constraints, and indexes that match domain invariants.
- Index admin queue filters, date ranges, sort orders, and high-use relation lookups; avoid blanket indexes that add write cost without a demonstrated query path.
- Keep payment, import, and access models compatible with idempotent retries.
- Contract withdrawal records are durable compliance evidence; downstream email or refund failures must update status without deleting the original submission timestamp or identifying statement.

## Verification

- Schema changes: `npm run prisma:generate`, then the relevant Prisma check.
- General database behavior: `npm run prisma:check`.
- Payment behavior: `npm run prisma:check:bundle-payment`.
- Import behavior: `npm run prisma:check:imports`.

## Child DOX Index

This subtree is not further indexed yet.

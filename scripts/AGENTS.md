# Script Instructions

## Purpose

Owns repository maintenance scripts, static boundary verification, and one-off operational helpers that are not app runtime code.

## Ownership

- Auth boundary checks live here.
- Admin navigation regression checks live here.
- Import boundary checks live here.
- Image verification/backfill helpers live here.
- Unsupported payment-provider regression checks live here.

## Local Contracts

- Verification scripts should fail loudly with actionable messages.
- Scripts should not require production credentials unless explicitly documented.
- Backfill scripts must be idempotent or clearly state their side effects.
- Navigation checks must prevent forced document reloads and loss of the persistent admin frame.
- Payment-provider checks must cover dependencies, environment examples, seeds, adapter registration, gateway queries, admin mutations, and webhook entry points.

## Work Guidance

- Keep scripts narrow and easy to run through `package.json`.
- Prefer existing package scripts when adding new verification.
- Avoid embedding secrets or environment-specific absolute paths.

## Verification

- Run the script you changed through its `npm run ...` entry when one exists.
- Run `npm run lint` after TypeScript script changes when feasible.

## Child DOX Index

This subtree is not further indexed yet.

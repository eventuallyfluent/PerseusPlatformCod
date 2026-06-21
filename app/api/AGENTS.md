# API Route Instructions

## Purpose

Owns App Router route handlers for auth, checkout, imports, SEO, webhooks, health, and admin uploads.

## Ownership

- API route handlers live under `app/api/**/route.ts`.
- Route handlers should delegate business logic to `lib/` modules and keep request parsing, auth, response shaping, and status codes local.

## Local Contracts

- API routes must validate input before passing data to domain code.
- Webhooks must verify provider signatures or trusted confirmation paths before fulfillment.
- Import upload/start routes must not process rows or perform heavy media/network work.
- `/api/imports/batches/[batchId]/process` is the only route allowed to process import chunks.
- Admin upload routes require admin authorization.

## Work Guidance

- Keep provider-specific webhook parsing at adapter/connector boundaries.
- Preserve idempotency for webhooks and imports.
- Avoid leaking secrets, credentials, or internal stack details in responses.

## Verification

- Run `npm run imports:check:boundaries` after import API changes.
- Run `npm run prisma:check:bundle-payment` after checkout/webhook/payment API changes.
- Run `npm run lint` for route handler changes.

## Child DOX Index

This subtree is not further indexed yet.

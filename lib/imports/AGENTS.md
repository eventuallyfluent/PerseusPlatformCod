# Import Library Instructions

## Purpose

Owns CSV/course migration validation, dry runs, batch execution, idempotency, status handling, course/lesson/instructor/offer import logic, and legacy sales page media references.

## Ownership

- Validation modules own row-level checks and conflict reporting.
- Dry-run and execute modules own batch lifecycle behavior.
- Shared import types and helpers live in this folder.

## Local Contracts

- Imports must be boring, predictable, and recoverable.
- Upload routes create `ImportBatch` records and redirect; they must not process rows.
- Start routes only move valid dry runs to `PROCESSING`; they must not process rows.
- `/api/imports/batches/[batchId]/process` is the only HTTP route allowed to call chunk execution.
- `IMPORT_CHUNK_SIZE` must stay at or below `10` unless imports move to a real queue/workflow worker.
- Course-package imports prioritize structure first; image ownership, Blob copying, legacy media scraping, and other slow network work are separate audit/backfill work.
- Course hero image resolution must reject YouTube/video thumbnails and prefer real course/product image fields.
- Failed imports must leave generated public pages private/unpublished until reconciliation proves expected module and lesson counts match.

## Work Guidance

- Keep import operations idempotent across retries.
- Favor explicit conflict/warning output over best-effort mutation.
- Preserve exact migrated public paths when importing canonical course or bundle URLs.

## Verification

- Run `npm run imports:check:boundaries` after import route or library changes.
- Run `npm run prisma:check:imports` after import behavior changes.
- Run `npm run lint` for TypeScript changes.

## Child DOX Index

This subtree is not further indexed yet.

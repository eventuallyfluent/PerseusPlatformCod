# Import Safety Principles

Course migration must be boring, predictable, and recoverable. The importer exists to move real courses, not to perform best-effort scraping or long-running media work inside a single web request.

## Hard Rules

- Upload routes create an `ImportBatch` and redirect. They must not process rows.
- The batch start route only moves a valid dry run to `PROCESSING`. It must not process rows.
- `/api/imports/batches/[batchId]/process` is the only HTTP route allowed to call `processImportBatchChunk`.
- Import chunks must stay small enough for Vercel serverless requests. `IMPORT_CHUNK_SIZE` must stay at or below `10` unless imports move to a real queue/workflow worker.
- Course-package structure import must prioritize course metadata, modules, lessons, testimonials, offers, and generated pages.
- Image ownership, Blob copying, legacy media scraping, and other slow network work must not block module/lesson import. Use image audit/backfill after the course structure has imported.
- Failed imports must leave generated public pages private/unpublished until reconciliation proves expected module and lesson counts match the database.

## Why This Exists

We previously reintroduced chunk processing into upload/start routes. On Vercel this caused `FUNCTION_INVOCATION_TIMEOUT` because the request could include database writes, legacy Payhip fetches, remote image fetches, and Blob uploads before returning.

That must not happen again. Import correctness is more important than making one button do every task in one request.

## Enforcement

Run:

```bash
npm run imports:check:boundaries
```

This static check fails when:

- upload/start routes import or call chunk execution
- the process endpoint stops being the only route that processes chunks
- import chunk size grows beyond the serverless-safe limit
- course-package target setup starts copying images inline again


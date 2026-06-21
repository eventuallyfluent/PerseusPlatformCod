# Public Asset Instructions

## Purpose

Owns static files served directly by Next.js from `/public`.

## Ownership

- Static SVGs and future images/assets that should be publicly addressable live here.
- Generated or user-uploaded assets should not be stored here if they belong in Blob/database-managed ownership flows.

## Local Contracts

- Do not place secrets, private exports, or customer data in this folder.
- Keep asset filenames stable when routes or external references depend on them.
- Prefer optimized, appropriately sized assets.

## Work Guidance

- Use descriptive filenames.
- Remove unused placeholder assets only after confirming they are not referenced.

## Verification

- Search for references before renaming or deleting assets.
- Run `npm run build` when changing assets referenced by app metadata or routes.

## Child DOX Index

This subtree is not further indexed yet.

# Sample Data Instructions

## Purpose

Owns sample import data and fixtures used to exercise migration/import workflows.

## Ownership

- Import samples live under `samples/imports`.

## Local Contracts

- Samples must not contain real customer secrets or private personal data.
- Keep sample shapes aligned with current import validators and templates.
- Preserve cases that exercise course package and course student import behavior.

## Work Guidance

- Prefer small representative fixtures over large opaque dumps.
- Update import docs or validators when sample columns intentionally change.

## Verification

- Run `npm run prisma:check:imports` after changing sample import shape when feasible.
- Run `npm run imports:check:boundaries` if samples accompany import workflow changes.

## Child DOX Index

This subtree is not further indexed yet.

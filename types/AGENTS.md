# Type Declaration Instructions

## Purpose

Owns shared TypeScript declarations that need to be visible across app, library, and component code.

## Ownership

- Shared type exports live in `types/index.ts`.
- Framework-specific generated declarations remain at the project root unless the framework owns them.

## Local Contracts

- Keep exported types stable and domain-neutral enough for broad reuse.
- Avoid importing runtime code into declaration-only surfaces.
- Prefer colocated domain types in `lib/*` when a type is not broadly shared.

## Work Guidance

- Use explicit names that describe platform concepts.
- Remove unused broad types when narrower domain types replace them.

## Verification

- Run `npm run lint` after type changes.
- Run `npm run build` when changing exported types used across app boundaries.

## Child DOX Index

This subtree is not further indexed yet.

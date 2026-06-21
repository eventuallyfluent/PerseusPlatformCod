# Design Rules Instructions

## Purpose

Owns public and admin design system authority, page patterns, tokens, typography, and component standards.

## Ownership

- `public-design-system-v2.md` and its addendum own public/customer/learner design direction.
- `admin-design-system.md` owns Admin Clean direction.
- `tokens.md`, `typography.md`, `components.md`, and `page-patterns.md` define reusable standards.

## Local Contracts

- Public, checkout, learner, preview, catalog, sales, collection, and instructor surfaces follow the v2 public design authority.
- Admin remains visually separate and should not inherit ceremonial/editorial storefront treatment.
- Public light mode should stay white/neutral-first, not pink/lavender.
- Theme token changes must stay aligned with `THEMES.md` and `app/globals.css`.

## Work Guidance

- Document stable design contracts that future component/page work can follow.
- Keep examples concise and current with implemented CSS/classes.
- Avoid creating one-off visual rules disconnected from actual components.

## Verification

- For design-rule edits, verify referenced tokens/components/routes exist.
- Run `npm run lint` or `npm run build` only when design docs are paired with code changes.

## Child DOX Index

This subtree is not further indexed yet.

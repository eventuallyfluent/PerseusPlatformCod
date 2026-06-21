# Component Instructions

## Purpose

Owns shared React components used by admin, public, checkout, learner, course-player, sales-page, and UI primitive surfaces.

## Ownership

- `admin` contains backend/operator UI.
- `public` contains customer and learner shared UI.
- `checkout` contains buyer checkout UI.
- `course-player` contains learner/player UI.
- `sales-page` contains generated sales page rendering.
- `ui` contains small reusable primitives.

## Local Contracts

- Components must remain audience-aware: admin components should not be imported into public/learner routes unless intentionally isolated.
- Public and learner components must use semantic theme tokens from `THEMES.md`.
- Admin components should stay readable, restrained, and operational.
- Shared primitives should be generic and avoid domain-specific assumptions.
- Internal route links must preserve Next.js client navigation and prefetch behavior; do not use `window.location` as a workaround for route defects.
- The public footer must keep an unambiguous link to the online contract-withdrawal function.
- Admin server-action forms should expose an immediate pending state and prevent duplicate submission for primary save operations.

## Work Guidance

- Prefer existing primitives before adding new component styles.
- Use `lucide-react` icons for controls when an icon exists.
- Avoid duplicating layout/card patterns across public and admin surfaces when a local component already owns the pattern.
- Keep client components scoped to real interactivity needs.

## Verification

- Run `npm run lint` after component changes.
- Run `npm run build` when changing client/server component boundaries or imports across route groups.

## Child DOX Index

This subtree is not further indexed yet.

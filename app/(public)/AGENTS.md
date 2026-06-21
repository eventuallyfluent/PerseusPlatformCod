# Public Route Instructions

## Purpose

Owns customer-facing, learner-facing, auth, catalog, sales, legal, preview, dashboard, and player routes.

## Ownership

- Public sales and discovery routes include home, courses, course pages, bundle pages, collections, instructors, FAQ, contact, and legal pages.
- Learner routes include dashboard, learn, preview, fulfillment, purchased, and authenticated customer flows.
- Public route UI should use `components/public`, `components/course-player`, `components/sales-page`, and domain helpers from `lib/`.

## Local Contracts

- Public copy speaks to students and buyers, not operators.
- Preserved migrated public URLs are canonical for migrated courses and bundles.
- Student/customer login is `/login`; do not surface admin login as a normal public option.
- Public and learner visuals follow `design-rules/public-design-system-v2.md` and `THEMES.md`.
- Private learner and preview access rules must stay noindex and access-controlled where applicable.
- The `/withdraw` function must remain easy to find, use a separate confirmation step, and expose only orders owned by the authenticated customer.

## Work Guidance

- Use public theme tokens rather than hardcoded dark/light colors.
- Keep `Cinzel` for normal public display usage and reserve `Cinzel Decorative` for rare accents.
- Course and bundle pages should focus on included value, curriculum, purchase outcome, and next learning steps.

## Verification

- Run `npm run lint` for route/component changes.
- Run `npm run build` for metadata, canonical URL, dynamic route, or SEO changes when feasible.

## Child DOX Index

This subtree is not further indexed yet.

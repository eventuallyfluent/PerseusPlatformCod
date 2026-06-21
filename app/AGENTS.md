# App Router Instructions

## Purpose

Owns Next.js App Router entry points: layouts, route groups, pages, metadata, global styles, route handlers, sitemap, robots, `llms.txt`, and fallback routing.

## Ownership

- `layout.tsx`, `globals.css`, `not-found.tsx`, `robots.ts`, `sitemap.ts`, and `favicon.ico` are root app concerns.
- `(admin)` owns backend/admin pages.
- `(public)` owns customer, learner, auth, catalog, sales, legal, preview, dashboard, and player pages.
- `(checkout)` owns checkout shell routes.
- `api` owns server route handlers.
- `[...slug]` preserves fallback public path handling for migrated/canonical routes.

## Local Contracts

- Read the relevant Next.js docs in `node_modules/next/dist/docs/` before changing route, metadata, caching, navigation, server action, or route handler behavior.
- Keep admin routes and customer-facing routes separated by route group and audience.
- Public SEO surfaces must preserve migrated canonical URLs where they exist.
- Private learner, checkout, auth, and admin flows must not become crawlable public SEO surfaces.
- Global CSS changes must respect theme token contracts from `THEMES.md` and `design-rules/`.

## Work Guidance

- Keep page files thin; push domain logic into `lib/` and shared UI into `components/`.
- Use existing auth guards from `lib/auth` for protected routes.
- Avoid exposing admin/backend wording on public customer pages.
- When adding a route, update sitemap, robots, redirects, metadata, or indexes only when the route changes those contracts.

## Verification

- Run `npm run lint` for route or component changes.
- Run `npm run build` for metadata, routing, sitemap, robots, dynamic segment, or App Router API changes when feasible.
- Run targeted Prisma/domain checks when a route calls changed `lib/` behavior.

## Child DOX Index

- `(admin)/AGENTS.md` - Admin route group.
- `(public)/AGENTS.md` - Public and learner route group.
- `(checkout)/AGENTS.md` - Checkout route group.
- `api/AGENTS.md` - API route handlers.

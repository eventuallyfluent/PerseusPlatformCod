# Perseus Platform Agent Instructions

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## DOX Core Contract

- AGENTS.md files are binding work contracts for their subtrees.
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it.
- Before editing, identify every file or folder you expect to touch, then read the root AGENTS.md and every AGENTS.md on the path to those targets.
- If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there.
- If docs conflict, the closer doc controls local details, but no child doc may weaken this root contract.
- Do not rely on memory for DOX context. Re-read the applicable chain in the current session before editing.

## Project Purpose

Perseus Platform is a single-tenant course and commerce system replacing a Payhip-based setup with platform-owned checkout, generated sales pages, preserved migration URLs, separated admin access, and a calmer learner experience.

## Global Work Guidance

- Keep public, checkout, learner, and admin surfaces separated by audience and route group.
- Preserve migrated public URLs and canonical SEO behavior unless the task explicitly changes that contract.
- Treat payment architecture as gateway-agnostic. Stripe is unsupported and must not be added as an adapter, dependency, seed, configurable gateway, or operational fallback.
- Keep imports predictable and recoverable. Upload/start routes must not process rows or perform long-running media/network work.
- Use Prisma as the schema source of truth and keep migrations in `prisma/migrations`.
- Do not commit secrets from `.env`; update `.env.example` when adding required configuration.
- Prefer existing domain helpers in `lib/` and existing UI primitives in `components/` before adding new patterns.
- For public design work, follow `design-rules/public-design-system-v2.md` and `THEMES.md`.
- For admin UI, keep the Admin Clean treatment restrained, readable, and operational.

## Verification

- General checks: `npm run lint`, `npm run build`.
- Database checks: `npm run prisma:check`, `npm run prisma:check:bundle-payment`, `npm run prisma:check:imports`.
- Boundary checks: `npm run imports:check:boundaries`, `npm run admin:check:auth`, `npm run images:verify`.
- Payment-provider policy: `npm run payments:check:providers`.
- Run the smallest relevant checks for the files changed; explain skipped checks in the closeout.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Remove stale or contradictory text instead of explaining history.

## Child DOX Index

- `app/AGENTS.md` - App Router routes, layouts, metadata, API route handlers, and global CSS.
- `components/AGENTS.md` - Shared React components and UI primitives.
- `lib/AGENTS.md` - Domain logic, data access helpers, integrations, validation, payments, imports, and shared utilities.
- `prisma/AGENTS.md` - Prisma schema, migrations, seeds, and database verification scripts.
- `scripts/AGENTS.md` - Repository maintenance and static verification scripts.
- `docs/AGENTS.md` - Operational and architecture documentation.
- `design-rules/AGENTS.md` - Design system authority and visual standards.
- `emails/AGENTS.md` - Transactional email templates.
- `public/AGENTS.md` - Static public assets.
- `samples/AGENTS.md` - Sample CSV/import data.
- `types/AGENTS.md` - Shared TypeScript declaration surfaces.

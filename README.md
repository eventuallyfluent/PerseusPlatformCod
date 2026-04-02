# Perseus Platform

Perseus Platform is a single-tenant course and commerce system built to replace a Payhip-based setup with platform-owned checkout, generated sales pages, preserved migration URLs, and a calmer learner experience.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- Postgres
- NextAuth
- Resend

## What is in this repo

- Generated course sales pages from structured course data
- Course and bundle product flows
- URL preservation and redirect handling for migrated paths
- Gateway-connector payment architecture with Stripe, PayPal, and Creem connectors
- CSV migration center with dry run, execution logs, and idempotent imports
- Magic-link auth
- Dashboard and learner player
- Admin CRUD for courses, bundles, instructors, offers, imports, gateways, orders, and students

## Local setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL`
3. Install dependencies
4. Run migrations
5. Seed the database
6. Start the app

```bash
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Useful scripts

```bash
npm run lint
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run prisma:check
npm run prisma:check:bundle-payment
```

## Environment variables

Required:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `AUTH_EMAIL_FROM`
- `ADMIN_EMAIL_ALLOWLIST`

Used when configured:

- `AUTH_RESEND_KEY`
- `RESEND_API_KEY`
- `CREDENTIAL_ENCRYPTION_KEY`
- provider secrets stored through admin or env fallback where applicable

## Deployment

Use Supabase for Postgres and Vercel for hosting.

High-level flow:

1. Create a Supabase project
2. Set `DATABASE_URL` and `DIRECT_URL`
3. Run `npm run prisma:deploy`
4. Run `npm run prisma:seed`
5. Create a Vercel project from this repo
6. Set the production environment variables
7. Update `NEXT_PUBLIC_APP_URL` to the deployed domain
8. Configure gateway credentials in admin

Detailed deployment notes are in [DEPLOYMENT.md](C:\Users\stude\OneDrive\Desktop\Perseus Platform\DEPLOYMENT.md).

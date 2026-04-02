# Deployment Guide

## Target setup

- GitHub for source control
- Supabase for managed Postgres
- Vercel for application hosting

Supabase is database-only in this setup. Auth stays in NextAuth and Prisma remains the schema source of truth.

## 1. Create the Supabase project

Create a new Supabase project and wait for Postgres to finish provisioning.

You need two connection strings:

- `DATABASE_URL`
  Use the pooled runtime connection string for the app if you prefer connection pooling in hosted runtime.
- `DIRECT_URL`
  Use the direct database connection string for Prisma migrations.

If you choose to use the same direct connection for both at first, that is acceptable for initial deployment.

## 2. Configure local production-like env values

Set these values before running hosted migrations:

```env
DATABASE_URL="..."
DIRECT_URL="..."
NEXT_PUBLIC_APP_URL="https://your-vercel-domain.vercel.app"
AUTH_SECRET="long-random-secret"
CREDENTIAL_ENCRYPTION_KEY="long-random-secret"
AUTH_EMAIL_FROM="Perseus Platform <no-reply@your-domain.com>"
AUTH_RESEND_KEY="..."
RESEND_API_KEY="..."
ADMIN_EMAIL_ALLOWLIST="you@example.com"
```

Notes:

- `CREDENTIAL_ENCRYPTION_KEY` should be set in production. Do not leave it blank.
- `AUTH_RESEND_KEY` and `RESEND_API_KEY` can be the same underlying Resend API key.
- `NEXT_PUBLIC_APP_URL` must match the deployed Vercel URL or custom domain.

## 3. Apply Prisma migrations

For hosted deployment, use:

```bash
npm run prisma:deploy
```

Do not use `prisma migrate dev` against the hosted database.

## 4. Seed the initial data

After migrations:

```bash
npm run prisma:seed
```

This creates the sample instructor, course, bundle, offers, and gateway records used by the app.

## 5. Create the Vercel project

In Vercel:

1. Import the GitHub repository
2. Choose the default Next.js framework settings
3. Set the environment variables from the `.env.example` contract
4. Deploy

The repo already includes:

- `postinstall: prisma generate`
- custom Next.js output directory `.build`

No special Vercel build customization should be needed unless you choose to override defaults.

## 6. Add Vercel environment variables

Set these in Vercel for `Preview` and `Production` as appropriate:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `CREDENTIAL_ENCRYPTION_KEY`
- `AUTH_EMAIL_FROM`
- `AUTH_RESEND_KEY`
- `RESEND_API_KEY`
- `ADMIN_EMAIL_ALLOWLIST`

Optional provider env fallbacks if you choose to use them:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 7. Post-deploy checks

Verify:

- `/`
- `/login`
- `/register`
- one migrated course path such as `/b/OWFpo`
- one bundle page
- `/admin/products`
- `/api/health`
- `/api/imports/templates/courses`

Then log into admin and configure:

- gateway credentials
- webhook settings
- real email sender settings

## 8. Payment setup after deploy

The platform supports multiple connectors, but real payment acceptance still depends on provider credentials and webhook setup.

After deploy:

1. Open `/admin/gateways`
2. Save live or test credentials
3. Use the test-connection action
4. Configure provider webhooks to point to:

```text
https://your-domain/api/webhooks/{provider}
```

Examples:

- `stripe`
- `paypal`
- `creem`

## 9. Operational cautions

- Do not commit `.env`
- Do not run `prisma migrate dev` against Supabase production
- Keep Prisma migrations as the canonical schema history
- Use `DIRECT_URL` for migration safety
- Re-run `npm run prisma:seed` only if you intentionally want the seeded sample content updated

## 10. Recommended first live sequence

1. Supabase project
2. Vercel project
3. Environment variables
4. `npm run prisma:deploy`
5. `npm run prisma:seed`
6. Vercel deploy
7. Admin login
8. Gateway credential setup
9. Real checkout/webhook verification

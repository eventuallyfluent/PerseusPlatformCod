# Migration Rollout

Perseus is ready for controlled course migration. The goal of this runbook is to keep imports repeatable and preserve the SEO-critical public URLs already established on the Payhip-backed subdomain.

## Order Of Operations

1. Deploy the current canonical SEO pass first.
2. Import one course package with a dry run.
3. Review conflicts, warnings, and canonical URL output.
4. Execute the course import.
5. Verify the imported public course before importing students.
6. Import the student roster for that course.
7. Repeat in small batches instead of loading the whole catalog blind.

## Required Verification Per Course

- Preserved public URL matches the existing live migrated path exactly.
- Course sales page renders on the preserved canonical URL.
- Canonical metadata points to the preserved public URL.
- Title, subtitle, SEO title, and SEO description imported correctly.
- Curriculum order, preview flags, and media URLs imported correctly.
- Testimonials and FAQ content imported and render cleanly.
- Product and offer were created and checkout resolves.
- Thank-you path and public return links point back to the canonical route.

## Student Import Verification

- Dry run completes without unresolved conflicts.
- Imported students are enrolled into the intended course only.
- Learner dashboard shows the imported course.
- Preview and gated lessons behave correctly for enrolled students.

## Suggested Batch Discipline

- Migrate a small representative batch first:
  - one standard course
  - one course with many lessons
  - one course with testimonials and FAQ
  - one course with a preserved legacy path
- Only scale up after those shapes verify cleanly.

## Regression Checks

Run these before bulk rollout and after any importer changes:

```bash
npm run lint
npm run build
npm run prisma:check:imports
```

## What Does Not Need To Be Migrated For SEO

- learner dashboard routes
- lesson/player URLs
- preview lesson URLs
- checkout routes
- purchased/thank-you routes
- auth or admin pages

Only public sales/discovery/legal surfaces should be treated as crawlable SEO assets.

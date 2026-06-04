# Perseus Design Rules

These rules preserve the Perseus Arcane Academy direction shown in the reference screenshots and v2 design-system brief. They are the source of truth before changing public or learner UI.

For the current public-side authority, read `design-rules/public-design-system-v2.md` first. Use `design-rules/public-design-system-v2-addendum.md` for approved addendum patterns. For admin surfaces, read `design-rules/admin-design-system.md`. Use `design-rules/design-master-index.md` to decide which source document applies to a task. `design-rules/original-design-reference.md` remains as historical context from the earlier CreatorOS reference.

## Core Influence Map

- GroupApp gives the structure: fixed learner navigation, clear course grids, progress states, and practical layouts.
- Creem gives confidence: generous but controlled spacing, direct CTAs, strong pricing, and polished hover lift.
- Perseus gives the soul: night-sky depth, violet accents, gold premium cues, ornamental restraint, and mystical atmosphere.

## Default Decision Rule

Improve clarity and operation without diluting the original style. A dense catalog can be compact, but it should still feel like Perseus, not a generic storefront and not a Payhip clone.

Public UI should give direction, not internal explanation. Student-facing pages must not expose admin/configuration language, environment details, or implementation wording.

## Surface Intent

- Catalog pages are for browsing and comparison, so they should be space efficient.
- Sales pages are for persuasion and confidence, so they can be richer and more atmospheric.
- Learner pages are for progress and focus, so they should prioritize clear navigation and content hierarchy.
- Admin pages stay separate: light, operational, and low-friction.
- Public auth and preview access pages are for clean student account entry, not separate "free account" marketing pages.

## Admin Design Standard

Admin UI follows `design-rules/admin-design-system.md`: always light, compact, status-forward, and task-first. Borrow its cleanliness where useful, but do not move public ceremonial styling into admin or admin utilitarian styling wholesale into public pages.

## Editorial Section Pattern

Use the v2 editorial pattern for major public narrative sections only: homepage proof blocks, curriculum/teacher framing, public FAQ introductions, sales-page proof, and instructor story sections. The pattern is a muted mono eyebrow, sharp `Cinzel` section title, optional italic lavender-to-gold emphasis, and restrained `DM Sans` supporting copy.

Do not apply this pattern to dense operational surfaces such as admin, checkout form internals, catalog cards, learner dashboard cards, lesson navigation, tables, forms, or settings.

## Addendum Patterns

Use the v2 addendum patterns where they fit the page job: horizontal feature rows, tier escalation rows, verified proof/stat strips, sales-page pricing blocks, sticky subnav, mobile nav/footer refinements, learner stat cards, and flatter card rest states.

These are optional patterns, not global restyles. Do not copy sample claims, emoji examples, or source HTML directly into the app.

## Source Document Routing

The Claude master index is a governance map, not a production UI spec. Use it to choose which design references to read before changing a surface.

| Task | Consult |
| --- | --- |
| Public pages | `perseus_design_system_v2.html` + `perseus_ds_v2_addendum.html` |
| Admin pages | `design-rules/admin-design-system.md` + `perseus_admin_design_system.html` |
| Sales pages | DS v2 + `perseus_sales_page_design_spec.html` when provided |
| Checkout and pricing | DS v2 addendum pricing pattern + gateway/business rules |
| Sparse imports | Sales spec when provided; otherwise current import and sales safeguards |

Repo rules win when they are stricter: `Cinzel` remains the regular public display font, `Cinzel Decorative` remains rare, admin stays light/utilitarian, and proof claims must be DB-backed, imported, or explicitly approved.

## Drift Checks

Before shipping a UI change, check:

- Does it use the Perseus token palette instead of random new colors?
- Is display typography reserved for hero or section-level moments?
- Does the page speak to the student or buyer rather than explaining implementation details?
- Are cards compact where the user is browsing many items?
- Are labels meaningful to the learner or buyer?
- Does the page still feel dark, layered, and premium without becoming bloated?

# Perseus Public Design System v2 Addendum

This addendum records approved patterns from `perseus_ds_v2_addendum.html`. It extends `design-rules/public-design-system-v2.md`; it does not replace it.

Use these patterns as design guidance for future UI passes. Do not copy the addendum HTML or its sample copy directly into production.

## Approved Patterns

- Horizontal feature rows: use for narrative "why/how it works" sections where each row explains one idea. Prefer this over equal card grids when the content is sequential or explanatory.
- Tier escalation rows: use for curriculum depth, progression, and foundation-to-capstone framing on collection, instructor, and sales pages.
- Equation/proof blocks: use only when every term and result is verified or explicitly approved. Keep them rare and high-signal.
- Stat/proof strips: use for dynamic or verified numbers only. Never use them for imported/static claims that can drift.
- Pricing blocks: use on sales pages to make price, access, included value, guarantee, and checkout action unmistakable.
- Sticky subnav: use on long sales, collection, or instructor pages where anchors help the buyer or learner move through the page.
- Mobile nav refinements: use compact brand treatment, clear menu rows, and stacked CTAs without exposing admin or implementation language.
- Footer refinements: preserve the structured footer, newsletter opt-in, legal links, and quiet social/contact treatment.
- Learner stat cards: use restrained dashboard stats for learner progress, access, and continuation states.
- Flatter card rest state: cards should rest quietly with thin borders and controlled surface color, then lift subtly on hover.

## Guardrails

- Do not use invented claims from the addendum HTML. Course, teacher, curriculum, guarantee, review, and proof claims must be database-backed, source-backed, or explicitly approved.
- Do not use emoji/icon examples literally. Replace them with approved symbols, lucide icons, or existing Perseus marks where needed.
- Keep `Cinzel` as the regular display font. `Cinzel Decorative` remains rare and should not become the default for stat values, cards, or routine headings.
- Do not apply public editorial patterns to admin tables, admin forms, admin settings, or operational dashboards.
- Do not show proof/stat values unless they are dynamic, verified, or deliberately approved static facts.
- Do not show "missing" pricing features on a single-course page unless there is a real higher-tier comparison.

## Surface Fit

- Homepage: horizontal feature rows, proof strips, flatter cards, mobile/footer refinements.
- Sales pages: pricing blocks, guarantee/confidence rows, sticky subnav, proof strips, tier escalation where it clarifies course depth.
- Collection and instructor pages: tier escalation, horizontal feature rows, sticky subnav, connected curriculum/instructor rows.
- Learner dashboard: stat cards and flatter card rest state only; avoid public marketing patterns.
- Checkout: small trust/confidence rows may be used, but checkout form internals stay practical and tokenized.
- Admin: no adoption except documentation awareness.

## Implementation Notes

- Implement these as reusable patterns or semantic classes only when a surface needs them.
- Keep colors on existing theme variables and avoid one-off palette additions.
- Keep transitions controlled, around `0.18s`, and radii within the established restrained scale.
- Any production version must be responsive at mobile widths before shipping.

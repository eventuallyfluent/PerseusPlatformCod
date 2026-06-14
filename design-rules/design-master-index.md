# Design Master Index

`perseus_design_master_index.html` is a governance index for the Perseus design reference files. It is not a live UI spec and should not be copied into production components.

## Reading Order

1. `perseus_design_system_v2.html`
2. `perseus_ds_v2_addendum.html`
3. `perseus_admin_design_system.html`
4. `perseus_sales_page_design_spec.html`
5. `perseus_homepage_v3.html`

## Current Source Availability

- Available locally in `C:\Users\stude\Downloads\PERSEUS DESIGNS`: `perseus_design_system_v2.html`, `perseus_ds_v2_addendum.html`, `perseus_admin_design_system.html`, `perseus_design_master_index.html`, `perseus_homepage_v3.html`, `perseus_sales_page_design_spec.html`, `perseus_checkout_architecture.html`, and `perseus_build_plan.html`.
- Extracted into repo rules: `design-rules/public-design-system-v2.md`, `design-rules/public-design-system-v2-addendum.md`, and `design-rules/admin-design-system.md`.
- The Claude visual direction is now the preferred visual target for public, sales, checkout, and admin surfaces.
- `perseus_build_plan.html` is not an execution plan for this repo. It is a greenfield-flavored reference and must be reconciled against current implementation before use.

## Which File To Consult

| Task | Consult |
| --- | --- |
| Public pages | DS v2 plus the DS v2 addendum |
| Admin pages | `design-rules/admin-design-system.md` plus the admin design system reference |
| Sales pages | DS v2 plus the sales-page spec when provided |
| Checkout and pricing | Addendum pricing blocks plus gateway/business rules plus `perseus_checkout_architecture.html` |
| Sparse imports | Sales-page spec once provided; otherwise current import and sales safeguards |

## Guardrails

- The master index is a routing document, not a source of new claims, prices, guarantees, or course facts.
- Existing repo rules remain authoritative when stricter than the index.
- Student accounts are required for previews, free courses, purchases, and the learner library. Reject any "no account required" public copy.
- Checkout architecture should target true agnostic gateway support: any safe provider API can be added through native adapters or configured API profiles without leaking provider assumptions into order, access, tax, or fulfillment core.
- `Cinzel` remains the regular public display font.
- `Cinzel Decorative` remains rare and ceremonial, not a default hero requirement.
- Admin stays light, utilitarian, and separate from public themes.
- Public and sales proof claims must be DB-backed, imported, source-backed, or explicitly approved.

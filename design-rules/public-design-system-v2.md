# Perseus Public Design System v2

This is the public-side design authority extracted from `perseus_design_system_v2.html`. Use it before changing homepage, catalog, collection, instructor, sales, checkout shell, learner, or public auth surfaces.

The approved pattern/component extension is `design-rules/public-design-system-v2-addendum.md`, extracted from `perseus_ds_v2_addendum.html`. The addendum extends this file; it does not replace it.

Do not paste the HTML reference directly into the app. Treat it as a governance document: tokens, page jobs, typography roles, copy rules, and component patterns. Any factual curriculum, teacher, price, review, or course claim must come from the database, imported source material, or explicitly approved copy.

## Core Principles

- Structure before decoration: layout should route the student or buyer clearly before adding atmosphere.
- Mystical, not theatrical: violet depth, gold restraint, and subtle texture; no exaggerated fantasy treatment.
- Direction, not explanation: public pages should guide the next action instead of over-instructing the user.
- No invented claims: never add curriculum, teacher, outcome, access, review, guarantee, or payment claims unless verified.
- Strict font roles: each font has a job and should not drift into unrelated surfaces.
- Tokens only: components should use semantic theme variables instead of one-off colors.

## Typography Roles

- `Cinzel`: default public display font for section titles, card titles where appropriate, instructor names, stage titles, and sharp editorial headings.
- `Cinzel Decorative`: rare ceremonial accent only, usually brand moments or a carefully reviewed hero H1. Do not use it as the global heading font.
- `DM Sans`: body copy, UI, buttons, forms, learner surfaces, checkout internals, catalog metadata, and admin.
- `JetBrains Mono`: eyebrows, metadata, course counts, prices, references, codes, and technical labels.

Editorial headings may use a split line: strong primary text first, then an optional italic lavender-to-gold emphasis. Keep this for major public narrative sections, not dense UI.

## Canonical Public Tokens

Dark public theme:

- Base: `#0D0D1A`
- Surface: `#1A1A2E`
- Elevated: `#252540`
- Hover: `#2E2E52`
- Brand: `#7B2FBE`
- Brand hover: `#9B3FDE`
- Accent: `#C084FC`
- Gold: `#D4A855`
- Primary text: `#F0EAF8`
- Secondary text: `#A78BCA`
- Muted text: `#6B5B8A`
- Border: `#2E2E4E`
- Bright border: `#4A3A6E`

Light public theme:

- Base should be white or neutral near-white, not pink or lavender.
- Surface should be neutral parchment/white.
- Primary text should be deep ink/aubergine.
- Borders should be neutral cool gray.
- Purple remains the brand/action contrast.
- Gold is reserved for premium/trust cues.

Admin remains a separate clean operational theme and should not inherit public ceremonial styling.

## Page Jobs

Homepage:

- Get the right person to the right door quickly.
- Show paths, proof, teachers, free starting points, selected advanced paths, FAQ, and a final CTA.
- Do not carry detailed curriculum-stage explanations on the homepage.

Collection and instructor pages:

- Explain the curriculum line or teacher clearly.
- Show all relevant stages, courses, bundles, and progression.
- Use row/list structures where depth matters.

Sales pages:

- Close the purchase with confidence.
- Use a strong hero, what-you-get proof, instructor trust, curriculum/access details, pricing/CTA, purchase FAQ, and final CTA.
- Keep unrelated imported media, vague badges, and static review claims out of the top section.

Checkout:

- Be a clean payment surface.
- Use public theme tokens for the shell, but keep form internals practical and readable.
- Do not introduce provider-specific assumptions into the UI copy.

Learner:

- Prioritize progress, continuation, course access, and lesson focus.
- Keep ceremony secondary to usability.

Public auth and preview access:

- Copy must speak to the student, not the admin.
- Explain the account benefit plainly: one account for previews, free courses, purchases, and course library.
- Avoid implementation language such as configuration, environment, or internal support process unless shown only to admins.

## Component Patterns

- Buttons: strong purple primary, transparent/outlined secondary, quiet ghost, gold only for premium actions.
- Badges: uppercase, pill-shaped, semantic, and meaningful to the learner or buyer.
- Course cards: image or intentional gradient placeholder, compact metadata, readable title, price/action where relevant.
- Collection rails: on the homepage, collections may show compact horizontal previews and a clear `View all` action.
- Instructor and curriculum rows: use connected row-list patterns with thin dividers for dense public proof.
- FAQ: use restrained accordion rows with a strong left-side or top intro on editorial pages.
- Pull quotes: use sparingly for proof, philosophy, or transition moments.
- Addendum patterns: horizontal feature rows, tier escalation rows, verified proof/stat strips, sales-page pricing blocks, sticky subnav, learner stat cards, and flatter card rest states may be used when they match the surface job.

## Copy Rules

Use copy that is confident, direct, and precise.

Good direction:

- `Real teachers. Structured training. Lifetime access.`
- `Explore Sixty Skills`
- `Start with a free course`
- `One student account for previews, purchases, and your course library.`

Avoid:

- vague transformation promises
- marketplace filler
- internal/admin instructions on public pages
- invented curriculum claims
- static proof numbers that should be dynamic
- labels that do not help the buyer or learner decide

## Implementation Rules

- Use CSS variables or semantic utility classes for colors.
- Keep radius restrained: roughly `4px`, `10px`, `14px`, `20px`, and pill.
- Use `clamp()` for large display type.
- Keep hover transitions quick and controlled, around `0.18s`.
- Card thumbnails must never look broken; use an intentional placeholder when no image exists.
- Do not use nested cards unless the structure is truly a modal, repeated item, or framed tool.
- Do not apply public editorial styling to admin tables, forms, settings, or operational dashboards.

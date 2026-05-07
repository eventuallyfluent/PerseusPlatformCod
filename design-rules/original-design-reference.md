# Original CreatorOS / Perseus Design Reference

This file captures the durable rules from `CreatorOS_DesignSystem.html`. Use it as the design authority before changing public, sales, checkout, or learner UI.

## Core Direction

- GroupApp provides structure: practical navigation, course grids, learner progress, and clear page hierarchy.
- Creem provides confidence: polished CTAs, direct pricing, generous but controlled spacing, and refined hover states.
- Perseus provides identity: night-sky depth, violet accent, gold premium cues, ornamental restraint, and mystical atmosphere.

## Canonical Tokens

- Base background: `#0D0D1A`
- Surface: `#1A1A2E`
- Elevated surface: `#252540`
- Hover surface: `#2E2E52`
- Brand purple: `#7B2FBE`
- Brand hover: `#9B3FDE`
- Accent lavender: `#C084FC`
- Gold / premium: `#D4A855`
- Primary text: `#F0EAF8`
- Secondary text: `#A78BCA`
- Muted text: `#6B5B8A`
- Border: `#2E2E4E`
- Success: `#34D399`
- Warning: `#FBBF24`
- Danger: `#F87171`
- Admin light surface: `#FAFAFA`

Use existing semantic CSS variables in code rather than hardcoded values.

## Typography

- Display font target: `Cinzel Decorative`.
- UI/body font target: `DM Sans`.
- Mono/metadata target: `JetBrains Mono`.
- Display typography belongs only in hero, brand, major section, and ceremonial page moments.
- UI text, buttons, forms, badges, checkout, admin, lesson navigation, and cards should use the body/UI font.
- Catalog and dashboard cards must not use hero-scale typography.

## Shape And Density

- Original radius scale is tighter than many current surfaces:
  - small: `6px`
  - medium: `10px`
  - large: `14px`
  - extra large: `20px`
  - pill: `999px`
- Keep catalog, dashboard, and learner surfaces compact enough for scanning.
- Sales pages can be more spacious, but should still avoid large empty panels.
- Avoid nested cards and decorative sections that do not help a buyer or learner decide.

## Component Guidance

- Buttons: strong purple primary, transparent/outlined secondary, quiet ghost, gold only for premium.
- Badges: uppercase, pill-shaped, semantic color only.
- Course cards: image/thumb, instructor or source metadata, compact title, short support copy where useful, price/action.
- Collections: public/homepage collection cards should be image or color-led tiles with large title and one action; do not list the contents of the collection inside the tile.
- Admin: keep light, utilitarian, and separate from the mystical public UI.

## Drift Checks

- Does this use the Perseus palette instead of one-off colors?
- Is display type reserved for a true display moment?
- Is the UI compact where users scan many products?
- Does every badge or label communicate something useful?
- Does the page still feel premium without becoming bulky?
- Does the implementation improve operation, not just decoration?

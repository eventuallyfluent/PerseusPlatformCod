# Perseus Theme System

## Active themes
- `Perseus Dark Theme1`
  Current public and student baseline.
- `Perseus Light Theme1`
  Active public and student light mode paired to the same semantic token contract.
- `Admin Clean`
  Separate admin treatment focused on legibility and operational clarity.

## Surface ownership
- Public and learner surfaces use the Perseus dark/light theme track.
- Admin surfaces use `Admin Clean` only.
- Admin does not expose the public theme toggle.

## Typography
- Display: `Cormorant Garamond`
- Body/UI: `Manrope`

## Perseus Dark Theme1
- Deep night-violet canvas
- Lavender brand accent
- Gold premium accent
- Soft violet glows, not harsh neon
- Large rounded panels and cards
- Elevated surfaces should stay atmospheric and layered

## Token contract
- Surfaces:
  - `--surface-canvas`
  - `--surface-canvas-soft`
  - `--surface-panel`
  - `--surface-panel-strong`
- Text:
  - `--text-primary`
  - `--text-secondary`
  - `--text-muted`
- Borders:
  - `--border`
  - `--border-strong`
- Brand:
  - `--accent`
  - `--accent-strong`
  - `--accent-soft`
  - `--accent-glow`
  - `--premium`
- Status:
  - `--status-success`
  - `--status-warning`
  - `--status-danger`
- Structure:
  - `--shadow-panel`
  - `--shadow-brand`
  - `--radius-panel`
  - `--radius-card`
  - `--radius-field`
  - `--radius-pill`

## Required component rules
- Shared public and learner components must use semantic theme tokens, not hardcoded dark or light colors.
- Acceptable patterns:
  - `var(--surface-panel)`
  - `var(--surface-panel-strong)`
  - `var(--text-primary)`
  - `var(--text-secondary)`
  - `var(--border)`
  - `var(--border-strong)`
- No new shared component should ship with:
  - `text-white` as its normal tone
  - raw dark RGBA panel backgrounds
  - direct `stone-*` utility colors
  - fixed `bg-white/...` panel styling
- Theme-locked exceptions are allowed only for intentionally atmospheric hero sections or overlays.

## Admin Clean principles
- Light, restrained, and readable
- Consistent panel backgrounds and borders
- Predictable form and table treatment
- No decorative storefront glow language beyond subtle accent support
- Admin should feel intentional, not branded for spectacle

## Light Theme1 direction
- Keep the same typography, spacing, radius, and hierarchy
- Translate Perseus into a pale arcane palette rather than plain white SaaS UI
- Maintain lavender and gold identity with lower glow intensity
- Use the same semantic token map so components do not need renaming when light mode is added

# Perseus Theme System

## Active theme tracks
- `Perseus Original`
  Preserved baseline of the current public/student UI.
- `Perseus Modern`
  Sharper forward-facing public/student family using the same Perseus brand DNA.
- `Admin Clean`
  Separate admin treatment focused on legibility and operational clarity.

## Runtime ownership
- Public and learner surfaces use one public theme family selected in admin:
  - `original`
  - `modern`
- Public and learner users still choose `dark` or `light` mode in the footer.
- Admin surfaces use `Admin Clean` only.
- Admin does not inherit or expose the public theme family visually.

## Public families
### Perseus Original
- `Perseus Original Dark`
  Exact preservation of the prior dark public/student UI.
- `Perseus Original Light`
  Exact preservation of the prior light public/student UI.

### Perseus Modern
- `Perseus Modern Dark`
  More cinematic contrast, cleaner hierarchy, tighter surfaces, stronger hero presence.
- `Perseus Modern Light`
  More editorial and premium than the Original light mode, without losing the Perseus palette.

## Typography
- Display: `Cormorant Garamond`
- Body/UI: `Manrope`

## Shared token contract
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

## Surface ownership
- Public + learner:
  - homepage
  - sales pages
  - checkout
  - thank-you pages
  - preview
  - dashboard
  - learner player shell
  - shared public header/footer/buttons/cards/forms
- Admin:
  - `Admin Clean` only

## Required component rules
- Shared public and learner components must use semantic theme tokens, not hardcoded dark or light colors.
- Acceptable patterns:
  - `var(--surface-panel)`
  - `var(--surface-panel-strong)`
  - `var(--text-primary)`
  - `var(--text-secondary)`
  - `var(--border)`
  - `var(--border-strong)`
- Family-specific styling should prefer semantic class hooks plus token overrides, not one-off inline colors.
- No new shared public/learner component should ship with:
  - default `text-white`
  - raw fixed dark RGBA panels
  - direct `stone-*` utility colors
  - fixed `bg-white/...` surfaces
- Theme-locked exceptions are allowed only for intentionally isolated overlays such as focus mode.

## Admin Clean principles
- Light, restrained, and readable
- Consistent panel backgrounds and borders
- Predictable form and table treatment
- No decorative storefront glow language beyond subtle accent support
- Admin should feel intentional, not branded for spectacle

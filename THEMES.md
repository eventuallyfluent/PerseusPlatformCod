# Perseus Theme System

## Active theme tracks
- `Perseus Public`
  The single public and learner theme track.
- `Admin Clean`
  Separate admin treatment focused on legibility and operational clarity.

## Runtime ownership
- Public and learner surfaces use one shared theme track only.
- Public and learner users still choose `dark` or `light` mode in the footer.
- Admin surfaces use `Admin Clean` only.

## Public modes
- `Perseus Dark`
  Premium night-sky public/student UI using the v2 public design direction.
- `Perseus Light`
  White/neutral-first public/student UI with dark purple contrast. It should not drift pink or lavender.

## Public design authority
- Public, checkout shell, learner, preview, catalog, sales, collection, and instructor surfaces should follow [design-rules/public-design-system-v2.md](C:\Users\stude\OneDrive\Desktop\Perseus Platform\design-rules\public-design-system-v2.md).
- Admin remains separate and should not inherit the public ceremonial/editorial treatment.
- Public copy should speak to students and buyers, not describe implementation, configuration, or admin mechanics.

## Typography
- Display: `Cinzel`
- Ceremonial accent: `Cinzel Decorative`, rare and not global
- Body/UI: `DM Sans`
- Metadata/technical labels: `JetBrains Mono`

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

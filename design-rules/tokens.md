# Tokens

Public and learner UI should use semantic CSS variables. These values define the original dark direction.

## Canonical Dark Values

- Base: `#0d0d1a`
- Surface: `#1a1a2e`
- Elevated: `#252540`
- Brand: `#7b2fbe`
- Brand hover: `#9b3fde`
- Accent: `#c084fc`
- Gold / premium: `#d4a855`
- Primary text: `#f0eaf8`
- Secondary text: `#a78bca`
- Border: `#2e2e4e`
- Success: `#34d399`
- Warning: `#fbbf24`
- Danger: `#f87171`

## Rules

- Use `var(--surface-panel)`, `var(--surface-panel-strong)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border)`, `var(--accent)`, and related semantic variables in components.
- Do not introduce one-off dark panels, new violet shades, or fixed light text in reusable public/learner components.
- Use gold only for premium, price emphasis, stars, certificates, or deliberately premium states.
- Use success, warning, and danger only for real status meaning.

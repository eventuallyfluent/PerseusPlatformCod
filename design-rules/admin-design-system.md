# Admin Design System

This file records the usable admin standards from `perseus_admin_design_system.html`. Admin is a separate product surface: clean, light, compact, and operational. It should feel easy on the eye because it removes ceremony, not because it becomes plain or unfinished.

## Principles

- Admin is always light mode. Do not inherit public dark, light, or Dynamic theme treatments.
- Admin is task-first: pages should make state, next action, and risk obvious.
- Use compact spacing and practical information density. White space supports scanning; it is not atmospheric decoration.
- Purple is reserved for the logo, primary actions, active navigation, links, and focus rings. It is not a panel or page-background color.
- Red is reserved for errors and destructive actions only.
- Every important object shows explicit state through a semantic badge. State is never implied.

## Typography

- `DM Sans` is the admin body/UI font for tables, forms, buttons, labels, navigation, and helper text.
- `JetBrains Mono` is used for IDs, order references, prices, codes, timestamps, small uppercase labels, and technical metadata.
- `Cinzel` may appear only in the admin logo or restrained page titles if already established.
- `Cinzel Decorative` is never used in admin.

## Layout

- Use an admin shell with a compact topbar, left navigation, and a scrollable content area.
- The content background is neutral light gray; panels are white.
- Panels use muted borders, restrained radii, and simple headers.
- Avoid public-site haze, ornamental gradients, oversized hero sections, nested decorative cards, and theatrical display headings.
- Overview pages should summarize; detailed inboxes, tables, and editors belong on their own pages.

## Controls

- Admin buttons are smaller and denser than public buttons.
- Primary actions use purple; secondary actions are neutral; danger actions use red.
- Hover states should use shadow, border, or background changes. Do not use public-style lift as the main admin interaction.
- Destructive actions require confirmation that states what will happen and what cannot be undone.
- Confirmation button labels must restate the action, for example `Yes, Delete Course`, not `OK`.

## Forms

- Labels are clear, compact, and close to their controls.
- Helper text explains the admin consequence, not public marketing copy.
- Required fields are visually explicit.
- Inline validation appears below the relevant field. Do not rely on a generic toast for field-level errors.
- Toggles and checkboxes should state the active behavior plainly.

## Tables

- Tables are the default for dense admin data.
- Header labels are small, uppercase, and mono.
- Row hover uses a quiet neutral background.
- Monetary values, IDs, dates, and gateway references use mono text.
- Actions are right-aligned and last.
- Preferred column order: checkbox, primary identifier, key fields, monetary value, date, status badge, actions.
- Tables should have footer pagination. Do not use infinite scroll for admin records.

## Status Badges

- Badges are semantic and consistent across admin.
- Required status families include published/draft, paid/pending/refunded/free, active/inactive, completed/revoked, success/warning/error/info.
- Status colors are for meaning, never decoration.
- A record that needs action should have a visible pending, warning, failed, unread, or incomplete state.

## Page Guidance

- Dashboard: show stable metrics, recent operational queues, health/readiness indicators, and per-section fallback states.
- Courses: title, instructor, collection, enrollments, revenue, publish state, and actions should scan quickly.
- Students: name/email, enrollments, total spent, join date, last active, status, and profile access should be easy to find.
- Orders: order ID, student, product, amount, gateway, status, date, and actions should be visible without opening every order.
- Imports: show target course, row counts, modules, lessons, media status, execution status, and actionable errors.
- Gateways/tax/settings: show readiness and incomplete configuration states explicitly, especially when live selling can be affected.

## Business Guardrails

- Never grant course access without a corresponding order or explicit free-order record.
- Free orders are handled locally; never send a zero-value charge to a payment gateway.
- Payment gateway copy must remain provider-agnostic.
- Email marketing opt-in must be explicit and never pre-checked.
- Refund, revoke, delete, unpublish, and destructive bulk actions require confirmation.
- Admin-facing gateway errors and raw webhook/provider data may be logged or shown in admin, but never exposed to students.

## Relationship To Public UI

- Admin cleanliness is a useful discipline for public surfaces: fewer nested cards, clearer rows, flatter resting states, and better status labels.
- Do not make public pages look like admin. Public pages may remain atmospheric and premium when the page job requires persuasion or orientation.
- Do not make admin pages ceremonial. Admin exists to operate the platform quickly and safely.

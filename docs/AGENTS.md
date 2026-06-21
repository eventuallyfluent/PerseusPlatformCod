# Documentation Instructions

## Purpose

Owns operational, architectural, migration, payment, and bridge documentation that guides platform decisions and rollout behavior.

## Ownership

- Import safety lives in `import-safety-principles.md`.
- Payment gateway architecture lives in `payment-gateway-principles.md`.
- EU online withdrawal compliance and refund operations live in `eu-contract-withdrawal.md`.
- Optional WordPress bridge planning lives in `wordpress-plugin-bridge.md`.

## Local Contracts

- Documentation should describe durable decisions, constraints, and runbooks, not diary entries.
- Keep docs aligned with current code behavior and verification scripts.
- Payment docs must preserve the gateway-agnostic contract.
- Import docs must preserve the no-heavy-work-in-upload/start contract.

## Work Guidance

- Prefer direct operational bullets over broad narrative.
- Link to concrete scripts, routes, or files when useful.
- Remove stale statements instead of adding historical caveats.

## Verification

- For docs-only edits, proofreading and DOX chain review are usually sufficient.
- If docs describe a check or command, confirm it exists in `package.json` or the relevant folder.

## Child DOX Index

This subtree is not further indexed yet.

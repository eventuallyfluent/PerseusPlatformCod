# EU Online Contract Withdrawal

## Legal basis

- [Directive (EU) 2023/2673](https://eur-lex.europa.eu/eli/dir/2023/2673/oj) inserts Article 11a into Directive 2011/83/EU. Member States were required to transpose it by 19 December 2025 and apply those measures from 19 June 2026.
- For distance contracts concluded through an online interface, the withdrawal function must remain continuously available during the withdrawal period, be prominent and easy to access, and use wording such as "withdraw from contract here" or an equally unambiguous phrase.
- The function must collect the consumer's name, contract identifier, and an electronic acknowledgement destination; show a separate confirmation control; and send an acknowledgement on a durable medium without undue delay with the submission content, date, and time.
- A submission made before the withdrawal period expires is timely. The normal statutory period is 14 days, subject to the Consumer Rights Directive's scope, national implementation, exceptions, and any longer contractual promise.

This repository applies the online function to all authenticated purchasers rather than making legal eligibility depend on incomplete location data. This is a conservative product policy, not a conclusion that every purchase is governed by EU law.

## Platform workflow

1. `/withdraw` lists the signed-in customer's paid orders and calculates the 14-day online period from order creation.
2. The first control selects the contract. A separate form confirms the withdrawal and captures the customer's name and acknowledgement email.
3. Confirmation creates an immutable withdrawal record with a 14-day reimbursement due date, immediately revokes access attributable only to that order, and sends a timestamped email acknowledgement. The receipt remains available in the customer account.
4. The withdrawal remains in `REFUND_QUEUED` until a supported provider integration starts processing it. Provider refund confirmation finalizes the order through the canonical `refund.created` handler.
5. Open withdrawals are ordered by refund deadline in the admin queue. An admin may reconcile one manually only after confirming that the external provider already returned the money; that action never moves money itself.

## Operating rules

- A received withdrawal remains received even when email delivery or automated refund initiation fails. Never discard or overwrite the submission because downstream processing failed.
- Do not report a refund as completed until the provider confirms it or an admin confirms an external refund.
- Keep `RESEND_API_KEY` and `AUTH_EMAIL_FROM` configured in production so the required acknowledgement can be delivered without undue delay.
- Provider webhooks and explicit external reconciliation must converge on `finalizeOrderRefund`, which updates financial state and revokes all order-derived access idempotently.
- Legal copy must not claim that digital delivery alone removes a statutory withdrawal right. Any future loss-of-right flow for immediately supplied digital content requires separately reviewed express-consent and acknowledgement evidence at checkout.

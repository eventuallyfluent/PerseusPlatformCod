# WordPress Plugin Compatibility Bridge

## Summary

WordPress plugin compatibility should be delivered through an optional bridge plugin and signed Perseus APIs. Perseus should not attempt to execute arbitrary WordPress plugins directly.

WordPress remains the PHP/plugin runtime. Perseus remains the course platform, commerce system, access authority, checkout intent creator, and fulfillment system.

## Bridge Model

- A companion Perseus WordPress plugin is installed in WordPress.
- The plugin stores the Perseus API URL, a scoped bridge secret, and enabled bridge modules.
- WordPress plugins continue running inside WordPress normally.
- The bridge listens to selected WordPress, WooCommerce, and plugin-specific hooks.
- When a supported event occurs, the bridge signs an outbound event and sends it to Perseus.
- Perseus verifies the signature, checks replay/idempotency, normalizes the event, and updates its own database.

WordPress never writes directly to the Perseus database.

## WooCommerce Module

WooCommerce should be the first bridge module because it opens many payment gateway options.

Flow:

1. Perseus creates a pending order and checkout intent.
2. Perseus redirects the buyer to a WordPress bridge checkout URL with the Perseus order reference.
3. The WordPress bridge creates or maps a WooCommerce order.
4. WooCommerce processes payment through the active WooCommerce payment plugin.
5. The bridge listens for paid, failed, refunded, canceled, and subscription lifecycle events.
6. The bridge sends a signed callback to Perseus.
7. Perseus verifies the callback, updates the order/payment state, and grants access automatically after verified payment.

Normal WooCommerce bridge payments must not require Perseus admin confirmation. Manual confirmation is only acceptable for bank transfer, exceptional provider review states, failed webhook recovery, or reconciliation.

## General Plugin Modules

The bridge should be general enough to support more than WooCommerce.

Potential modules:

- Forms: WPForms, Gravity Forms, Contact Form 7 style submissions into Perseus leads/support workflows.
- Memberships: membership level or subscription changes into Perseus account/access events.
- Affiliates: referral attribution and commission metadata into Perseus orders.
- Coupons: external coupon validation or attribution into Perseus checkout metadata.
- CRM/email tools: subscribe, tag, or customer status events into Perseus customer records.
- Media/content sync: selected media or content references into Perseus imports or admin review queues.

Each module should be isolated. Adding one integration must not make WordPress required for unrelated Perseus workflows.

## Security Requirements

- Every callback to Perseus must be signed with a scoped bridge secret.
- Include timestamp and nonce values to prevent replay.
- Store received event ids for idempotency.
- Reject unsigned, expired, malformed, or duplicate events.
- Use least-privilege bridge scopes per module.
- Log bridge events for admin audit and troubleshooting.
- Never trust WordPress event payloads as final authority without Perseus-side validation.

## Acceptance Criteria

- Documentation clearly states that Perseus does not run arbitrary WordPress plugins directly.
- WooCommerce bridge flow is documented from Perseus checkout intent to automatic access grant.
- Non-payment plugin event flow is documented as signed inbound events.
- Security requirements include signed requests, replay protection, idempotency, scoped bridge secrets, and audit logging.
- The bridge remains optional and does not make WordPress part of the required Perseus runtime.

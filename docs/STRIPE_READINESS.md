# Stripe and SMS readiness

## Current safety state

Stripe and automated SMS are intentionally disabled. The site must continue to operate as a draft booking-request system until Kia's owner-controlled accounts and credentials are connected and tested.

- `PAYMENTS_ENABLED` remains `false`.
- `stripe_checkout_enabled` remains `false`.
- `sms_live_enabled` remains `false`.
- No Stripe secret, webhook secret, publishable key, or SMS credential belongs in GitHub.

## Approved future deposit flow

1. The server calculates the normal deposit tier from the immutable displayed estimate stored with the booking.
2. The customer pays that deposit through Stripe.
3. A verified Stripe webhook records the payment once and changes the payment status to `deposit_paid` while the booking remains `pending_review`.
4. The customer sees **Deposit paid — awaiting Kia's approval.** Payment alone does not confirm the appointment.
5. The paid request holds the full requested appointment duration and buffers while Kia reviews it.
6. Kia performs the final availability and price review. Approval changes the booking to `confirmed`.
7. If Kia declines a paid request or the time is unavailable, the server requests and records a refund.

The displayed estimate is not the final service total. Kia must approve the final service total before the appointment is official.

## Prepared records

- `payment_transactions` stores provider IDs, amounts, statuses, receipt URLs, failure codes, and timestamps.
- `payment_refunds` stores refund IDs, amounts, statuses, reason codes, and timestamps.
- `payment_webhook_events` stores a unique provider event ID, event type, payload hash, and processing result. It does not store the raw webhook payload.
- `booking_slot_locks` reserves every 15-minute segment of the full appointment and buffer window in the same D1 batch as a verified payment update.
- Unique database constraints reject duplicate webhook events and multiple successful deposit records for one booking.

## Owner-only connection steps for tomorrow

After Kia creates her Stripe account, add these values through Cloudflare's encrypted secrets interface, never through source files:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`

Only after test-mode checkout, signed-webhook, refund, duplicate-event, decline, approval, and double-booking checks pass should `PAYMENT_PROVIDER=stripe`, `stripe_checkout_enabled=true`, and `PAYMENTS_ENABLED=true` be considered. SMS must remain disabled until an approved provider and its credentials are configured separately.

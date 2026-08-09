# Beauty by Kia — Draft Review

This repository contains the review-only Beauty by Kia booking portal. The application remains visibly labeled **Draft Review — Not Yet Live** and real payment processing is disabled.

## Cloudflare foundation

The approved 30-service catalog, 10 add-ons, prices, deposit tiers, policies, and disabled Grand Opening Special are preserved. The Cloudflare deployment foundation adds:

- Cloudflare Pages Functions for one-time administrator setup and server-side authentication.
- D1 as the production source of truth for services, prices, bookings, availability, policies, settings, sessions, and audit history.
- Separate R2 bindings for the public service gallery and private customer uploads.
- Turnstile verification, login throttling, temporary lockout, secure cookies, session expiration, logout revocation, and PIN changes.
- Atomic first-approved-wins booking approval with full-duration and buffer overlap protection.
- Immutable original booking price snapshots and permanent status history.

Production configuration disables the browser-storage fallback. Local storage remains available only when an owner intentionally runs the application in the development environment. No untrusted browser data is automatically migrated to D1.

## Safeguards

- No Stripe SDK, checkout route, payment secret, or paid provider is present.
- The Grand Opening Special remains off until Brookia approves activation.
- No administrator email, setup PIN, session secret, or Turnstile secret is committed.
- Historical bookings and price snapshots cannot be deleted by ordinary application operations.
- Private customer images never receive permanent public URLs.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Cloudflare owner setup](docs/CLOUDFLARE_SETUP.md)
- [Security, recovery, communications, and backups](docs/SECURITY_AND_OPERATIONS.md)

## Verification

```text
npm test
npm run check
npm run verify:seed
git diff --check
```

This branch is a secure deployment foundation, not authorization to launch publicly. Cloudflare resources, secrets, owner review, and cross-device preview testing are still required.

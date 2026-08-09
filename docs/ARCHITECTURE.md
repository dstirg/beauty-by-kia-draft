# Beauty by Kia Cloudflare architecture

## Production data authority

Cloudflare D1 is the shared production source of truth. The production configuration sets `LOCAL_STORAGE_FALLBACK` to `false`. Browser storage is allowed only in an explicitly selected development environment and is never automatically copied into D1.

The public catalog reads D1. Administrator changes write D1 and become visible to other devices on their next catalog refresh. Booking price snapshots preserve the price, add-ons, estimate, deposit, balance, duration, and policy version that existed when the request was submitted.

Real payments are inactive. The database retains future deposit statuses, but approval currently sets `deposit_not_requested` and confirms no payment.

## D1 tables

The migration creates these required tables:

1. `services`
2. `service_prices`
3. `service_durations`
4. `add_ons`
5. `service_add_ons`
6. `deposit_rules`
7. `promotions`
8. `promotion_services`
9. `weekly_availability`
10. `blocked_dates`
11. `appointment_buffers`
12. `bookings`
13. `booking_services`
14. `booking_add_ons`
15. `booking_price_snapshots`
16. `booking_status_history`
17. `policy_versions`
18. `policy_acceptances`
19. `admin_accounts`
20. `admin_sessions`
21. `login_attempts`
22. `audit_logs`
23. `gallery_images`
24. `private_upload_metadata`
25. `application_settings`

`calendar_blocks` is included for partial-day personal unavailable time. Primary keys, foreign keys, unique constraints, timestamps, indexes, archive fields, and approval/cancellation fields are defined in the migration.

## Pages Function routes

Public and setup routes:

- `GET /api/config`
- `POST /api/setup`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/catalog`
- `POST /api/bookings`
- `GET /api/gallery/:id/content`
- `POST /api/uploads/private`

Authenticated administrator routes:

- `POST /api/admin/security/pin`
- `GET /api/admin/state`
- `PUT /api/admin/state`
- `POST /api/admin/bookings/:id/approve`
- `POST /api/admin/bookings/:id/status`
- `POST /api/admin/gallery`
- `PUT /api/admin/gallery/:id`
- `DELETE /api/admin/gallery/:id`
- `GET /api/admin/gallery/:id/content`
- `GET /api/admin/uploads/:id/content`

All administrator mutations require an active D1 session, a matching same-origin request, and a CSRF token. The browser never decides administrator authorization by itself.

## Booking lifecycle and calendar behavior

Every customer submission starts as `pending_review`; it is not confirmed. Pending requests do not block one another.

On approval, the server recalculates the appointment window from the snapshotted service duration and current before/after buffers. It then checks:

- minimum notice and maximum booking window;
- service visibility;
- Brookia’s working day and opening/closing time;
- blocked and vacation dates;
- partial-day personal blocks;
- daily appointment limit; and
- all buffered `awaiting_deposit` or `confirmed` appointments.

The final D1 update contains a new overlap check in the same atomic statement. Database triggers provide a second overlap guard. This implements first-successfully-approved-wins even when two browsers try to approve competing requests.

If approval loses a race or violates a calendar rule, the request is preserved as `time_unavailable`, its customer details and uploads remain intact, and a status-history and audit entry are created.

Slot-blocking statuses are `awaiting_deposit` and `confirmed`. Cancellation by either party, decline, reschedule request, completion, no-show, and `time_unavailable` release the slot while retaining the booking and status history.

## Price history

Catalog price and duration edits create new current records while closing the earlier record. New requests use current D1 values. Existing requests keep immutable rows in `booking_price_snapshots`, `booking_services`, and `booking_add_ons`. The database rejects update or deletion of original price snapshots.

## R2 separation

`PUBLIC_GALLERY` and `PRIVATE_UPLOADS` are separate R2 bindings and buckets.

Gallery uploads:

- accept only file content that parses as JPEG or PNG;
- enforce an 8 MiB limit and 64–12,000 pixel dimensions;
- remove JPEG APP/COM metadata and nonessential PNG ancillary chunks;
- use SHA-256 duplicate detection;
- use server-generated object names;
- remain private until D1 says the image is published; and
- are streamed through controlled Pages Function routes.

Private uploads use a different object namespace and bucket, never receive public URLs, and are streamed only to an authenticated administrator. D1 records a default 90-day post-upload deletion date; the owner should review retention with Brookia before launch.

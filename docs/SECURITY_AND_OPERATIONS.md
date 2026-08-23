# Security and operations

## Administrator authentication

The one-time setup route compares the submitted email and PIN with encrypted Cloudflare secrets, validates the email and 6–12 digit string format, generates a unique cryptographic salt, and stores only a PBKDF2-SHA-256 hash, salt, and iteration count in D1. The setup locks after the first administrator exists.

Login requires email, PIN, and Cloudflare Turnstile. Unknown email and incorrect PIN return the same message. Login attempts use hashed email/IP identifiers, a 15-minute rate window, and temporary account lockout. Successful login creates a random opaque token whose SHA-256 hash is stored in D1.

The session cookie is `HttpOnly`, `Secure`, `SameSite=Strict`, limited to `/api`, and time-limited. State-changing administrator requests also require the matching same-origin CSRF token. Logout revokes the D1 session.

PIN changes require the current PIN, a new 6–12 digit PIN, and confirmation. A successful change creates a new salt/hash, retains the current session, revokes every other session, and writes a redacted audit event.

## Forgotten-PIN recovery

No email or text provider is active, and the application never reveals or emails a PIN. Recovery is an owner-controlled process:

1. Verify Brookia’s identity outside the application using the business owner’s established procedure.
2. Export and protect a D1 backup.
3. Place a one-use recovery value in a Cloudflare encrypted secret.
4. Use a separately reviewed recovery Function or owner maintenance command to generate a new salt/hash and revoke all sessions.
5. Remove the recovery secret immediately.
6. Record only `owner_pin_recovery` and the administrator ID in the audit log—never the replacement PIN or secret.

The recovery mutation is intentionally not exposed as a public endpoint in this draft. It requires separate owner approval and security review before launch.

## Audit events

The server records setup, successful and failed login, lockout, logout, PIN change, service/price changes, add-on changes, deposit changes, calendar changes, policy changes, promotion changes, booking approval/conflict/status changes, and gallery actions.

Audit sanitization rejects keys resembling PINs, passwords, tokens, secrets, cookies, private URLs, or object keys. Application errors log only the route and error class, not request bodies or credentials.

## Customer communications

No paid email or SMS provider is activated. Customers who select Text must explicitly consent to transactional messages. Eligible messages are written to a D1 outbox as `pending_provider`; they are not sent until an owner-approved provider is configured. Marketing messages are out of scope.

The planned event templates are:

- booking request received;
- booking approved;
- booking declined;
- time no longer available;
- rescheduling requested;
- appointment confirmed;
- appointment canceled;
- preparation instructions;
- appointment reminder; and
- remaining-balance reminder.

The application can display these states in the customer confirmation page and administrator dashboard now. Automated email requires a future approved transactional email provider and secrets such as `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, and an approved reply-to address. Automated text messages require a separately approved SMS provider, `SMS_PROVIDER_API_KEY`, `SMS_FROM_NUMBER`, registered sender/compliance setup, and explicit customer consent records. Provider activation, costs, and final message wording still require owner approval.

## Backup and recovery

Recommended owner-operated plan:

| Data | Frequency | Retention |
| --- | --- | --- |
| D1 data, settings, policies, audit logs | Daily export; export again before migrations | 30 daily and 12 monthly copies |
| Public gallery R2 inventory and objects | Weekly plus before bulk changes | 90 days plus 12 monthly copies |
| Private uploads | Daily inventory; encrypted object backup only if approved | Match the approved client-image retention period |
| Deployment configuration | On every reviewed Git commit | Repository history plus monthly encrypted configuration record |

Only the repository/Cloudflare owner or a specifically authorized delegate may restore data. Backups containing customer information or private images must be encrypted at rest, encrypted in transit, access-logged, and stored outside public GitHub and public R2.

Restore procedure:

1. Freeze administrator writes and save a fresh pre-restore export.
2. Restore into a separate preview D1 database and separate private R2 buckets.
3. Apply migrations and run integrity/count checks.
4. Test authentication, one pending booking, one confirmed appointment, price history, gallery access, and private-image denial.
5. Obtain owner approval before switching bindings.
6. Preserve the replaced database until the validation period ends.
7. Record the restore in the audit/incident record without customer image URLs or secrets.

Perform a preview test-restore quarterly and after material schema changes. A test restore is successful only when record counts, foreign keys, booking histories, immutable snapshots, and R2/D1 metadata agree.

## Retention and deletion

Public gallery deletion removes the R2 object and archives D1 metadata. Booking history is never deleted through application routes. Brookia approved a 90-day private-client-image retention period. Each upload receives a deletion date; authenticated dashboard loading and the explicit cleanup route delete expired R2 objects, mark D1 metadata deleted, and write a redacted audit event. A dedicated scheduled Worker can be added later if cleanup must run even when the dashboard is not opened.

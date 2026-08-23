# Cloudflare owner setup

Do not perform these steps until the draft pull request has been reviewed. Never paste secret values into GitHub, source files, screenshots, logs, or this chat.

## 1. Create the Pages project

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Create a Pages application and connect GitHub repository `dstirg/beauty-by-kia-draft`.
3. Set the production branch to the branch the owner will approve later. Do not change the current GitHub Pages production branch during draft review.
4. Use no build command and use `/` as the static output directory, because the approved application is a static HTML app with Pages Functions.
5. Allow preview deployments for pull-request branches.

The CLI alternative after `npx wrangler login` is:

```text
npx wrangler pages project create beauty-by-kia-draft
npx wrangler pages deploy . --project-name beauty-by-kia-draft --branch codex/cloudflare-production-integration
```

## 2. Create and seed D1

```text
npx wrangler d1 create beauty-by-kia-db
npx wrangler d1 execute beauty-by-kia-db --remote --file migrations/0001_cloudflare_foundation.sql
npx wrangler d1 execute beauty-by-kia-db --remote --command "INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0001_cloudflare_foundation.sql');"
npx wrangler d1 migrations apply beauty-by-kia-db --remote
npx wrangler d1 execute beauty-by-kia-db --remote --file seed/approved-foundation.sql
```

In the Pages project’s preview and production binding settings, add the D1 database with binding name `DB`. Use separate preview and production databases if the account permits it; never point an unreviewed pull-request preview at live customer data.

Verify counts:

```text
npx wrangler d1 execute beauty-by-kia-db --remote --command "SELECT COUNT(*) AS services FROM services; SELECT COUNT(*) AS add_ons FROM add_ons;"
```

Expected counts are 30 services and 10 add-ons. Re-running the approved seed must not create duplicates.

## 3. Create the R2 buckets

```text
npx wrangler r2 bucket create beauty-by-kia-public-gallery
npx wrangler r2 bucket create beauty-by-kia-private-uploads
```

Add these Pages bindings:

- `PUBLIC_GALLERY` → `beauty-by-kia-public-gallery`
- `PRIVATE_UPLOADS` → `beauty-by-kia-private-uploads`

Keep both buckets private. Do not enable a public development URL for the private-upload bucket. The service-gallery bucket is also served through the application route so publication state remains controlled by D1.

## 4. Create Turnstile

1. Open Cloudflare Turnstile and add a widget for the preview hostname.
2. Add the eventual production hostname later, after launch approval.
3. Save the site key as a normal Pages environment variable named `TURNSTILE_SITE_KEY`.
4. Save the secret key as an encrypted Pages secret named `TURNSTILE_SECRET_KEY`.

The login route fails closed if the secret is absent.

## 5. Configure variables and secrets

Required encrypted secrets:

- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PIN`
- `SESSION_SECRET`
- `TURNSTILE_SECRET_KEY`

Required non-secret environment variables:

- `TURNSTILE_SITE_KEY`
- `APP_ENVIRONMENT` with value `production`
- `LOCAL_STORAGE_FALLBACK` with value `false`
- `PAYMENTS_ENABLED` with value `false`
- `SESSION_TTL_SECONDS` with value `14400`

Bindings:

- D1: `DB`
- public gallery R2: `PUBLIC_GALLERY`
- private customer R2: `PRIVATE_UPLOADS`

The application uses same-origin `/api`; no production API base URL is required. If a separate API domain is introduced later, review cookie paths, origins, CORS, and CSRF before changing it.

Enter the initial administrator email and temporary PIN only through Cloudflare’s encrypted secret controls. The PIN must be entered as a string exactly as provided by the owner; never convert it to a number.

Generate `SESSION_SECRET` locally with a cryptographically secure password generator. Do not reuse a password or the administrator PIN.

## 6. Apply migration and complete one-time setup

After bindings and secrets exist, deploy a preview. Complete setup from an owner-controlled terminal over the HTTPS preview URL:

```text
curl --fail-with-body --request POST "https://PREVIEW_HOST/api/setup" --header "Content-Type: application/json" --data-binary @OWNER_CONTROLLED_SETUP_FILE
```

Create the temporary setup JSON file outside the repository, restrict access to the owner, and delete it immediately after use. It must contain the `email` and `pin` fields. Do not place its content in shell history.

Successful setup returns `setupComplete: true`. Confirm that D1 contains exactly one primary administrator and that `initial_admin_setup_complete` is `true`. Then remove `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PIN` from both preview and production secret settings and redeploy. The endpoint remains locked because D1 contains the primary account.

## 7. Interrupted setup recovery

An authorized owner should inspect D1 before retrying:

```text
npx wrangler d1 execute beauty-by-kia-production --remote --command "SELECT id, display_name, email, is_primary, created_at FROM admin_accounts; SELECT setting_key, setting_value FROM application_settings WHERE setting_key='initial_admin_setup_complete';"
```

- If no administrator exists and the setting is `false`, retry after correcting bindings or secrets.
- If one primary administrator exists, do not delete or rerun setup. Set the completion flag to `true` only after confirming the account belongs to Brookia.
- If the result is ambiguous, stop. Export D1, preserve audit history, and have the repository/Cloudflare owner review it. Do not create a second account.

## 8. Preview verification

Before production approval, test from Brookia’s phone and a separate customer device:

1. Confirm the draft banner is visible.
2. Confirm all 30 services and 10 add-ons.
3. Change one preview price on Brookia’s device and confirm it appears on the other device.
4. Restore the approved price.
5. Submit two requests for an overlapping time and confirm only one can be approved.
6. Cancel the confirmed preview appointment and confirm the slot is released.
7. Upload one public gallery image and one private customer image; verify they cannot cross surfaces.
8. Change the PIN and confirm another active session is revoked.
9. Confirm Stripe/card processing is absent, manual Cash App/Zelle instructions are editable only in the authenticated dashboard, and deposits remain awaiting verification until Kia marks them paid.

Do not promote the preview to production until the owner applies all migrations, Kia uploads and publishes her gallery, a real booking dry run passes, communication-provider decisions are complete, and the launch date is approved. The approved schedule and 90-day photo-retention period are now recorded.

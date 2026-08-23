import {
  clearSessionCookie,
  constantTimeEqual,
  genericLoginError,
  hashPin,
  isValidEmail,
  isValidPin,
  normalizeEmail,
  parseCookies,
  randomToken,
  sanitizeAuditDetails,
  sessionCookie,
  sha256,
  verifyPin,
  PBKDF2_ITERATIONS,
  SESSION_COOKIE
} from "../_lib/security.js";
import {
  appointmentWindow,
  BOOKING_STATUSES,
  localDateParts,
  PAYMENT_STATUSES,
  SLOT_BLOCKING_STATUSES
} from "../_lib/booking.js";
import { validateAndNormalizeImage } from "../_lib/images.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const CSRF_COOKIE = "bbk_csrf";
const AUTH_FAILURE_LIMIT = 5;
const AUTH_WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;
const PRIVATE_UPLOAD_RETENTION_DAYS = 90;
const PRIVATE_UPLOAD_TYPES = Object.freeze(["current_look", "inspiration"]);
const MANUAL_DEPOSIT_METHODS = Object.freeze(["cash_app", "zelle", "cash", "waived", "other"]);
const DUMMY_SALT = "bm90LWEtc2VjcmV0LXNhbHQ";

function response(payload, status = 200, extraHeaders = {}, cookies = []) {
  const headers = new Headers({ ...JSON_HEADERS, ...extraHeaders });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(payload), { status, headers });
}

function errorResponse(message, status = 400, code = "request_error") {
  return response({ ok: false, error: message, code }, status);
}

function csrfCookie(token, maxAgeSeconds = 14400) {
  // The dashboard is served from `/`, so its double-submit CSRF token must be
  // visible to that document. The server still requires the matching session
  // hash, a same-origin request, and the X-CSRF-Token header.
  return `${CSRF_COOKIE}=${encodeURIComponent(token)}; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

function clearCsrfCookie() {
  return `${CSRF_COOKIE}=; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function clearLegacyCsrfCookie() {
  return `${CSRF_COOKIE}=; Secure; SameSite=Strict; Path=/api; Max-Age=0`;
}

function uuid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback = null) {
  try {
    return value == null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function readJson(request) {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json")) {
    throw new RequestError("Expected a JSON request.", 415);
  }
  try {
    return await request.json();
  } catch {
    throw new RequestError("The request body is not valid JSON.");
  }
}

class RequestError extends Error {
  constructor(message, status = 400, code = "request_error") {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.code = code;
  }
}

function requireBindings(env, names) {
  const missing = names.filter(name => !env[name]);
  if (missing.length) throw new RequestError("Required Cloudflare resources are not configured.", 503, "bindings_missing");
}

async function clientFingerprint(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const pepper = env.SESSION_SECRET || "development-only-fingerprint";
  return sha256(`${pepper}:${ip}`);
}

async function emailFingerprint(email, env) {
  return sha256(`${env.SESSION_SECRET || "development-only-fingerprint"}:${normalizeEmail(email)}`);
}

async function verifyTurnstile(request, env, token, expectedAction) {
  if (env.APP_ENVIRONMENT === "development" && env.TURNSTILE_BYPASS_FOR_TESTS === "true" && token === "development-test-token") {
    return true;
  }
  if (!env.TURNSTILE_SECRET_KEY || typeof token !== "string" || !token || token.length > 2048) return false;
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.set("remoteip", remoteIp);
  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, signal: AbortSignal.timeout(10000) });
  if (!verification.ok) return false;
  const result = await verification.json();
  return result.success === true && result.action === expectedAction && result.hostname === new URL(request.url).hostname;
}

async function audit(env, request, action, adminId = null, entityType = null, entityId = null, details = {}) {
  const safeDetails = sanitizeAuditDetails(details);
  await env.DB.prepare(
    "INSERT INTO audit_logs (id, admin_account_id, action, entity_type, entity_id, details_json, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(uuid(), adminId, action, entityType, entityId, JSON.stringify(safeDetails), await clientFingerprint(request, env)).run();
}

function assertSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new RequestError("Request origin could not be verified.", 403, "origin_rejected");
  }
}

async function authenticate(request, env, requireCsrf = false) {
  requireBindings(env, ["DB"]);
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) throw new RequestError("Authentication required.", 401, "authentication_required");
  const tokenHash = await sha256(token);
  const session = await env.DB.prepare(
    `SELECT s.id AS session_id, s.admin_account_id, s.csrf_hash, s.expires_at,
            a.display_name, a.email, a.is_primary
       FROM admin_sessions s
       JOIN admin_accounts a ON a.id = s.admin_account_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND a.is_active = 1`
  ).bind(tokenHash, nowIso()).first();
  if (!session) throw new RequestError("Authentication required.", 401, "authentication_required");
  if (requireCsrf) {
    assertSameOrigin(request);
    const cookieToken = cookies[CSRF_COOKIE] || "";
    const headerToken = request.headers.get("X-CSRF-Token") || "";
    if (!cookieToken || !constantTimeEqual(cookieToken, headerToken) || !constantTimeEqual(await sha256(headerToken), session.csrf_hash)) {
      throw new RequestError("Request verification failed.", 403, "csrf_rejected");
    }
  }
  await env.DB.prepare("UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?").bind(nowIso(), session.session_id).run();
  return session;
}

async function handleSetup(request, env) {
  requireBindings(env, ["DB"]);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const pin = body.pin;
  if (!env.INITIAL_ADMIN_EMAIL || !env.INITIAL_ADMIN_PIN) {
    throw new RequestError("Initial administrator secrets are not configured.", 503, "setup_not_configured");
  }
  if (!isValidEmail(email) || !isValidPin(pin)) throw new RequestError("Setup information is not valid.");
  const expectedEmail = normalizeEmail(env.INITIAL_ADMIN_EMAIL);
  const validInput = constantTimeEqual(await sha256(email), await sha256(expectedEmail))
    && constantTimeEqual(await sha256(pin), await sha256(String(env.INITIAL_ADMIN_PIN)));
  if (!validInput) throw new RequestError("Setup information is not valid.", 403, "setup_rejected");
  const existing = await env.DB.prepare("SELECT id FROM admin_accounts LIMIT 1").first();
  const setting = await env.DB.prepare("SELECT setting_value FROM application_settings WHERE setting_key = 'initial_admin_setup_complete'").first();
  if (existing || setting?.setting_value === "true") throw new RequestError("Administrator setup is already complete.", 409, "setup_complete");
  let credential;
  try {
    credential = await hashPin(pin, null, PBKDF2_ITERATIONS, env.SESSION_SECRET);
  } catch (error) {
    console.error({ message: "Administrator credential hashing failed", errorName: error?.name || "Error" });
    throw new RequestError("Administrator setup is temporarily unavailable.", 503, "setup_hash_failed");
  }
  const adminId = uuid();
  try {
    const ipHash = await clientFingerprint(request, env);
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO admin_accounts (id, display_name, email, pin_salt, pin_hash, pin_iterations, is_primary) VALUES (?, 'Brookia', ?, ?, ?, ?, 1)"
      ).bind(adminId, email, credential.salt, credential.hash, credential.iterations),
      env.DB.prepare(
        `INSERT INTO application_settings (setting_key, setting_value, is_sensitive)
         VALUES ('initial_admin_setup_complete', 'true', 0)
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = 'true', updated_at = CURRENT_TIMESTAMP`
      ),
      env.DB.prepare(
        "INSERT INTO audit_logs (id, admin_account_id, action, entity_type, entity_id, details_json, ip_hash) VALUES (?, ?, 'admin_setup', 'admin_account', ?, ?, ?)"
      ).bind(uuid(), adminId, adminId, JSON.stringify({ primary: true }), ipHash)
    ]);
  } catch (error) {
    console.error({ message: "Atomic administrator setup write failed", errorName: error?.name || "Error" });
    throw new RequestError("Administrator setup is temporarily unavailable.", 503, "setup_write_failed");
  }
  return response({ ok: true, setupComplete: true }, 201);
}

async function recordLoginAttempt(env, request, email, successful, category) {
  await env.DB.prepare(
    "INSERT INTO login_attempts (id, email_hash, ip_hash, was_successful, failure_category) VALUES (?, ?, ?, ?, ?)"
  ).bind(uuid(), await emailFingerprint(email, env), await clientFingerprint(request, env), successful ? 1 : 0, category).run();
}

async function handleLogin(request, env) {
  requireBindings(env, ["DB"]);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const pin = body.pin;
  const turnstileOk = await verifyTurnstile(request, env, body.turnstileToken, "admin_login");
  const emailHash = await emailFingerprint(email, env);
  const ipHash = await clientFingerprint(request, env);
  const recent = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM login_attempts
      WHERE was_successful = 0 AND (email_hash = ? OR ip_hash = ?)
        AND created_at >= datetime('now', ?)`
  ).bind(emailHash, ipHash, `-${AUTH_WINDOW_MINUTES} minutes`).first();
  if (Number(recent?.count || 0) >= AUTH_FAILURE_LIMIT) {
    await recordLoginAttempt(env, request, email, false, "rate_limited");
    await audit(env, request, "account_lockout", null, "admin_account", null, { reason: "rate_limit" });
    return errorResponse(genericLoginError(), 429, "login_unavailable");
  }
  const account = isValidEmail(email)
    ? await env.DB.prepare("SELECT * FROM admin_accounts WHERE email = ? COLLATE NOCASE AND is_active = 1").bind(email).first()
    : null;
  const record = account || { pin_salt: DUMMY_SALT, pin_hash: (await hashPin("000000", DUMMY_SALT, PBKDF2_ITERATIONS, env.SESSION_SECRET)).hash, pin_iterations: PBKDF2_ITERATIONS };
  const pinOk = isValidPin(pin) ? await verifyPin(pin, record, env.SESSION_SECRET) : false;
  const isLocked = account?.locked_until && new Date(account.locked_until).getTime() > Date.now();
  if (!turnstileOk || !account || !pinOk || isLocked) {
    await recordLoginAttempt(env, request, email, false, !turnstileOk ? "turnstile" : isLocked ? "locked" : "credentials");
    if (account) {
      const failures = Number(account.failed_login_count || 0) + 1;
      const lockedUntil = failures >= AUTH_FAILURE_LIMIT ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString() : null;
      await env.DB.prepare("UPDATE admin_accounts SET failed_login_count = ?, locked_until = COALESCE(?, locked_until), updated_at = ? WHERE id = ?")
        .bind(failures, lockedUntil, nowIso(), account.id).run();
      if (lockedUntil) await audit(env, request, "account_lockout", account.id, "admin_account", account.id, { reason: "failed_attempts" });
    }
    await audit(env, request, "failed_login", account?.id || null, "admin_account", account?.id || null, { reason: "authentication_failed" });
    return errorResponse(genericLoginError(), 401, "login_failed");
  }
  const ttl = Math.min(Math.max(Number(env.SESSION_TTL_SECONDS || 14400), 900), 43200);
  const token = randomToken(32);
  const csrf = randomToken(24);
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO admin_sessions (id, admin_account_id, token_hash, csrf_hash, expires_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(sessionId, account.id, await sha256(token), await sha256(csrf), expiresAt),
    env.DB.prepare(
      "UPDATE admin_accounts SET failed_login_count = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?"
    ).bind(nowIso(), nowIso(), account.id)
  ]);
  await recordLoginAttempt(env, request, email, true, "");
  await audit(env, request, "successful_login", account.id, "admin_session", sessionId, {});
  return response(
    { ok: true, administrator: { displayName: account.display_name, email: account.email, primary: account.is_primary === 1 }, expiresAt },
    200,
    {},
    [sessionCookie(token, ttl), clearLegacyCsrfCookie(), csrfCookie(csrf, ttl)]
  );
}

async function handleSession(request, env) {
  try {
    const session = await authenticate(request, env, false);
    const csrf = parseCookies(request)[CSRF_COOKIE] || "";
    const remainingSeconds = Math.max(1, Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000));
    const cookies = csrf ? [clearLegacyCsrfCookie(), csrfCookie(csrf, remainingSeconds)] : [];
    return response({ ok: true, authenticated: true, administrator: { displayName: session.display_name, email: session.email, primary: session.is_primary === 1 }, expiresAt: session.expires_at }, 200, {}, cookies);
  } catch (error) {
    if (error instanceof RequestError && error.status === 401) return response({ ok: true, authenticated: false });
    throw error;
  }
}

async function handleLogout(request, env) {
  let session = null;
  try {
    session = await authenticate(request, env, true);
    await env.DB.prepare("UPDATE admin_sessions SET revoked_at = ? WHERE id = ?").bind(nowIso(), session.session_id).run();
    await audit(env, request, "logout", session.admin_account_id, "admin_session", session.session_id, {});
  } catch (error) {
    if (!(error instanceof RequestError && error.status === 401)) throw error;
  }
  return response({ ok: true }, 200, {}, [clearSessionCookie(), clearCsrfCookie(), clearLegacyCsrfCookie()]);
}

async function handlePinChange(request, env) {
  const session = await authenticate(request, env, true);
  const body = await readJson(request);
  const currentPin = body.currentPin;
  const newPin = body.newPin;
  if (!isValidPin(currentPin) || !isValidPin(newPin) || newPin !== body.confirmNewPin) {
    throw new RequestError("PIN change information is not valid.");
  }
  const account = await env.DB.prepare("SELECT * FROM admin_accounts WHERE id = ?").bind(session.admin_account_id).first();
  if (!await verifyPin(currentPin, account, env.SESSION_SECRET)) throw new RequestError("PIN change information is not valid.", 403, "pin_change_rejected");
  const credential = await hashPin(newPin, null, PBKDF2_ITERATIONS, env.SESSION_SECRET);
  await env.DB.batch([
    env.DB.prepare("UPDATE admin_accounts SET pin_salt = ?, pin_hash = ?, pin_iterations = ?, pin_changed_at = ?, updated_at = ? WHERE id = ?")
      .bind(credential.salt, credential.hash, credential.iterations, nowIso(), nowIso(), account.id),
    env.DB.prepare("UPDATE admin_sessions SET revoked_at = ? WHERE admin_account_id = ? AND id <> ? AND revoked_at IS NULL")
      .bind(nowIso(), account.id, session.session_id)
  ]);
  await audit(env, request, "pin_change", account.id, "admin_account", account.id, { otherSessionsRevoked: true });
  return response({ ok: true, message: "PIN changed successfully." });
}

async function catalogRows(env) {
  const [servicesResult, addOnsResult, linksResult, depositsResult, promotionsResult, promotionServicesResult, availabilityResult, buffersResult, policy, galleryResult, settingsResult] = await Promise.all([
    env.DB.prepare(`SELECT s.*, p.minimum_price_cents, p.maximum_price_cents, p.starting_price_cents, d.duration_minutes
      FROM services s JOIN service_prices p ON p.service_id = s.id AND p.effective_to IS NULL
      JOIN service_durations d ON d.service_id = s.id AND d.effective_to IS NULL
      WHERE s.archived_at IS NULL ORDER BY s.category, s.name`).all(),
    env.DB.prepare("SELECT * FROM add_ons WHERE archived_at IS NULL ORDER BY name").all(),
    env.DB.prepare("SELECT service_id, add_on_id FROM service_add_ons").all(),
    env.DB.prepare("SELECT * FROM deposit_rules WHERE is_active = 1 ORDER BY minimum_total_cents").all(),
    env.DB.prepare("SELECT * FROM promotions ORDER BY name").all(),
    env.DB.prepare("SELECT * FROM promotion_services").all(),
    env.DB.prepare("SELECT * FROM weekly_availability ORDER BY weekday").all(),
    env.DB.prepare("SELECT * FROM appointment_buffers WHERE id = 'default'").first(),
    env.DB.prepare("SELECT * FROM policy_versions WHERE is_current = 1").first(),
    env.DB.prepare("SELECT id, service_id, caption, alt_text, sort_order, is_featured FROM gallery_images WHERE is_published = 1 AND archived_at IS NULL ORDER BY service_id, sort_order").all(),
    env.DB.prepare("SELECT setting_key, setting_value FROM application_settings WHERE is_sensitive = 0").all()
  ]);
  return {
    services: servicesResult.results,
    addOns: addOnsResult.results,
    serviceAddOns: linksResult.results,
    depositRules: depositsResult.results,
    promotions: promotionsResult.results,
    promotionServices: promotionServicesResult.results,
    availability: availabilityResult.results,
    appointmentBuffer: buffersResult,
    policy: policy ? { ...policy, policy: parseJson(policy.policy_json, {}) } : null,
    gallery: galleryResult.results.map(image => ({ ...image, url: `/api/gallery/${image.id}/content` })),
    settings: Object.fromEntries(settingsResult.results.map(item => [item.setting_key, item.setting_value]))
  };
}

async function handleCatalog(env) {
  requireBindings(env, ["DB"]);
  return response({ ok: true, ...(await catalogRows(env)) }, 200, { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" });
}

function requiredString(value, label, maxLength = 500) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) throw new RequestError(`${label} is required.`);
  return value.trim();
}

async function handleCreateBooking(request, env) {
  requireBindings(env, ["DB"]);
  const body = await readJson(request);
  if (body.turnstileToken && !await verifyTurnstile(request, env, body.turnstileToken, "booking_request")) throw new RequestError("Request verification failed.", 403);
  const serviceId = requiredString(body.serviceId, "Service", 100);
  const service = await env.DB.prepare(`SELECT s.id, s.name, s.price_type, s.is_active, p.minimum_price_cents, p.maximum_price_cents,
      d.duration_minutes FROM services s JOIN service_prices p ON p.service_id = s.id AND p.effective_to IS NULL
      JOIN service_durations d ON d.service_id = s.id AND d.effective_to IS NULL
      WHERE s.id = ? AND s.archived_at IS NULL`).bind(serviceId).first();
  if (!service || service.is_active !== 1) throw new RequestError("The selected service is not available.");
  const addOnIds = Array.isArray(body.addOnIds) ? [...new Set(body.addOnIds.filter(value => typeof value === "string"))].slice(0, 20) : [];
  let addOns = [];
  if (addOnIds.length) {
    const placeholders = addOnIds.map(() => "?").join(",");
    const result = await env.DB.prepare(`SELECT a.* FROM add_ons a JOIN service_add_ons sa ON sa.add_on_id = a.id
      WHERE sa.service_id = ? AND a.id IN (${placeholders}) AND a.is_active = 1 AND a.archived_at IS NULL`)
      .bind(serviceId, ...addOnIds).all();
    addOns = result.results;
    if (addOns.length !== addOnIds.length) throw new RequestError("One or more add-ons are unavailable.");
  }
  const client = body.client || {};
  const clientName = requiredString(client.name, "Client name", 120);
  const clientEmail = normalizeEmail(client.email);
  if (!isValidEmail(clientEmail)) throw new RequestError("A valid client email is required.");
  const clientPhone = requiredString(client.phone, "Client phone", 40);
  const preferredContact = String(client.preferredContact || "email").trim().toLowerCase().slice(0, 20);
  const smsConsentAt = body.smsConsent === true ? nowIso() : null;
  if (preferredContact === "text" && !smsConsentAt) throw new RequestError("Text-message consent is required when text is selected.");
  const requestedStart = new Date(body.requestedStartAt);
  if (!Number.isFinite(requestedStart.getTime()) || requestedStart.getTime() <= Date.now()) throw new RequestError("A future appointment time is required.");
  if (body.acceptedPolicies !== true) throw new RequestError("The current policies must be accepted.");
  const policy = await env.DB.prepare("SELECT id, version_label FROM policy_versions WHERE is_current = 1").first();
  if (!policy) throw new RequestError("Booking policies are not configured.", 503);
  const servicePrice = Number(service.minimum_price_cents);
  const addOnsTotal = addOns.reduce((sum, addOn) => sum + Number(addOn.minimum_price_cents), 0);
  const estimatedTotal = servicePrice + addOnsTotal;
  const depositRule = service.price_type === "consultation" ? null : await env.DB.prepare(
    "SELECT * FROM deposit_rules WHERE is_active = 1 AND minimum_total_cents <= ? AND (maximum_total_cents IS NULL OR maximum_total_cents > ?) ORDER BY minimum_total_cents DESC LIMIT 1"
  ).bind(estimatedTotal, estimatedTotal).first();
  const deposit = depositRule ? Number(depositRule.deposit_cents) : 0;
  const bookingId = uuid();
  const reference = `BBK-${Date.now().toString(36).toUpperCase()}-${randomToken(3).toUpperCase()}`;
  const priceSnapshotId = uuid();
  const snapshots = {
    service: { id: service.id, name: service.name, priceType: service.price_type, minimumPriceCents: servicePrice, maximumPriceCents: service.maximum_price_cents, durationMinutes: service.duration_minutes },
    addOns: addOns.map(addOn => ({ id: addOn.id, name: addOn.name, priceType: addOn.price_type, minimumPriceCents: addOn.minimum_price_cents, maximumPriceCents: addOn.maximum_price_cents })),
    estimatedTotalCents: estimatedTotal,
    depositCents: deposit,
    remainingBalanceCents: Math.max(0, estimatedTotal - deposit)
  };
  const statements = [
    env.DB.prepare(`INSERT INTO bookings (id, reference, client_name, client_email, client_phone, preferred_contact, customer_notes,
      requested_start_at, estimated_total_cents, deposit_cents, remaining_balance_cents, sms_consent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(bookingId, reference, clientName, clientEmail, clientPhone, preferredContact, String(client.notes || "").slice(0, 4000), requestedStart.toISOString(), estimatedTotal, deposit, Math.max(0, estimatedTotal - deposit), smsConsentAt),
    env.DB.prepare(`INSERT INTO booking_services (booking_id, service_id, service_name_snapshot, price_type_snapshot,
      minimum_price_cents_snapshot, maximum_price_cents_snapshot, duration_minutes_snapshot) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(bookingId, service.id, service.name, service.price_type, servicePrice, service.maximum_price_cents, service.duration_minutes),
    env.DB.prepare(`INSERT INTO booking_price_snapshots (id, booking_id, service_price_cents, add_ons_total_cents,
      estimated_total_cents, deposit_cents, remaining_balance_cents, snapshot_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(priceSnapshotId, bookingId, servicePrice, addOnsTotal, estimatedTotal, deposit, Math.max(0, estimatedTotal - deposit), JSON.stringify(snapshots)),
    env.DB.prepare("INSERT INTO booking_status_history (id, booking_id, previous_status, new_status) VALUES (?, ?, NULL, 'pending_review')").bind(uuid(), bookingId),
    env.DB.prepare("INSERT INTO policy_acceptances (id, booking_id, policy_version_id, accepted_at, acceptance_ip_hash, user_agent_hash) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(uuid(), bookingId, policy.id, nowIso(), await clientFingerprint(request, env), await sha256(request.headers.get("User-Agent") || "unknown"))
  ];
  for (const addOn of addOns) {
    statements.push(env.DB.prepare(`INSERT INTO booking_add_ons (booking_id, add_on_id, add_on_name_snapshot, price_type_snapshot,
      minimum_price_cents_snapshot, maximum_price_cents_snapshot) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(bookingId, addOn.id, addOn.name, addOn.price_type, addOn.minimum_price_cents, addOn.maximum_price_cents));
  }
  if (smsConsentAt) {
    statements.push(env.DB.prepare(`INSERT INTO communication_outbox
      (id, booking_id, channel, message_type, recipient, body_text, status)
      VALUES (?, ?, 'sms', 'booking_request_received', ?, ?, 'pending_provider')`)
      .bind(uuid(), bookingId, clientPhone, `Beauty by Kia received request ${reference}. It is pending Kia's review and is not yet confirmed.`));
  }
  const uploadIds = Array.isArray(body.privateUploadIds) ? [...new Set(body.privateUploadIds.filter(value => typeof value === "string"))] : [];
  if (uploadIds.length > 2) throw new RequestError("A maximum of two appointment photos is allowed.");
  if (uploadIds.length) {
    const claimToken = requiredString(body.privateUploadClaimToken, "Upload authorization", 256);
    const claimHash = await sha256(claimToken);
    const placeholders = uploadIds.map(() => "?").join(",");
    const uploads = await env.DB.prepare(`SELECT id, upload_type FROM private_upload_metadata
      WHERE id IN (${placeholders}) AND claim_token_hash=? AND booking_id IS NULL AND deleted_at IS NULL`)
      .bind(...uploadIds, claimHash).all();
    if (uploads.results.length !== uploadIds.length) throw new RequestError("One or more appointment photos could not be authorized.", 403);
    const uploadTypes = uploads.results.map(item => item.upload_type);
    if (new Set(uploadTypes).size !== uploadTypes.length || uploadTypes.some(type => !PRIVATE_UPLOAD_TYPES.includes(type))) {
      throw new RequestError("Only one current-look photo and one inspiration photo are allowed.");
    }
  } else if (!body.turnstileToken) {
    throw new RequestError("Request verification failed.", 403);
  }
  for (const uploadId of uploadIds) {
    statements.push(env.DB.prepare("UPDATE private_upload_metadata SET booking_id = ?, claim_token_hash=NULL, updated_at = ? WHERE id = ? AND booking_id IS NULL AND deleted_at IS NULL")
      .bind(bookingId, nowIso(), uploadId));
  }
  await env.DB.batch(statements);
  return response({ ok: true, booking: { id: bookingId, reference, status: "pending_review" } }, 201);
}

async function loadAdminState(env) {
  const catalog = await catalogRows(env);
  const [bookings, blockedDates, calendarBlocks, auditLogs, galleryImages, privateUploads, adminSettings, communicationOutbox] = await Promise.all([
    env.DB.prepare(`SELECT b.*, bs.service_name_snapshot AS service_name, bs.duration_minutes_snapshot
      FROM bookings b LEFT JOIN booking_services bs ON bs.booking_id = b.id
      WHERE b.archived_at IS NULL ORDER BY b.created_at DESC LIMIT 500`).all(),
    env.DB.prepare("SELECT * FROM blocked_dates WHERE archived_at IS NULL ORDER BY blocked_date").all(),
    env.DB.prepare("SELECT * FROM calendar_blocks WHERE archived_at IS NULL ORDER BY starts_at").all(),
    env.DB.prepare("SELECT action, entity_type, entity_id, details_json, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200").all(),
    env.DB.prepare("SELECT id, service_id, caption, alt_text, sort_order, is_featured, is_published FROM gallery_images WHERE archived_at IS NULL ORDER BY service_id, sort_order").all(),
    env.DB.prepare("SELECT id, booking_id, upload_type FROM private_upload_metadata WHERE booking_id IS NOT NULL AND deleted_at IS NULL ORDER BY created_at").all(),
    env.DB.prepare(`SELECT setting_key, setting_value FROM application_settings
      WHERE setting_key IN ('cash_app_handle','zelle_contact')`).all(),
    env.DB.prepare(`SELECT id, booking_id, channel, message_type, status, scheduled_for, sent_at, created_at
      FROM communication_outbox ORDER BY created_at DESC LIMIT 200`).all()
  ]);
  return { ...catalog, settings: { ...catalog.settings, ...Object.fromEntries(adminSettings.results.map(item => [item.setting_key, item.setting_value])) }, bookings: bookings.results, blockedDates: blockedDates.results, calendarBlocks: calendarBlocks.results, gallery: galleryImages.results.map(image => ({ ...image, url: `/api/gallery/${image.id}/content` })), privateUploads: privateUploads.results.map(upload => ({ ...upload, url: `/api/admin/uploads/${upload.id}/content` })), communicationOutbox: communicationOutbox.results, auditLogs: auditLogs.results.map(row => ({ ...row, details: parseJson(row.details_json, {}) })) };
}

async function purgeExpiredPrivateUploads(request, env, adminId) {
  if (!env.PRIVATE_UPLOADS) return 0;
  const expired = await env.DB.prepare(`SELECT id, object_key FROM private_upload_metadata
    WHERE deleted_at IS NULL AND retention_delete_after IS NOT NULL AND retention_delete_after <= ?
    ORDER BY retention_delete_after LIMIT 50`).bind(nowIso()).all();
  let removed = 0;
  for (const upload of expired.results) {
    await env.PRIVATE_UPLOADS.delete(upload.object_key);
    const result = await env.DB.prepare("UPDATE private_upload_metadata SET deleted_at=?, updated_at=? WHERE id=? AND deleted_at IS NULL")
      .bind(nowIso(), nowIso(), upload.id).run();
    removed += Number(result.meta?.changes || 0);
  }
  if (removed) await audit(env, request, "private_upload_retention_cleanup", adminId, "private_upload_metadata", null, { removedCount: removed });
  return removed;
}

async function handleAdminState(request, env) {
  const session = await authenticate(request, env, request.method !== "GET");
  if (request.method === "GET") {
    await purgeExpiredPrivateUploads(request, env, session.admin_account_id);
    return response({ ok: true, ...(await loadAdminState(env)) });
  }
  const body = await readJson(request);
  const statements = [];
  if (Array.isArray(body.services)) {
    for (const item of body.services.slice(0, 200)) {
      if (!item?.id || !item?.name || !["fixed", "range", "starting", "consultation"].includes(item.priceType)) continue;
      const id = String(item.id).slice(0, 100);
      const slug = id.replace(/^svc-/u, "").replace(/[^a-z0-9-]/gu, "-");
      statements.push(env.DB.prepare(`INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, description=excluded.description,
        notice=excluded.notice, price_type=excluded.price_type, is_active=excluded.is_active, is_featured=excluded.is_featured,
        questionnaire_type=excluded.questionnaire_type, required_upload_types=excluded.required_upload_types, updated_at=CURRENT_TIMESTAMP`)
        .bind(id, slug, String(item.name).slice(0, 160), String(item.category || "Other").slice(0, 80), String(item.description || "").slice(0, 4000), String(item.notice || "").slice(0, 2000), item.priceType, item.active === false ? 0 : 1, item.featured ? 1 : 0, item.questionnaire || null, JSON.stringify(item.requiredUploads || [])));
      const currentPrice = await env.DB.prepare("SELECT * FROM service_prices WHERE service_id = ? AND effective_to IS NULL").bind(id).first();
      const minimum = Math.round(Number(item.minPrice || 0) * 100);
      const maximum = item.maxPrice == null ? null : Math.round(Number(item.maxPrice) * 100);
      if (!currentPrice) {
        statements.push(env.DB.prepare("INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents) VALUES (?, ?, ?, ?)")
          .bind(id, minimum, maximum, item.priceType === "starting" ? minimum : null));
      } else if (Number(currentPrice.minimum_price_cents) !== minimum || Number(currentPrice.maximum_price_cents ?? -1) !== Number(maximum ?? -1)) {
        const effective = nowIso();
        statements.push(env.DB.prepare("UPDATE service_prices SET effective_to = ?, updated_at = ? WHERE id = ?").bind(effective, effective, currentPrice.id));
        statements.push(env.DB.prepare("INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents, effective_from) VALUES (?, ?, ?, ?, ?)")
          .bind(id, minimum, maximum, item.priceType === "starting" ? minimum : null, effective));
      }
      const duration = Math.min(Math.max(Number(item.duration || 120), 15), 1440);
      const currentDuration = await env.DB.prepare("SELECT * FROM service_durations WHERE service_id = ? AND effective_to IS NULL").bind(id).first();
      if (!currentDuration) statements.push(env.DB.prepare("INSERT INTO service_durations (service_id, duration_minutes) VALUES (?, ?)").bind(id, duration));
      else if (Number(currentDuration.duration_minutes) !== duration) {
        const effective = nowIso();
        statements.push(env.DB.prepare("UPDATE service_durations SET effective_to = ?, updated_at = ? WHERE id = ?").bind(effective, effective, currentDuration.id));
        statements.push(env.DB.prepare("INSERT INTO service_durations (service_id, duration_minutes, effective_from) VALUES (?, ?, ?)").bind(id, duration, effective));
      }
      statements.push(env.DB.prepare("DELETE FROM service_add_ons WHERE service_id=?").bind(id));
      for (const addOnSlug of Array.isArray(item.applicableAddOnIds) ? item.applicableAddOnIds : []) {
        const addOnId = String(addOnSlug).startsWith("ao-") ? String(addOnSlug) : `ao-${addOnSlug}`;
        statements.push(env.DB.prepare("INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES (?, ?)").bind(id, addOnId));
      }
    }
  }
  if (Array.isArray(body.addOns)) {
    for (const item of body.addOns.slice(0, 100)) {
      if (!item?.id || !item?.name || !["fixed", "range", "starting", "consultation"].includes(item.priceType)) continue;
      const id = String(item.id).slice(0, 100);
      statements.push(env.DB.prepare(`INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, price_type=excluded.price_type,
        minimum_price_cents=excluded.minimum_price_cents, maximum_price_cents=excluded.maximum_price_cents,
        is_active=excluded.is_active, updated_at=CURRENT_TIMESTAMP`)
        .bind(id, id.replace(/^ao-/u, "").replace(/[^a-z0-9-]/gu, "-"), String(item.name).slice(0, 160), String(item.description || "").slice(0, 2000), item.priceType, Math.round(Number(item.minPrice || 0) * 100), item.maxPrice == null ? null : Math.round(Number(item.maxPrice) * 100), item.active === false ? 0 : 1));
    }
  }
  if (body.availability?.days) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const rule = body.availability.days[weekday];
      statements.push(env.DB.prepare(`INSERT INTO weekly_availability (weekday, is_working_day, opens_at, closes_at, requires_owner_review)
        VALUES (?, ?, ?, ?, 0) ON CONFLICT(weekday) DO UPDATE SET is_working_day=excluded.is_working_day,
        opens_at=excluded.opens_at, closes_at=excluded.closes_at, requires_owner_review=0, updated_at=CURRENT_TIMESTAMP`)
        .bind(weekday, rule ? 1 : 0, rule?.start || null, rule?.end || null));
    }
    statements.push(env.DB.prepare(`UPDATE appointment_buffers SET before_minutes = ?, after_minutes = ?, minimum_notice_hours = ?,
      maximum_booking_window_days = ?, maximum_appointments_per_day = ?, requires_owner_review = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 'default'`)
      .bind(Number(body.availability.beforeMinutes || 0), Number(body.availability.bufferMinutes || 0), Number(body.availability.minNoticeHours || 24), Number(body.availability.bookingWindowDays || 60), Number(body.availability.maximumAppointmentsPerDay || 6)));
  }
  if (Array.isArray(body.availability?.blockedDates)) {
    statements.push(env.DB.prepare("UPDATE blocked_dates SET archived_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE block_type='blocked' AND archived_at IS NULL"));
    for (const date of body.availability.blockedDates.slice(0, 730)) {
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(String(date))) continue;
      statements.push(env.DB.prepare(`INSERT INTO blocked_dates (id, blocked_date, block_type, created_by_admin_id) VALUES (?, ?, 'blocked', ?)
        ON CONFLICT(blocked_date, block_type) DO UPDATE SET archived_at=NULL, updated_at=CURRENT_TIMESTAMP, created_by_admin_id=excluded.created_by_admin_id`)
        .bind(uuid(), date, session.admin_account_id));
    }
  }
  if (Array.isArray(body.availability?.vacationDates)) {
    statements.push(env.DB.prepare("UPDATE blocked_dates SET archived_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE block_type='vacation' AND archived_at IS NULL"));
    for (const date of body.availability.vacationDates.slice(0, 730)) {
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(String(date))) continue;
      statements.push(env.DB.prepare(`INSERT INTO blocked_dates (id, blocked_date, block_type, created_by_admin_id) VALUES (?, ?, 'vacation', ?)
        ON CONFLICT(blocked_date, block_type) DO UPDATE SET archived_at=NULL, updated_at=CURRENT_TIMESTAMP, created_by_admin_id=excluded.created_by_admin_id`)
        .bind(uuid(), date, session.admin_account_id));
    }
  }
  if (Array.isArray(body.availability?.calendarBlocks)) {
    statements.push(env.DB.prepare("UPDATE calendar_blocks SET archived_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL"));
    for (const block of body.availability.calendarBlocks.slice(0, 500)) {
      if (!block?.startsAt || !block?.endsAt || new Date(block.endsAt) <= new Date(block.startsAt)) continue;
      statements.push(env.DB.prepare(`INSERT INTO calendar_blocks (id, starts_at, ends_at, reason, created_by_admin_id) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET starts_at=excluded.starts_at, ends_at=excluded.ends_at, reason=excluded.reason,
        archived_at=NULL, updated_at=CURRENT_TIMESTAMP, created_by_admin_id=excluded.created_by_admin_id`)
        .bind(block.id || uuid(), new Date(block.startsAt).toISOString(), new Date(block.endsAt).toISOString(), String(block.reason || "Personal unavailable time").slice(0, 500), session.admin_account_id));
    }
  }
  if (body.business) {
    const allowed = ["name", "tagline", "phone", "email", "city", "instagram", "address", "addressVisibility"];
    for (const key of allowed) {
      if (typeof body.business[key] === "string") {
        statements.push(env.DB.prepare(`INSERT INTO application_settings (setting_key, setting_value) VALUES (?, ?)
          ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=CURRENT_TIMESTAMP`)
          .bind(`business_${key}`, body.business[key].slice(0, 4000)));
      }
    }
  }
  if (body.operations) {
    const operationSettings = {
      cash_app_handle: { value: body.operations.cashAppHandle, sensitive: 1 },
      zelle_contact: { value: body.operations.zelleContact, sensitive: 1 },
      deposit_instructions: { value: body.operations.depositInstructions, sensitive: 0 },
      sunday_surcharge_cents: { value: Math.max(0, Math.round(Number(body.operations.sundaySurcharge || 50) * 100)).toString(), sensitive: 0 },
      private_upload_retention_days: { value: Math.min(365, Math.max(1, Math.round(Number(body.operations.photoRetentionDays || 90)))).toString(), sensitive: 0 }
    };
    for (const [key, item] of Object.entries(operationSettings)) {
      if (item.value == null) continue;
      statements.push(env.DB.prepare(`INSERT INTO application_settings (setting_key, setting_value, is_sensitive) VALUES (?, ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, is_sensitive=excluded.is_sensitive, updated_at=CURRENT_TIMESTAMP`)
        .bind(key, String(item.value).trim().slice(0, 4000), item.sensitive));
    }
  }
  if (body.promotion) {
    statements.push(env.DB.prepare(`UPDATE promotions SET banner_text=?, starts_at=?, ends_at=?, is_active=?, show_badges=?, updated_at=CURRENT_TIMESTAMP
      WHERE id='grand-opening-special'`)
      .bind(String(body.promotion.banner || "").slice(0, 2000), body.promotion.startDate ? `${body.promotion.startDate}T00:00:00.000Z` : null, body.promotion.endDate ? `${body.promotion.endDate}T23:59:59.999Z` : null, body.promotion.enabled ? 1 : 0, body.promotion.showBadges === false ? 0 : 1));
  }
  if (body.depositTiers) {
    statements.push(
      env.DB.prepare("UPDATE deposit_rules SET deposit_cents=?, updated_at=CURRENT_TIMESTAMP WHERE id='deposit-under-100'").bind(Math.round(Number(body.depositTiers.under100 || 0) * 100)),
      env.DB.prepare("UPDATE deposit_rules SET deposit_cents=?, updated_at=CURRENT_TIMESTAMP WHERE id='deposit-under-180'").bind(Math.round(Number(body.depositTiers.under180 || 0) * 100)),
      env.DB.prepare("UPDATE deposit_rules SET deposit_cents=?, updated_at=CURRENT_TIMESTAMP WHERE id='deposit-180-plus'").bind(Math.round(Number(body.depositTiers.atLeast180 || 0) * 100))
    );
  }
  if (body.policies) {
    const policyJson = JSON.stringify(Object.fromEntries(Object.entries(body.policies).filter(([key, value]) => key !== "version" && typeof value === "string")));
    const version = `BBK-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`;
    statements.push(
      env.DB.prepare("UPDATE policy_versions SET is_current=0, archived_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE is_current=1"),
      env.DB.prepare("INSERT INTO policy_versions (id, version_label, policy_json, is_current, published_at, created_by_admin_id) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?)")
        .bind(uuid(), version, policyJson, session.admin_account_id)
    );
  }
  if (statements.length) await env.DB.batch(statements);
  for (const [present, action] of [[body.services, "price_change"], [body.addOns, "add_on_change"], [body.depositTiers, "deposit_rule_change"], [body.availability, "calendar_change"], [body.policies, "policy_change"], [body.promotion, "promotion_change"], [body.operations, "operations_setting_change"]]) {
    if (present) await audit(env, request, action, session.admin_account_id, "application", "beauty-by-kia", {});
  }
  return response({ ok: true, ...(await loadAdminState(env)) });
}

async function failApproval(env, request, session, booking, reason) {
  const previous = booking.status;
  await env.DB.batch([
    env.DB.prepare("UPDATE bookings SET status='time_unavailable', updated_at=? WHERE id=? AND status NOT IN ('confirmed','completed')").bind(nowIso(), booking.id),
    env.DB.prepare("INSERT INTO booking_status_history (id, booking_id, previous_status, new_status, private_admin_note, changed_by_admin_id) VALUES (?, ?, ?, 'time_unavailable', ?, ?)")
      .bind(uuid(), booking.id, previous, reason.slice(0, 1000), session.admin_account_id)
  ]);
  await audit(env, request, "booking_approval_conflict", session.admin_account_id, "booking", booking.id, { reason });
  return errorResponse("That appointment time is no longer available. The request was preserved for rescheduling.", 409, "time_unavailable");
}

async function handleApproveBooking(request, env, bookingId) {
  const session = await authenticate(request, env, true);
  const body = await readJson(request);
  const booking = await env.DB.prepare(`SELECT b.*, bs.duration_minutes_snapshot, bs.service_id FROM bookings b
    JOIN booking_services bs ON bs.booking_id=b.id WHERE b.id=?`).bind(bookingId).first();
  if (!booking) throw new RequestError("Booking not found.", 404);
  if (!new Set(["pending_review", "reschedule_requested", "time_unavailable"]).has(booking.status)) throw new RequestError("This booking cannot be approved from its current status.", 409);
  const startAt = body.appointmentStartAt || booking.proposed_start_at || booking.requested_start_at;
  const buffers = await env.DB.prepare("SELECT * FROM appointment_buffers WHERE id='default'").first();
  const window = appointmentWindow(startAt, booking.duration_minutes_snapshot, buffers.before_minutes, buffers.after_minutes);
  const timezoneSetting = await env.DB.prepare("SELECT setting_value FROM application_settings WHERE setting_key='timezone'").first();
  const local = localDateParts(window.appointmentStartAt, timezoneSetting?.setting_value || "America/Chicago");
  const localEnd = localDateParts(window.appointmentEndAt, timezoneSetting?.setting_value || "America/Chicago");
  if (local.date !== localEnd.date) return failApproval(env, request, session, booking, "appointment crosses local date boundary");
  const noticeBoundary = Date.now() + Number(buffers.minimum_notice_hours) * 3600000;
  const windowBoundary = Date.now() + Number(buffers.maximum_booking_window_days) * 86400000;
  const startTime = new Date(window.appointmentStartAt).getTime();
  if (startTime < noticeBoundary || startTime > windowBoundary) return failApproval(env, request, session, booking, "outside booking notice or window");
  const hours = await env.DB.prepare("SELECT * FROM weekly_availability WHERE weekday=?").bind(local.weekday).first();
  if (!hours || hours.is_working_day !== 1 || local.time < hours.opens_at || localEnd.time > hours.closes_at) return failApproval(env, request, session, booking, "outside working hours");
  const blocked = await env.DB.prepare("SELECT id FROM blocked_dates WHERE blocked_date=? AND archived_at IS NULL LIMIT 1").bind(local.date).first();
  if (blocked) return failApproval(env, request, session, booking, "blocked or vacation date");
  const personalBlock = await env.DB.prepare("SELECT id FROM calendar_blocks WHERE archived_at IS NULL AND starts_at < ? AND ends_at > ? LIMIT 1")
    .bind(window.bufferedEndAt, window.bufferedStartAt).first();
  if (personalBlock) return failApproval(env, request, session, booking, "personal calendar block");
  const service = await env.DB.prepare("SELECT is_active, archived_at FROM services WHERE id=?").bind(booking.service_id).first();
  if (!service || service.is_active !== 1 || service.archived_at) return failApproval(env, request, session, booking, "service unavailable");
  const dayStart = `${local.date}T00:00:00.000Z`;
  const dayEnd = `${local.date}T23:59:59.999Z`;
  const finalTotal = body.approvedFinalTotalCents == null ? booking.estimated_total_cents : Math.max(0, Math.round(Number(body.approvedFinalTotalCents)));
  const depositRequired = Math.max(0, Number(booking.deposit_cents || 0));
  const nextStatus = depositRequired > 0 ? "awaiting_deposit" : "confirmed";
  const nextPaymentStatus = depositRequired > 0 ? "deposit_requested" : "deposit_not_requested";
  const settingsResult = await env.DB.prepare(`SELECT setting_key, setting_value FROM application_settings
    WHERE setting_key IN ('manual_deposits_enabled','cash_app_handle','zelle_contact','deposit_instructions')`).all();
  const paymentSettings = Object.fromEntries(settingsResult.results.map(item => [item.setting_key, item.setting_value]));
  if (depositRequired > 0 && paymentSettings.manual_deposits_enabled !== "true") {
    throw new RequestError("Manual deposit requests are not enabled.", 409, "deposit_unavailable");
  }
  const paymentOptions = [
    paymentSettings.cash_app_handle ? `Cash App ${paymentSettings.cash_app_handle}` : null,
    paymentSettings.zelle_contact ? `Zelle ${paymentSettings.zelle_contact}` : null
  ].filter(Boolean);
  const defaultCustomerMessage = depositRequired > 0
    ? `Beauty by Kia approved request ${booking.reference}. A $${(depositRequired / 100).toFixed(2)} deposit is required. ${paymentOptions.length ? `Pay using ${paymentOptions.join(" or ")}.` : "Kia will send Cash App or Zelle details directly."} Kia will verify the deposit before confirmation.`
    : `Beauty by Kia approved request ${booking.reference}. Your appointment is confirmed.`;
  const customerMessage = String(body.customerMessage || defaultCustomerMessage).slice(0, 4000);
  const updatedAt = nowIso();
  const update = await env.DB.prepare(`UPDATE bookings SET status=?, payment_status=?,
      appointment_start_at=?, appointment_end_at=?, buffered_start_at=?, buffered_end_at=?, approved_final_total_cents=?,
      remaining_balance_cents=?, approved_at=?, deposit_requested_at=?, private_admin_note=?, customer_message=?, updated_at=?
    WHERE id=? AND status IN ('pending_review','reschedule_requested','time_unavailable')
      AND NOT EXISTS (SELECT 1 FROM bookings existing WHERE existing.id<>? AND existing.status IN ('awaiting_deposit','confirmed')
        AND existing.archived_at IS NULL AND existing.buffered_start_at < ? AND existing.buffered_end_at > ?)
      AND (SELECT COUNT(*) FROM bookings day_booking WHERE day_booking.id<>? AND day_booking.status IN ('awaiting_deposit','confirmed')
        AND day_booking.appointment_start_at >= ? AND day_booking.appointment_start_at <= ?) < ?`)
    .bind(nextStatus, nextPaymentStatus, window.appointmentStartAt, window.appointmentEndAt, window.bufferedStartAt, window.bufferedEndAt, finalTotal,
      Math.max(0, finalTotal - depositRequired), updatedAt, depositRequired > 0 ? updatedAt : null, String(body.privateNote || "").slice(0, 4000), customerMessage, updatedAt, booking.id,
      booking.id, window.bufferedEndAt, window.bufferedStartAt, booking.id, dayStart, dayEnd, buffers.maximum_appointments_per_day).run();
  if (!update.meta?.changes) return failApproval(env, request, session, booking, "concurrent conflict or daily limit");
  const followUp = [
    env.DB.prepare("INSERT INTO booking_status_history (id, booking_id, previous_status, new_status, customer_reason, private_admin_note, changed_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(uuid(), booking.id, booking.status, nextStatus, customerMessage.slice(0, 1000), String(body.privateNote || "").slice(0, 1000), session.admin_account_id)
  ];
  if (depositRequired > 0) {
    followUp.push(env.DB.prepare(`INSERT INTO payment_status_history
      (id, booking_id, previous_status, new_status, payment_method, amount_cents, changed_by_admin_id)
      VALUES (?, ?, ?, 'deposit_requested', NULL, ?, ?)`)
      .bind(uuid(), booking.id, booking.payment_status || "deposit_not_requested", depositRequired, session.admin_account_id));
  }
  if (booking.sms_consent_at && booking.client_phone) {
    followUp.push(env.DB.prepare(`INSERT INTO communication_outbox
      (id, booking_id, channel, message_type, recipient, body_text, status)
      VALUES (?, ?, 'sms', ?, ?, ?, 'pending_provider')`)
      .bind(uuid(), booking.id, depositRequired > 0 ? "deposit_requested" : "appointment_confirmed", booking.client_phone, customerMessage.slice(0, 1000)));
  }
  await env.DB.batch(followUp);
  await audit(env, request, "booking_approval", session.admin_account_id, "booking", booking.id, { previousStatus: booking.status, newStatus: nextStatus, paymentStatus: nextPaymentStatus });
  return response({ ok: true, booking: { id: booking.id, status: nextStatus, paymentStatus: nextPaymentStatus, ...window, approvedFinalTotalCents: finalTotal } });
}

async function handleBookingDeposit(request, env, bookingId) {
  const session = await authenticate(request, env, true);
  const body = await readJson(request);
  const paymentStatus = String(body.paymentStatus || "");
  if (!["deposit_requested", "deposit_pending", "deposit_paid", "deposit_failed", "deposit_refunded"].includes(paymentStatus)) {
    throw new RequestError("Select a valid deposit status.");
  }
  const method = body.method == null ? null : String(body.method);
  if (method && !MANUAL_DEPOSIT_METHODS.includes(method)) throw new RequestError("Select a valid deposit method.");
  const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id=?").bind(bookingId).first();
  if (!booking) throw new RequestError("Booking not found.", 404);
  if (paymentStatus === "deposit_paid" && !method) throw new RequestError("Select how the deposit was received.");
  const nextBookingStatus = paymentStatus === "deposit_paid" && booking.status === "awaiting_deposit" ? "confirmed" : booking.status;
  const changedAt = nowIso();
  const statements = [
    env.DB.prepare(`UPDATE bookings SET payment_status=?, deposit_method=COALESCE(?, deposit_method),
      deposit_received_at=CASE WHEN ?='deposit_paid' THEN ? ELSE deposit_received_at END,
      status=?, updated_at=? WHERE id=?`)
      .bind(paymentStatus, method, paymentStatus, changedAt, nextBookingStatus, changedAt, booking.id),
    env.DB.prepare(`INSERT INTO payment_status_history
      (id, booking_id, previous_status, new_status, payment_method, amount_cents, changed_by_admin_id, private_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(uuid(), booking.id, booking.payment_status, paymentStatus, method, Number(booking.deposit_cents || 0), session.admin_account_id, String(body.privateNote || "").slice(0, 1000))
  ];
  if (nextBookingStatus !== booking.status) {
    statements.push(env.DB.prepare(`INSERT INTO booking_status_history
      (id, booking_id, previous_status, new_status, customer_reason, private_admin_note, changed_by_admin_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(uuid(), booking.id, booking.status, nextBookingStatus, "Deposit received and verified by Kia.", String(body.privateNote || "").slice(0, 1000), session.admin_account_id));
  }
  if (paymentStatus === "deposit_paid" && booking.sms_consent_at && booking.client_phone) {
    statements.push(env.DB.prepare(`INSERT INTO communication_outbox
      (id, booking_id, channel, message_type, recipient, body_text, status)
      VALUES (?, ?, 'sms', 'deposit_received', ?, ?, 'pending_provider')`)
      .bind(uuid(), booking.id, booking.client_phone, `Beauty by Kia verified the deposit for request ${booking.reference}. Your appointment is confirmed.`));
  }
  await env.DB.batch(statements);
  await audit(env, request, "deposit_status_change", session.admin_account_id, "booking", booking.id, { previousStatus: booking.payment_status, newStatus: paymentStatus, method, bookingStatus: nextBookingStatus });
  return response({ ok: true, booking: { id: booking.id, status: nextBookingStatus, paymentStatus } });
}

async function handleBookingStatus(request, env, bookingId) {
  const session = await authenticate(request, env, true);
  const body = await readJson(request);
  const status = body.status;
  if (!BOOKING_STATUSES.includes(status) || ["confirmed", "awaiting_deposit"].includes(status)) throw new RequestError("That status change requires the approval workflow.");
  const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id=?").bind(bookingId).first();
  if (!booking) throw new RequestError("Booking not found.", 404);
  const cancelledAt = status.startsWith("cancelled_") ? nowIso() : null;
  const declinedAt = status === "declined" ? nowIso() : null;
  const completedAt = status === "completed" ? nowIso() : null;
  await env.DB.batch([
    env.DB.prepare(`UPDATE bookings SET status=?, cancelled_at=COALESCE(?, cancelled_at), declined_at=COALESCE(?, declined_at),
      completed_at=COALESCE(?, completed_at), proposed_start_at=?, customer_message=?, private_admin_note=?, updated_at=? WHERE id=?`)
      .bind(status, cancelledAt, declinedAt, completedAt, body.proposedStartAt || null, String(body.customerMessage || "").slice(0, 4000), String(body.privateNote || "").slice(0, 4000), nowIso(), booking.id),
    env.DB.prepare("INSERT INTO booking_status_history (id, booking_id, previous_status, new_status, customer_reason, private_admin_note, changed_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(uuid(), booking.id, booking.status, status, String(body.customerMessage || "").slice(0, 1000), String(body.privateNote || "").slice(0, 1000), session.admin_account_id)
  ]);
  const action = status === "declined" ? "booking_decline" : status.includes("cancelled") ? "booking_cancellation" : status === "reschedule_requested" ? "booking_reschedule" : "booking_status_change";
  await audit(env, request, action, session.admin_account_id, "booking", booking.id, { previousStatus: booking.status, newStatus: status });
  return response({ ok: true, booking: { id: booking.id, status } });
}

async function imageFromRequest(request) {
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) throw new RequestError("An image file is required.");
  const image = validateAndNormalizeImage(await file.arrayBuffer());
  return { form, file, image, contentHash: await sha256(image.normalized) };
}

async function handleGalleryUpload(request, env) {
  requireBindings(env, ["PUBLIC_GALLERY"]);
  const session = await authenticate(request, env, true);
  const { form, image, contentHash } = await imageFromRequest(request);
  const serviceId = requiredString(form.get("serviceId"), "Service", 100);
  const altText = requiredString(form.get("altText"), "Accessibility text", 300);
  const service = await env.DB.prepare("SELECT id FROM services WHERE id=? AND archived_at IS NULL").bind(serviceId).first();
  if (!service) throw new RequestError("Service not found.", 404);
  const duplicate = await env.DB.prepare("SELECT id FROM gallery_images WHERE content_sha256=? AND archived_at IS NULL").bind(contentHash).first();
  if (duplicate) throw new RequestError("That image has already been uploaded.", 409, "duplicate_image");
  const id = uuid();
  const objectKey = `public-gallery/${serviceId}/${id}.${image.extension}`;
  await env.PUBLIC_GALLERY.put(objectKey, image.normalized, { httpMetadata: { contentType: image.mimeType, cacheControl: "public, max-age=31536000, immutable" }, customMetadata: { imageId: id } });
  try {
    if (form.get("featured") === "true") await env.DB.prepare("UPDATE gallery_images SET is_featured=0, updated_at=? WHERE service_id=? AND archived_at IS NULL").bind(nowIso(), serviceId).run();
    await env.DB.prepare(`INSERT INTO gallery_images (id, service_id, object_key, content_sha256, mime_type, byte_size, width, height,
      caption, alt_text, sort_order, is_featured, is_published, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, serviceId, objectKey, contentHash, image.mimeType, image.normalized.byteLength, image.width, image.height, String(form.get("caption") || "").slice(0, 500), altText, Number(form.get("sortOrder") || 0), form.get("featured") === "true" ? 1 : 0, form.get("published") === "true" ? 1 : 0, session.admin_account_id).run();
  } catch (error) {
    await env.PUBLIC_GALLERY.delete(objectKey);
    throw error;
  }
  await audit(env, request, "gallery_upload", session.admin_account_id, "gallery_image", id, { serviceId, mimeType: image.mimeType, byteSize: image.normalized.byteLength });
  return response({ ok: true, image: { id, serviceId, url: `/api/gallery/${id}/content` } }, 201);
}

async function handleGalleryContent(env, imageId) {
  requireBindings(env, ["DB", "PUBLIC_GALLERY"]);
  const metadata = await env.DB.prepare("SELECT object_key, mime_type FROM gallery_images WHERE id=? AND is_published=1 AND archived_at IS NULL").bind(imageId).first();
  if (!metadata) return new Response("Not found", { status: 404 });
  const object = await env.PUBLIC_GALLERY.get(metadata.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers({ "Content-Type": metadata.mime_type, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" });
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}

async function handleAdminGalleryContent(request, env, imageId) {
  requireBindings(env, ["DB", "PUBLIC_GALLERY"]);
  await authenticate(request, env, false);
  const metadata = await env.DB.prepare("SELECT object_key, mime_type FROM gallery_images WHERE id=? AND archived_at IS NULL").bind(imageId).first();
  if (!metadata) return new Response("Not found", { status: 404 });
  const object = await env.PUBLIC_GALLERY.get(metadata.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": metadata.mime_type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

async function handleGalleryUpdate(request, env, imageId) {
  const session = await authenticate(request, env, true);
  const body = await readJson(request);
  const existing = await env.DB.prepare("SELECT * FROM gallery_images WHERE id=? AND archived_at IS NULL").bind(imageId).first();
  if (!existing) throw new RequestError("Image not found.", 404);
  if (body.featured === true) await env.DB.prepare("UPDATE gallery_images SET is_featured=0, updated_at=? WHERE service_id=? AND id<>? AND archived_at IS NULL").bind(nowIso(), existing.service_id, imageId).run();
  await env.DB.prepare(`UPDATE gallery_images SET caption=?, alt_text=?, sort_order=?, is_featured=?, is_published=?, updated_at=? WHERE id=?`)
    .bind(String(body.caption ?? existing.caption).slice(0, 500), requiredString(body.altText ?? existing.alt_text, "Accessibility text", 300), Number(body.sortOrder ?? existing.sort_order), body.featured == null ? existing.is_featured : body.featured ? 1 : 0, body.published == null ? existing.is_published : body.published ? 1 : 0, nowIso(), imageId).run();
  await audit(env, request, "gallery_update", session.admin_account_id, "gallery_image", imageId, { serviceId: existing.service_id });
  return response({ ok: true });
}

async function handleGalleryDelete(request, env, imageId) {
  requireBindings(env, ["PUBLIC_GALLERY"]);
  const session = await authenticate(request, env, true);
  const existing = await env.DB.prepare("SELECT * FROM gallery_images WHERE id=? AND archived_at IS NULL").bind(imageId).first();
  if (!existing) throw new RequestError("Image not found.", 404);
  await env.PUBLIC_GALLERY.delete(existing.object_key);
  await env.DB.prepare("UPDATE gallery_images SET archived_at=?, is_published=0, is_featured=0, updated_at=? WHERE id=?").bind(nowIso(), nowIso(), imageId).run();
  await audit(env, request, "gallery_deletion", session.admin_account_id, "gallery_image", imageId, { serviceId: existing.service_id });
  return response({ ok: true });
}

async function handlePrivateUpload(request, env) {
  requireBindings(env, ["DB", "PRIVATE_UPLOADS"]);
  const form = await request.formData();
  if (!await verifyTurnstile(request, env, String(form.get("turnstileToken") || ""), "booking_request")) throw new RequestError("Request verification failed.", 403);
  const requested = [
    { field: "currentLook", uploadType: "current_look" },
    { field: "inspiration", uploadType: "inspiration" }
  ];
  const uploads = [];
  for (const item of requested) {
    const values = form.getAll(item.field);
    if (values.length > 1) throw new RequestError(`Only one ${item.uploadType === "current_look" ? "current-look" : "inspiration"} photo is allowed.`);
    if (!values.length) continue;
    const file = values[0];
    if (!(file instanceof File)) throw new RequestError("A valid image file is required.");
    const image = validateAndNormalizeImage(await file.arrayBuffer());
    uploads.push({ ...item, image, contentHash: await sha256(image.normalized) });
  }
  if (!uploads.length || uploads.length > 2) throw new RequestError("Add one current-look photo, one inspiration photo, or both.");
  if (new Set(uploads.map(item => item.contentHash)).size !== uploads.length) throw new RequestError("Please use a different image for each photo type.");

  const retentionSetting = await env.DB.prepare("SELECT setting_value FROM application_settings WHERE setting_key='private_upload_retention_days'").first();
  const retentionDays = Math.min(365, Math.max(1, Number(retentionSetting?.setting_value || PRIVATE_UPLOAD_RETENTION_DAYS)));
  const claimToken = randomToken(32);
  const claimHash = await sha256(claimToken);
  const deleteAfter = new Date(Date.now() + retentionDays * 86400000).toISOString();
  const created = [];
  try {
    for (const upload of uploads) {
      const id = uuid();
      const objectKey = `private-client-uploads/${new Date().toISOString().slice(0, 10)}/${id}.${upload.image.extension}`;
      created.push({ id, objectKey, uploadType: upload.uploadType });
      await env.PRIVATE_UPLOADS.put(objectKey, upload.image.normalized, { httpMetadata: { contentType: upload.image.mimeType, cacheControl: "private, no-store" }, customMetadata: { uploadId: id, uploadType: upload.uploadType } });
      await env.DB.prepare(`INSERT INTO private_upload_metadata (id, object_key, upload_type, claim_token_hash, content_sha256, mime_type, byte_size, width, height, retention_delete_after)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, objectKey, upload.uploadType, claimHash, upload.contentHash, upload.image.mimeType, upload.image.normalized.byteLength, upload.image.width, upload.image.height, deleteAfter).run();
    }
  } catch (error) {
    for (const item of created) {
      await env.PRIVATE_UPLOADS.delete(item.objectKey);
      await env.DB.prepare("DELETE FROM private_upload_metadata WHERE id=? AND booking_id IS NULL").bind(item.id).run();
    }
    throw error;
  }
  return response({ ok: true, uploads: created.map(({ id, uploadType }) => ({ id, uploadType })), claimToken }, 201);
}

async function handlePrivateContent(request, env, uploadId) {
  requireBindings(env, ["PRIVATE_UPLOADS"]);
  await authenticate(request, env, false);
  const metadata = await env.DB.prepare("SELECT object_key, mime_type FROM private_upload_metadata WHERE id=? AND deleted_at IS NULL").bind(uploadId).first();
  if (!metadata) return new Response("Not found", { status: 404 });
  const object = await env.PRIVATE_UPLOADS.get(metadata.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": metadata.mime_type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

async function routeRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/u, "");
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "GET, POST, PUT, DELETE, OPTIONS" } });
  if (method === "GET" && path === "config") return response({ ok: true, environment: env.APP_ENVIRONMENT || "production", localStorageFallback: env.LOCAL_STORAGE_FALLBACK === "true" && env.APP_ENVIRONMENT === "development", paymentsEnabled: false, turnstileSiteKey: env.TURNSTILE_SITE_KEY || "" });
  if (method === "POST" && path === "setup") return handleSetup(request, env);
  if (method === "POST" && path === "auth/login") return handleLogin(request, env);
  if (method === "GET" && path === "auth/session") return handleSession(request, env);
  if (method === "POST" && path === "auth/logout") return handleLogout(request, env);
  if (method === "POST" && path === "admin/security/pin") return handlePinChange(request, env);
  if (method === "GET" && path === "catalog") return handleCatalog(env);
  if (method === "POST" && path === "bookings") return handleCreateBooking(request, env);
  if (["GET", "PUT"].includes(method) && path === "admin/state") return handleAdminState(request, env);
  if (method === "POST" && path === "admin/uploads/purge-expired") {
    const session = await authenticate(request, env, true);
    const removed = await purgeExpiredPrivateUploads(request, env, session.admin_account_id);
    return response({ ok: true, removed });
  }
  let match = path.match(/^admin\/bookings\/([^/]+)\/approve$/u);
  if (method === "POST" && match) return handleApproveBooking(request, env, match[1]);
  match = path.match(/^admin\/bookings\/([^/]+)\/deposit$/u);
  if (method === "POST" && match) return handleBookingDeposit(request, env, match[1]);
  match = path.match(/^admin\/bookings\/([^/]+)\/status$/u);
  if (method === "POST" && match) return handleBookingStatus(request, env, match[1]);
  if (method === "POST" && path === "admin/gallery") return handleGalleryUpload(request, env);
  match = path.match(/^gallery\/([^/]+)\/content$/u);
  if (method === "GET" && match) return handleGalleryContent(env, match[1]);
  match = path.match(/^admin\/gallery\/([^/]+)\/content$/u);
  if (method === "GET" && match) return handleAdminGalleryContent(request, env, match[1]);
  match = path.match(/^admin\/gallery\/([^/]+)$/u);
  if (method === "PUT" && match) return handleGalleryUpdate(request, env, match[1]);
  if (method === "DELETE" && match) return handleGalleryDelete(request, env, match[1]);
  if (method === "POST" && path === "uploads/private") return handlePrivateUpload(request, env);
  match = path.match(/^admin\/uploads\/([^/]+)\/content$/u);
  if (method === "GET" && match) return handlePrivateContent(request, env, match[1]);
  return errorResponse("Route not found.", 404, "not_found");
}

export async function onRequest(context) {
  try {
    return await routeRequest(context);
  } catch (error) {
    console.error({ message: "Beauty by Kia API request failed", path: new URL(context.request.url).pathname, errorName: error?.name || "Error" });
    if (error instanceof RequestError) return errorResponse(error.message, error.status, error.code);
    if (String(error?.message || "").includes("appointment time is no longer available")) return errorResponse("That appointment time is no longer available. The request was preserved for rescheduling.", 409, "time_unavailable");
    return errorResponse("The request could not be completed safely.", 500, "internal_error");
  }
}

export const __test = { routeRequest, verifyTurnstile, requiredString, PAYMENT_STATUSES, SLOT_BLOCKING_STATUSES };

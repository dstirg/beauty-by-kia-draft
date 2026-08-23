import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const database = new DatabaseSync(":memory:");
for (const file of fs.readdirSync(path.join(root, "migrations")).filter(file => file.endsWith(".sql")).sort()) {
  database.exec(fs.readFileSync(path.join(root, "migrations", file), "utf8"));
}

const required = [
  "services", "service_prices", "service_durations", "add_ons", "service_add_ons",
  "deposit_rules", "promotions", "promotion_services", "weekly_availability", "blocked_dates",
  "appointment_buffers", "bookings", "booking_services", "booking_add_ons",
  "booking_price_snapshots", "booking_status_history", "policy_versions", "policy_acceptances",
  "admin_accounts", "admin_sessions", "login_attempts", "audit_logs", "gallery_images",
  "private_upload_metadata", "application_settings", "communication_outbox", "payment_status_history",
  "payment_transactions", "payment_refunds", "payment_webhook_events"
];
const tables = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name));
const missing = required.filter(name => !tables.has(name));
if (missing.length) throw new Error(`Missing required tables: ${missing.join(", ")}`);

const triggers = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'").all().map(row => row.name));
for (const trigger of ["bookings_prevent_overlap_insert", "bookings_prevent_overlap_update", "booking_price_snapshots_immutable_update"]) {
  if (!triggers.has(trigger)) throw new Error(`Missing required trigger: ${trigger}`);
}
const privateUploadColumns = new Set(database.prepare("PRAGMA table_info(private_upload_metadata)").all().map(row => row.name));
if (!privateUploadColumns.has("claim_token_hash")) throw new Error("Missing private upload authorization column.");
const bookingColumns = new Set(database.prepare("PRAGMA table_info(bookings)").all().map(row => row.name));
for (const column of ["sms_consent_at", "deposit_method", "deposit_requested_at", "deposit_received_at"]) {
  if (!bookingColumns.has(column)) throw new Error(`Missing booking operations column: ${column}`);
}
const paymentColumns = new Set(database.prepare("PRAGMA table_info(payment_transactions)").all().map(row => row.name));
for (const column of ["provider_payment_intent_id", "provider_charge_id", "receipt_url", "idempotency_key_hash"]) {
  if (!paymentColumns.has(column)) throw new Error(`Missing Stripe payment foundation column: ${column}`);
}
const refundColumns = new Set(database.prepare("PRAGMA table_info(payment_refunds)").all().map(row => row.name));
for (const column of ["provider_refund_id", "amount_cents", "status"]) {
  if (!refundColumns.has(column)) throw new Error(`Missing refund foundation column: ${column}`);
}

console.log(`Verified D1-compatible migration with ${required.length} required tables.`);

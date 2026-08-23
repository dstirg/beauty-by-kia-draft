import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { appointmentWindow, intervalsOverlap, statusReleasesSlot } from "../functions/_lib/booking.js";

function database() {
  const db = new DatabaseSync(":memory:");
  for (const file of fs.readdirSync("migrations").filter(file => file.endsWith(".sql")).sort()) {
    db.exec(fs.readFileSync(`migrations/${file}`, "utf8"));
  }
  db.exec(fs.readFileSync("seed/approved-foundation.sql", "utf8"));
  return db;
}

function insertBooking(db, { id, status = "pending_review", start = null, end = null, bufferedStart = null, bufferedEnd = null }) {
  db.prepare(`INSERT INTO bookings (id, reference, status, client_name, client_email, client_phone, requested_start_at,
    appointment_start_at, appointment_end_at, buffered_start_at, buffered_end_at, estimated_total_cents)
    VALUES (?, ?, ?, 'Client', 'client@example.test', '555-0100', ?, ?, ?, ?, ?, 10000)`)
    .run(id, `REF-${id}`, status, start || "2030-01-02T09:00:00.000Z", start, end, bufferedStart, bufferedEnd);
}

test("pending booking requests are retained without blocking each other", () => {
  const db = database();
  insertBooking(db, { id: "one" });
  insertBooking(db, { id: "two" });
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE status='pending_review'").get().count, 2);
});

test("full duration and appointment buffers reject overlapping approval", () => {
  const db = database();
  insertBooking(db, { id: "first", status: "confirmed", start: "2030-01-02T09:00:00.000Z", end: "2030-01-02T12:00:00.000Z", bufferedStart: "2030-01-02T08:30:00.000Z", bufferedEnd: "2030-01-02T12:30:00.000Z" });
  insertBooking(db, { id: "second" });
  assert.throws(() => db.prepare(`UPDATE bookings SET status='confirmed', appointment_start_at=?, appointment_end_at=?, buffered_start_at=?, buffered_end_at=? WHERE id='second'`)
    .run("2030-01-02T10:00:00.000Z", "2030-01-02T11:00:00.000Z", "2030-01-02T09:30:00.000Z", "2030-01-02T11:30:00.000Z"), /no longer available/u);
  assert.equal(db.prepare("SELECT status FROM bookings WHERE id='second'").get().status, "pending_review");
});

test("first-approved-wins and cancellation releases the slot without deleting history", () => {
  const db = database();
  insertBooking(db, { id: "first", status: "confirmed", start: "2030-01-02T09:00:00.000Z", end: "2030-01-02T12:00:00.000Z", bufferedStart: "2030-01-02T09:00:00.000Z", bufferedEnd: "2030-01-02T12:30:00.000Z" });
  insertBooking(db, { id: "second" });
  db.prepare("UPDATE bookings SET status='cancelled_by_brookia', cancelled_at=CURRENT_TIMESTAMP WHERE id='first'").run();
  db.prepare(`UPDATE bookings SET status='confirmed', appointment_start_at=?, appointment_end_at=?, buffered_start_at=?, buffered_end_at=? WHERE id='second'`)
    .run("2030-01-02T10:00:00.000Z", "2030-01-02T11:00:00.000Z", "2030-01-02T09:30:00.000Z", "2030-01-02T11:30:00.000Z");
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM bookings").get().count, 2);
  assert.equal(statusReleasesSlot("cancelled_by_brookia"), true);
});

test("original booking price snapshots remain immutable after catalog price changes", () => {
  const db = database();
  insertBooking(db, { id: "priced" });
  db.prepare(`INSERT INTO booking_price_snapshots (id, booking_id, service_price_cents, add_ons_total_cents, estimated_total_cents,
    deposit_cents, remaining_balance_cents, snapshot_json) VALUES ('snap', 'priced', 7500, 0, 7500, 2500, 5000, '{}')`).run();
  const current = db.prepare("SELECT id FROM service_prices WHERE service_id='svc-silk-press' AND effective_to IS NULL").get();
  db.prepare("UPDATE service_prices SET effective_to='2030-01-01T00:00:00.000Z' WHERE id=?").run(current.id);
  db.prepare("INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, effective_from) VALUES ('svc-silk-press', 9900, 11900, '2030-01-01T00:00:00.000Z')").run();
  assert.equal(db.prepare("SELECT service_price_cents FROM booking_price_snapshots WHERE id='snap'").get().service_price_cents, 7500);
  assert.throws(() => db.prepare("UPDATE booking_price_snapshots SET service_price_cents=9900 WHERE id='snap'").run(), /immutable/u);
});

test("appointment window includes full duration and both buffers", () => {
  const window = appointmentWindow("2030-01-02T09:00:00.000Z", 180, 30, 30);
  assert.equal(window.appointmentEndAt, "2030-01-02T12:00:00.000Z");
  assert.equal(window.bufferedStartAt, "2030-01-02T08:30:00.000Z");
  assert.equal(window.bufferedEndAt, "2030-01-02T12:30:00.000Z");
  assert.equal(intervalsOverlap(window.bufferedStartAt, window.bufferedEndAt, "2030-01-02T10:00:00.000Z", "2030-01-02T11:00:00.000Z"), true);
});

test("production settings use D1 and disable browser authority and payments", () => {
  const db = database();
  const settings = Object.fromEntries(db.prepare("SELECT setting_key, setting_value FROM application_settings").all().map(row => [row.setting_key, row.setting_value]));
  assert.equal(settings.local_storage_fallback, "false");
  assert.equal(settings.payments_enabled, "false");
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM services").get().count, 30);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM add_ons").get().count, 10);
});

test("owner-approved availability, Sunday request surcharge, and daily limit are seeded", () => {
  const db = database();
  const weekdays = db.prepare("SELECT weekday, is_working_day, opens_at, closes_at FROM weekly_availability ORDER BY weekday").all();
  for (const weekday of [2, 3, 4, 5]) {
    assert.deepEqual({ ...weekdays.find(day => day.weekday === weekday) }, { weekday, is_working_day: 1, opens_at: "18:00", closes_at: "21:00" });
  }
  assert.deepEqual({ ...weekdays.find(day => day.weekday === 6) }, { weekday: 6, is_working_day: 1, opens_at: "08:00", closes_at: "18:00" });
  assert.equal(weekdays.find(day => day.weekday === 0).is_working_day, 0);
  assert.equal(db.prepare("SELECT maximum_appointments_per_day FROM appointment_buffers WHERE id='default'").get().maximum_appointments_per_day, 2);
  const settings = Object.fromEntries(db.prepare("SELECT setting_key, setting_value FROM application_settings").all().map(row => [row.setting_key, row.setting_value]));
  assert.equal(settings.sunday_request_only, "true");
  assert.equal(settings.sunday_surcharge_cents, "5000");
});

test("manual deposit, SMS consent, and 90-day photo retention foundations are safe", () => {
  const db = database();
  const settings = Object.fromEntries(db.prepare("SELECT setting_key, setting_value FROM application_settings").all().map(row => [row.setting_key, row.setting_value]));
  assert.equal(settings.payment_provider, "manual_offsite");
  assert.equal(settings.manual_deposits_enabled, "true");
  assert.equal(settings.stripe_available_later, "true");
  assert.equal(settings.sms_provider, "none");
  assert.equal(settings.sms_live_enabled, "false");
  assert.equal(settings.sms_consent_required, "true");
  assert.equal(settings.private_upload_retention_days, "90");
  assert.equal(settings.private_upload_retention_approved, "true");
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name));
  assert.equal(tables.has("communication_outbox"), true);
  assert.equal(tables.has("payment_status_history"), true);
  const bookingColumns = new Set(db.prepare("PRAGMA table_info(bookings)").all().map(row => row.name));
  for (const column of ["sms_consent_at", "deposit_method", "deposit_requested_at", "deposit_received_at"]) assert.equal(bookingColumns.has(column), true);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  DEPOSIT_PAID_AWAITING_APPROVAL,
  approvalOutcome,
  declineOutcome,
  depositForDisplayedEstimate,
  paymentEventOutcome,
  slotStartsForWindow,
  stripeActivationReady
} from "../functions/_lib/payments.js";

function database() {
  const db = new DatabaseSync(":memory:");
  for (const file of fs.readdirSync("migrations").filter(file => file.endsWith(".sql")).sort()) {
    db.exec(fs.readFileSync(`migrations/${file}`, "utf8"));
  }
  db.exec(fs.readFileSync("seed/approved-foundation.sql", "utf8"));
  return db;
}

function insertBooking(db, id, start, end, bufferedStart, bufferedEnd) {
  db.prepare(`INSERT INTO bookings (id, reference, status, payment_status, client_name, client_email,
    client_phone, requested_start_at, appointment_start_at, appointment_end_at, buffered_start_at,
    buffered_end_at, estimated_total_cents, deposit_cents, remaining_balance_cents)
    VALUES (?, ?, 'pending_review', 'deposit_not_requested', 'Client', 'client@example.test',
    '555-0100', ?, ?, ?, ?, ?, 15000, 4000, 11000)`)
    .run(id, `REF-${id}`, start, start, end, bufferedStart, bufferedEnd);
}

test("normal deposit tiers are selected from the displayed estimate", () => {
  const db = database();
  const rules = db.prepare("SELECT * FROM deposit_rules WHERE is_active=1").all();
  assert.equal(depositForDisplayedEstimate(9999, rules), 2500);
  assert.equal(depositForDisplayedEstimate(10000, rules), 4000);
  assert.equal(depositForDisplayedEstimate(17999, rules), 4000);
  assert.equal(depositForDisplayedEstimate(18000, rules), 5000);
});

test("successful payment remains pending until Kia approves", () => {
  const result = paymentEventOutcome("payment_intent.succeeded");
  assert.deepEqual(result, {
    transactionStatus: "succeeded",
    bookingPaymentStatus: "deposit_paid",
    bookingStatus: "pending_review",
    customerStatus: DEPOSIT_PAID_AWAITING_APPROVAL
  });
  assert.equal(result.customerStatus, "Deposit paid — awaiting Kia’s approval.");
});

test("failed payment does not confirm a booking", () => {
  const result = paymentEventOutcome("payment_intent.payment_failed");
  assert.equal(result.transactionStatus, "failed");
  assert.equal(result.bookingPaymentStatus, "deposit_failed");
  assert.equal(result.bookingStatus, "pending_review");
});

test("approval confirms a paid request and decline requires its refund", () => {
  assert.deepEqual(approvalOutcome("deposit_paid", 4000), { bookingStatus: "confirmed", refundRequired: false });
  assert.deepEqual(approvalOutcome("deposit_not_requested", 4000), { bookingStatus: "awaiting_deposit", refundRequired: false });
  assert.deepEqual(declineOutcome("deposit_paid"), { bookingStatus: "declined", refundRequired: true });
  assert.deepEqual(declineOutcome("deposit_failed"), { bookingStatus: "declined", refundRequired: false });
});

test("refund events prepare the customer and booking status", () => {
  const result = paymentEventOutcome("charge.refunded");
  assert.equal(result.transactionStatus, "refunded");
  assert.equal(result.bookingPaymentStatus, "deposit_refunded");
  assert.equal(result.customerStatus, "Deposit refunded.");
});

test("duplicate webhook events and duplicate successful deposits are rejected", () => {
  const db = database();
  insertBooking(db, "paid", "2030-01-02T09:00:00.000Z", "2030-01-02T10:00:00.000Z", "2030-01-02T08:30:00.000Z", "2030-01-02T10:30:00.000Z");
  db.prepare("INSERT INTO payment_webhook_events (provider_event_id,event_type,payload_sha256) VALUES ('evt-one','payment_intent.succeeded','hash-one')").run();
  assert.throws(() => db.prepare("INSERT INTO payment_webhook_events (provider_event_id,event_type,payload_sha256) VALUES ('evt-one','payment_intent.succeeded','hash-one')").run(), /UNIQUE constraint failed/u);
  db.prepare(`INSERT INTO payment_transactions (id,booking_id,provider,idempotency_key_hash,provider_payment_intent_id,amount_cents,status)
    VALUES ('pay-one','paid','stripe','key-one','pi-one',4000,'succeeded')`).run();
  assert.throws(() => db.prepare(`INSERT INTO payment_transactions (id,booking_id,provider,idempotency_key_hash,provider_payment_intent_id,amount_cents,status)
    VALUES ('pay-two','paid','stripe','key-two','pi-two',4000,'succeeded')`).run(), /UNIQUE constraint failed/u);
});

test("first paid request locks every segment of the full buffered window", () => {
  const db = database();
  insertBooking(db, "first", "2030-01-02T09:00:00.000Z", "2030-01-02T12:00:00.000Z", "2030-01-02T08:30:00.000Z", "2030-01-02T12:30:00.000Z");
  insertBooking(db, "second", "2030-01-02T10:00:00.000Z", "2030-01-02T11:00:00.000Z", "2030-01-02T09:30:00.000Z", "2030-01-02T11:30:00.000Z");
  const insertLock = db.prepare("INSERT INTO booking_slot_locks (slot_start_at,booking_id) VALUES (?,?)");
  const firstSlots = slotStartsForWindow("2030-01-02T08:30:00.000Z", "2030-01-02T12:30:00.000Z");
  const secondSlots = slotStartsForWindow("2030-01-02T09:30:00.000Z", "2030-01-02T11:30:00.000Z");
  db.exec("BEGIN IMMEDIATE");
  for (const slot of firstSlots) insertLock.run(slot, "first");
  db.prepare("UPDATE bookings SET payment_status='deposit_paid' WHERE id='first'").run();
  db.exec("COMMIT");
  assert.equal(firstSlots.length, 16);
  assert.throws(() => {
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const slot of secondSlots) insertLock.run(slot, "second");
      db.prepare("UPDATE bookings SET payment_status='deposit_paid' WHERE id='second'").run();
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }, /UNIQUE constraint failed/u);
  assert.equal(db.prepare("SELECT payment_status FROM bookings WHERE id='second'").get().payment_status, "deposit_not_requested");
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM booking_slot_locks WHERE booking_id='second'").get().count, 0);
});

test("Stripe and SMS remain disabled until every credential is connected", () => {
  assert.equal(stripeActivationReady({ PAYMENTS_ENABLED: "false" }), false);
  assert.equal(stripeActivationReady({ PAYMENTS_ENABLED: "true", PAYMENT_PROVIDER: "stripe" }), false);
  const wrangler = fs.readFileSync("wrangler.toml", "utf8");
  const client = fs.readFileSync("index.html", "utf8");
  assert.match(wrangler, /PAYMENTS_ENABLED\s*=\s*"false"/u);
  assert.match(client, /Stripe and SMS remain disabled until their accounts are connected\./u);
  assert.match(client, /position:\s*sticky;/u);
  assert.match(client, /Reference number/u);
  assert.match(client, /Current status/u);
});

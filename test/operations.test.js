import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("functions/api/[[path]].js", "utf8");
const client = fs.readFileSync("index.html", "utf8");

test("text messaging requires consent and remains inactive without a provider", () => {
  assert.equal(worker.includes('if (preferredContact === "text" && !smsConsentAt)'), true);
  assert.equal(worker.includes("communication_outbox"), true);
  assert.equal(worker.includes("'pending_provider'"), true);
  assert.equal(client.includes("I agree to receive automated transactional text messages"), true);
  assert.equal(client.includes("no texts will be sent until a texting provider is selected"), true);
});

test("manual Cash App deposits require Kia verification", () => {
  assert.equal(worker.includes("handleBookingDeposit"), true);
  assert.equal(worker.includes('paymentStatus === "deposit_paid" && !method'), true);
  assert.equal(worker.includes("Deposit received and verified by Kia."), true);
  assert.equal(worker.includes('Object.freeze(["cash_app", "zelle"])'), true);
  assert.equal(client.includes("Mark deposit paid"), true);
  assert.equal(client.includes("After Kia reviews and approves your request, she will provide Cash App deposit instructions. Your appointment is not confirmed until Kia verifies your deposit."), true);
  assert.equal(client.includes("Stripe"), false);
});

test("private upload retention cleanup removes R2 objects and metadata after expiry", () => {
  assert.equal(worker.includes("purgeExpiredPrivateUploads"), true);
  assert.equal(worker.includes("retention_delete_after <= ?"), true);
  assert.equal(worker.includes("env.PRIVATE_UPLOADS.delete(upload.object_key)"), true);
  assert.equal(client.includes('name="photoRetentionDays"'), true);
});

test("booking API persists structured intake and enforces service photo requirements", () => {
  assert.equal(worker.includes("normalizeCustomerIntake(client, service.questionnaire_type, intakeCategory)"), true);
  assert.equal(worker.includes("safety_review_status"), true);
  assert.equal(worker.includes("client_intake_json"), true);
  assert.equal(worker.includes("missingRequiredUploadTypes(requiredUploadTypes, uploadTypes)"), true);
  assert.equal(worker.includes('"required_photo_missing"'), true);
  assert.equal(worker.includes("bookingAddOns: bookingAddOns.results"), true);
  assert.equal(client.includes("payload.bookingAddOns"), true);
});

test("consultation approval recalculates a deposit from the final approved price", () => {
  assert.equal(worker.includes('booking.price_type_snapshot === "consultation"'), true);
  assert.equal(worker.includes("depositForDisplayedEstimate(finalTotal, depositRules.results)"), true);
  assert.match(worker, /UPDATE bookings SET status=\?, payment_status=\?, deposit_cents=\?/u);
  assert.equal(client.includes("Approve price &amp; request deposit"), true);
});

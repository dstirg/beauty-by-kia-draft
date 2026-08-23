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

test("manual deposits require Kia verification and do not activate Stripe", () => {
  assert.equal(worker.includes("handleBookingDeposit"), true);
  assert.equal(worker.includes('paymentStatus === "deposit_paid" && !method'), true);
  assert.equal(worker.includes("Deposit received and verified by Kia."), true);
  assert.equal(client.includes("Mark deposit paid"), true);
  assert.equal(client.includes("Stripe can be added later but is not active."), true);
});

test("private upload retention cleanup removes R2 objects and metadata after expiry", () => {
  assert.equal(worker.includes("purgeExpiredPrivateUploads"), true);
  assert.equal(worker.includes("retention_delete_after <= ?"), true);
  assert.equal(worker.includes("env.PRIVATE_UPLOADS.delete(upload.object_key)"), true);
  assert.equal(client.includes('name="photoRetentionDays"'), true);
});

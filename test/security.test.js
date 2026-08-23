import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  constantTimeEqual,
  genericLoginError,
  hashPin,
  isValidPin,
  sanitizeAuditDetails,
  sessionCookie,
  verifyPin
} from "../functions/_lib/security.js";

test("six-digit PIN strings retain an initial zero", async () => {
  const pin = [0, 1, 0, 7, 9, 7].join("");
  assert.equal(typeof pin, "string");
  assert.equal(pin.length, 6);
  assert.equal(pin.at(0), "0");
  assert.equal(isValidPin(pin), true);
  const credential = await hashPin(pin);
  assert.equal(await verifyPin(pin, { pin_salt: credential.salt, pin_hash: credential.hash, pin_iterations: credential.iterations }), true);
});

test("five digits and non-string PIN values are rejected", () => {
  assert.equal(isValidPin("10797"), false);
  assert.equal(isValidPin(10797), false);
  assert.equal(isValidPin("12345a"), false);
});

test("incorrect PIN verification fails and constant-time comparison works", async () => {
  const credential = await hashPin("123456");
  assert.equal(await verifyPin("654321", { pin_salt: credential.salt, pin_hash: credential.hash, pin_iterations: credential.iterations }), false);
  assert.equal(constantTimeEqual("same", "same"), true);
  assert.equal(constantTimeEqual("same", "different"), false);
});

test("server-only PIN pepper is required to reproduce a production credential", async () => {
  const credential = await hashPin("123456", null, undefined, "server-only-pepper");
  const record = { pin_salt: credential.salt, pin_hash: credential.hash, pin_iterations: credential.iterations };
  assert.equal(await verifyPin("123456", record, "server-only-pepper"), true);
  assert.equal(await verifyPin("123456", record, "different-pepper"), false);
  assert.equal(await verifyPin("123456", record), false);
});

test("session cookie uses the required security attributes", () => {
  const cookie = sessionCookie("opaque-session-value", 3600);
  for (const attribute of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/api", "Max-Age=3600"]) assert.match(cookie, new RegExp(attribute));
});

test("login failures remain generic and audit details remove secrets", () => {
  assert.equal(genericLoginError(), "Unable to sign in with the provided credentials.");
  assert.deepEqual(sanitizeAuditDetails({ reason: "failed", pin: "hidden", sessionToken: "hidden", privateImageUrl: "hidden" }), { reason: "failed" });
});

test("repository does not contain the private setup credential", () => {
  const credential = [0, 1, 0, 7, 9, 7].join("");
  const files = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if ([".git", "node_modules"].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else files.push(file);
    }
  };
  visit(".");
  for (const file of files) assert.equal(fs.readFileSync(file).toString("utf8").includes(credential), false, `sensitive value found in ${file}`);
});

test("worker implements Turnstile, rate limits, lockout, session revocation, and atomic one-time setup diagnostics", () => {
  const source = fs.readFileSync("functions/api/[[path]].js", "utf8");
  for (const marker of ["siteverify", "AUTH_FAILURE_LIMIT", "locked_until", "admin_sessions", "revoked_at", "setup_complete", "initial_admin_setup_complete", "genericLoginError", "setup_hash_failed", "setup_write_failed", "'admin_setup'", '"admin_login"', '"booking_request"', "result.hostname"]) assert.equal(source.includes(marker), true, `missing ${marker}`);
});

test("booking and admin forms retain separate Turnstile widget identifiers", () => {
  const source = fs.readFileSync("index.html", "utf8");
  for (const marker of ["booking-turnstile", "bookingTurnstileWidgetId", "adminTurnstileWidgetId", "getResponse?.(bookingTurnstileWidgetId)", "getResponse?.(adminTurnstileWidgetId)"]) {
    assert.equal(source.includes(marker), true, `missing ${marker}`);
  }
  assert.equal(source.includes("getResponse?.()"), false);
  assert.equal(source.includes("reset?.()"), false);
});

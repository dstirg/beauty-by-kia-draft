const encoder = new TextEncoder();

export const PIN_PATTERN = /^\d{6,12}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cloudflare's free Workers tier has a 10 ms CPU allowance. A server-only,
// domain-separated pepper protects the low-entropy PIN if D1 is exposed while
// 100,000 native PBKDF2 rounds keep the operation within the edge runtime.
export const PBKDF2_ITERATIONS = 100000;
export const SESSION_COOKIE = "bbk_admin_session";
const PIN_PEPPER_CONTEXT = "beauty-by-kia-admin-pin-v1";

export function isValidPin(value) {
  return typeof value === "string" && PIN_PATTERN.test(value);
}

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export function base64UrlToBytes(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

async function pinKeyMaterial(pin, pepper) {
  if (!pepper) return encoder.encode(pin);
  const pepperKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", pepperKey, encoder.encode(`${PIN_PEPPER_CONTEXT}:${pin}`)));
}

export async function hashPin(pin, salt = null, iterations = PBKDF2_ITERATIONS, pepper = "") {
  if (!isValidPin(pin)) throw new TypeError("PIN must contain 6–12 numeric digits.");
  const saltBytes = salt ? base64UrlToBytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", await pinKeyMaterial(pin, pepper), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
    key,
    256
  );
  return {
    salt: bytesToBase64Url(saltBytes),
    hash: bytesToBase64Url(new Uint8Array(bits)),
    iterations
  };
}

export function constantTimeEqual(left, right) {
  const a = typeof left === "string" ? encoder.encode(left) : left;
  const b = typeof right === "string" ? encoder.encode(right) : right;
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index % a.length] ?? 0) ^ (b[index % b.length] ?? 0);
  }
  return difference === 0;
}

export async function verifyPin(pin, record, pepper = "") {
  if (!isValidPin(pin) || !record?.pin_salt || !record?.pin_hash) return false;
  const candidate = await hashPin(pin, record.pin_salt, Number(record.pin_iterations), pepper);
  return constantTimeEqual(candidate.hash, record.pin_hash);
}

export function parseCookies(request) {
  const result = {};
  for (const pair of (request.headers.get("Cookie") || "").split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    result[pair.slice(0, separator).trim()] = decodeURIComponent(pair.slice(separator + 1).trim());
  }
  return result;
}

export function sessionCookie(token, maxAgeSeconds = 14400) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0`;
}

const FORBIDDEN_AUDIT_KEY = /(pin|password|token|secret|authorization|cookie|private.*url|object.*key)/iu;

export function sanitizeAuditDetails(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_AUDIT_KEY.test(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value) || value === null) output[key] = value;
  }
  return output;
}

export function genericLoginError() {
  return "Unable to sign in with the provided credentials.";
}

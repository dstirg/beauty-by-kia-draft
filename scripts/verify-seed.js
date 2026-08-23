import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const database = new DatabaseSync(":memory:");
for (const file of fs.readdirSync(path.join(root, "migrations")).filter(file => file.endsWith(".sql")).sort()) {
  database.exec(fs.readFileSync(path.join(root, "migrations", file), "utf8"));
}
const seed = fs.readFileSync(path.join(root, "seed", "approved-foundation.sql"), "utf8");
database.exec(seed);
database.exec(seed);

const count = table => database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
const expectations = { services: 30, add_ons: 10, deposit_rules: 3, weekly_availability: 7, promotions: 1, appointment_buffers: 1 };
for (const [table, expected] of Object.entries(expectations)) {
  const actual = count(table);
  if (actual !== expected) throw new Error(`${table}: expected ${expected}, received ${actual}`);
}
const settings = Object.fromEntries(database.prepare("SELECT setting_key, setting_value FROM application_settings").all().map(row => [row.setting_key, row.setting_value]));
if (settings.payments_enabled !== "false" || settings.local_storage_fallback !== "false") {
  throw new Error("Production safeguards are not disabled as required.");
}
const schedule = database.prepare("SELECT weekday, is_working_day, opens_at, closes_at FROM weekly_availability ORDER BY weekday").all();
for (const weekday of [2, 3, 4, 5]) {
  const day = schedule.find(item => item.weekday === weekday);
  if (day?.is_working_day !== 1 || day.opens_at !== "18:00" || day.closes_at !== "21:00") throw new Error(`Weekday ${weekday} does not match the approved 6–9 p.m. schedule.`);
}
const saturday = schedule.find(item => item.weekday === 6);
if (saturday?.is_working_day !== 1 || saturday.opens_at !== "08:00" || saturday.closes_at !== "18:00") throw new Error("Saturday does not match the approved 8 a.m.–6 p.m. schedule.");
if (schedule.find(item => item.weekday === 0)?.is_working_day !== 0 || settings.sunday_request_only !== "true" || settings.sunday_surcharge_cents !== "5000") throw new Error("Sunday request-only pricing is not configured.");
const buffer = database.prepare("SELECT maximum_appointments_per_day FROM appointment_buffers WHERE id='default'").get();
if (buffer.maximum_appointments_per_day !== 2) throw new Error("Maximum appointments per day must be two.");
if (settings.private_upload_retention_days !== "90" || settings.private_upload_retention_approved !== "true") throw new Error("The approved 90-day private-photo retention policy is missing.");
if (settings.manual_deposits_enabled !== "true" || settings.payment_provider !== "manual_offsite" || settings.sms_live_enabled !== "false") throw new Error("Manual deposits or the inactive SMS provider foundation is not configured safely.");
console.log("Applied the approved seed twice without duplicate catalog or settings records.");

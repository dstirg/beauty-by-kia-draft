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
console.log("Applied the approved seed twice without duplicate catalog or settings records.");

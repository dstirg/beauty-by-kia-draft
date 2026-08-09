import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

await import("../pricing.js");

const { services, addOns } = globalThis.BBKPricing;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "seed", "approved-foundation.sql");
const quote = value => `'${String(value ?? "").replaceAll("'", "''")}'`;
const bool = value => value ? 1 : 0;
const json = value => quote(JSON.stringify(value));
const lines = [
  "PRAGMA foreign_keys = ON;",
  "",
  "-- Approved catalog seed. Idempotent inserts preserve later owner edits.",
  "-- No administrator email, PIN, session secret, or provider credential belongs here.",
  ""
];

for (const service of services) {
  const slug = service.id.replace(/^svc-/u, "");
  lines.push(
    `INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)`,
    `VALUES (${quote(service.id)}, ${quote(slug)}, ${quote(service.name)}, ${quote(service.category)}, ${quote(service.description)}, ${quote(service.notice || "")}, ${quote(service.priceType)}, 1, ${bool(service.featured)}, ${service.questionnaire ? quote(service.questionnaire) : "NULL"}, ${json(service.requiredUploads || [])})`,
    "ON CONFLICT(id) DO NOTHING;",
    `INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)`,
    `SELECT ${quote(service.id)}, ${Math.round(service.minPrice * 100)}, ${service.maxPrice == null ? "NULL" : Math.round(service.maxPrice * 100)}, ${service.priceType === "starting" ? Math.round(service.minPrice * 100) : "NULL"}`,
    `WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = ${quote(service.id)} AND effective_to IS NULL);`,
    `INSERT INTO service_durations (service_id, duration_minutes)`,
    `SELECT ${quote(service.id)}, ${Number(service.duration)}`,
    `WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = ${quote(service.id)} AND effective_to IS NULL);`,
    ""
  );
}

for (const addOn of addOns) {
  lines.push(
    `INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)`,
    `VALUES (${quote(addOn.id)}, ${quote(addOn.id.replace(/^ao-/u, ""))}, ${quote(addOn.name)}, ${quote(addOn.description)}, ${quote(addOn.priceType)}, ${Math.round(addOn.minPrice * 100)}, ${addOn.maxPrice == null ? "NULL" : Math.round(addOn.maxPrice * 100)}, 1)`,
    "ON CONFLICT(id) DO NOTHING;",
    ""
  );
}

for (const service of services) {
  for (const addOnSlug of service.applicableAddOnIds || []) {
    lines.push(
      `INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES (${quote(service.id)}, ${quote(`ao-${addOnSlug}`)});`
    );
  }
}

lines.push(
  "",
  "INSERT OR IGNORE INTO deposit_rules (id, name, minimum_total_cents, maximum_total_cents, deposit_cents) VALUES",
  "  ('deposit-under-100', 'Under $100', 0, 10000, 2500),",
  "  ('deposit-under-180', '$100–$179.99', 10000, 18000, 4000),",
  "  ('deposit-180-plus', '$180 or more', 18000, NULL, 5000);",
  "",
  "INSERT OR IGNORE INTO promotions (id, name, banner_text, is_active, show_badges)",
  "VALUES ('grand-opening-special', 'Grand Opening Special', 'Grand-opening pricing is available for a limited time and may not be combined with other discounts.', 0, 1);",
  "",
  "INSERT OR IGNORE INTO promotion_services (promotion_id, service_id, promotional_price_cents) VALUES",
  "  ('grand-opening-special', 'svc-silk-press', 6500),",
  "  ('grand-opening-special', 'svc-quick-weave-style', 6500),",
  "  ('grand-opening-special', 'svc-basic-glam', 5500),",
  "  ('grand-opening-special', 'svc-wig-install', 8500);",
  "",
  "INSERT OR IGNORE INTO weekly_availability (weekday, is_working_day, opens_at, closes_at, requires_owner_review) VALUES",
  "  (0, 0, NULL, NULL, 1),",
  "  (1, 0, NULL, NULL, 1),",
  "  (2, 1, '17:30', '21:00', 1),",
  "  (3, 1, '17:30', '21:00', 1),",
  "  (4, 1, '17:30', '21:00', 1),",
  "  (5, 1, '17:00', '21:00', 1),",
  "  (6, 1, '08:00', '18:00', 1);",
  "",
  "INSERT OR IGNORE INTO appointment_buffers (id, before_minutes, after_minutes, minimum_notice_hours, maximum_booking_window_days, maximum_appointments_per_day, requires_owner_review)",
  "VALUES ('default', 0, 30, 24, 60, 6, 1);",
  "",
  "INSERT OR IGNORE INTO policy_versions (id, version_label, policy_json, is_current, published_at) VALUES (",
  "  'policy-bbk-2026-07-26',",
  "  'BBK-2026-07-26',",
  `  ${json({
    deposit: "A non-refundable deposit of $25–$50 is required to reserve an appointment. The deposit amount is based on the selected service and is applied toward the final service balance.",
    late: "A $15 late fee applies when a client arrives more than 15 minutes late. Depending on the schedule and service length, the appointment may need to be shortened, rescheduled, or canceled.",
    noShow: "Clients who fail to attend an appointment without proper notice will forfeit their deposit. Future appointments may require a new deposit or additional payment requirements.",
    balance: "The remaining service balance is due at the end of the appointment unless Kia provides different written instructions.",
    cancellation: "Contact Kia as soon as possible if an appointment must be changed or canceled.",
    rescheduling: "Rescheduling is subject to Kia’s approval and availability.",
    preparation: "Follow the preparation instructions for the selected service. Unplanned work may affect the final confirmed price.",
    guests: "Please do not bring extra guests or children unless approved before the appointment.",
    satisfaction: "Contact Beauty by Kia promptly with any service concern so Kia can review it."
  })},`,
  "  1,",
  "  CURRENT_TIMESTAMP",
  ");",
  "",
  "INSERT OR IGNORE INTO application_settings (setting_key, setting_value) VALUES",
  "  ('business_name', 'Beauty by Kia'),",
  "  ('draft_label', 'Draft Review — Not Yet Live'),",
  "  ('app_environment', 'production'),",
  "  ('local_storage_fallback', 'false'),",
  "  ('payments_enabled', 'false'),",
  "  ('payment_provider', 'none'),",
  "  ('communications_enabled', 'false'),",
  "  ('timezone', 'America/Chicago'),",
  "  ('initial_admin_setup_complete', 'false');",
  ""
);

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} with ${services.length} services and ${addOns.length} add-ons.`);

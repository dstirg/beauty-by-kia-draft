-- Owner-approved makeup and bridal catalog replacement. Booking snapshots stay immutable.
-- All active bridal services are makeup-only; no historical bookings or prices are changed.

UPDATE services SET
  name = 'BBK Soft Glam',
  category = 'Makeup',
  description = 'A soft, flawless beat that enhances natural features without feeling overly dramatic. Perfect for a polished everyday or special-occasion look.',
  notice = '', price_type = 'fixed', questionnaire_type = NULL, required_upload_types = '[]', is_active = 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-basic-glam';
UPDATE service_prices SET effective_to = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE service_id = 'svc-basic-glam' AND effective_to IS NULL;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents, effective_from) SELECT 'svc-basic-glam', 7500, 7500, NULL, datetime('now', '+1 second') WHERE EXISTS (SELECT 1 FROM services WHERE id = 'svc-basic-glam');

UPDATE services SET
  name = 'BBK Full Glam',
  category = 'Makeup',
  description = 'More coverage, definition, and detail while still complementing natural features.',
  notice = '', price_type = 'fixed', questionnaire_type = NULL, required_upload_types = '[]', is_active = 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-full-glam';
UPDATE service_prices SET effective_to = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE service_id = 'svc-full-glam' AND effective_to IS NULL;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents, effective_from) SELECT 'svc-full-glam', 10000, 10000, NULL, datetime('now', '+1 second') WHERE EXISTS (SELECT 1 FROM services WHERE id = 'svc-full-glam');

UPDATE services SET
  name = 'BBK Glam Party',
  category = 'Makeup',
  description = 'Makeup for birthdays, girls’ nights, photoshoots, celebrations, and group events.',
  notice = '$90 per person · 3-person minimum · 3 guests $270 · 4 guests $360 · 5 guests $450. Parties of 6 or more receive Kia’s custom quote.',
  price_type = 'starting', questionnaire_type = 'makeupParty', required_upload_types = '[]', is_active = 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-bbk-glam-party';
UPDATE service_prices SET effective_to = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE service_id = 'svc-bbk-glam-party' AND effective_to IS NULL;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents, effective_from) SELECT 'svc-bbk-glam-party', 27000, NULL, 27000, datetime('now', '+1 second') WHERE EXISTS (SELECT 1 FROM services WHERE id = 'svc-bbk-glam-party');

UPDATE services SET
  name = 'BBK Bridal Glam',
  category = 'Makeup',
  description = 'Timeless, elegant, long-lasting makeup customized specifically for a wedding day.',
  notice = 'Makeup only. Includes elevated skin prep, premium strip lashes, long-wear setting, and a mini bridal touch-up kit.',
  price_type = 'fixed', questionnaire_type = 'bridal', required_upload_types = '[]', is_active = 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-wedding-glam';
UPDATE service_prices SET effective_to = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE service_id = 'svc-wedding-glam' AND effective_to IS NULL;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents, effective_from) SELECT 'svc-wedding-glam', 17500, 17500, NULL, datetime('now', '+1 second') WHERE EXISTS (SELECT 1 FROM services WHERE id = 'svc-wedding-glam');
UPDATE service_durations SET effective_to = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE service_id = 'svc-wedding-glam' AND effective_to IS NULL;
INSERT INTO service_durations (service_id, duration_minutes, effective_from) SELECT 'svc-wedding-glam', 120, datetime('now', '+1 second') WHERE EXISTS (SELECT 1 FROM services WHERE id = 'svc-wedding-glam');

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES
  ('svc-signature-glam', 'signature-glam', 'BBK Signature Glam', 'Makeup', 'A bold, detailed, camera-ready Beauty by Kia beat customized for a statement finish.', '', 'fixed', 1, 0, NULL, '[]'),
  ('svc-bridal-trial', 'bridal-trial', 'BBK Bridal Trial', 'Makeup', 'A complete bridal makeup application to refine inspiration, coverage, colors, and the wedding-day vision.', 'Makeup only. Your trial helps finalize the bridal look before the wedding day.', 'fixed', 1, 0, 'bridal', '[]'),
  ('svc-bridal-party-glam', 'bridal-party-glam', 'BBK Bridal Party Glam', 'Makeup', 'Professional makeup for bridesmaids and other adult members of the wedding party.', '$100 per person · Makeup only. Kia will confirm the wedding-day timeline and group details.', 'starting', 1, 0, 'bridalParty', '[]'),
  ('svc-junior-glam', 'junior-glam', 'BBK Junior Glam', 'Makeup', 'A soft, age-appropriate beauty service for junior bridesmaids and younger clients.', 'Makeup only. Includes light skin prep, subtle eye enhancement, lip gloss, and finishing touches.', 'fixed', 1, 0, NULL, '[]')
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name, category = excluded.category, description = excluded.description, notice = excluded.notice,
  price_type = excluded.price_type, is_active = excluded.is_active, questionnaire_type = excluded.questionnaire_type,
  required_upload_types = excluded.required_upload_types, updated_at = CURRENT_TIMESTAMP;

INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-signature-glam', 12500, 12500, NULL WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-signature-glam' AND effective_to IS NULL);
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-bridal-trial', 10000, 10000, NULL WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-bridal-trial' AND effective_to IS NULL);
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-bridal-party-glam', 10000, NULL, 10000 WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-bridal-party-glam' AND effective_to IS NULL);
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-junior-glam', 5000, 5000, NULL WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-junior-glam' AND effective_to IS NULL);

INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-signature-glam', 120 WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-signature-glam' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-bridal-trial', 120 WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-bridal-trial' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-bridal-party-glam', 120 WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-bridal-party-glam' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-junior-glam', 60 WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-junior-glam' AND effective_to IS NULL);

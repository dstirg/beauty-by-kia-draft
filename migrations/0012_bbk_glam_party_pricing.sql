-- BBK Glam is a makeup-only small-party package. Historical booking snapshots remain unchanged.
UPDATE services SET name = 'BBK Basic Glam', description = 'A polished basic-glam makeup application.', price_type = 'fixed', updated_at = CURRENT_TIMESTAMP WHERE id = 'svc-basic-glam';
UPDATE service_prices SET effective_to = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE service_id = 'svc-basic-glam' AND effective_to IS NULL AND minimum_price_cents <> 7500;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents) SELECT 'svc-basic-glam', 7500, 7500, NULL WHERE EXISTS (SELECT 1 FROM services WHERE id='svc-basic-glam') AND NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id='svc-basic-glam' AND effective_to IS NULL AND minimum_price_cents=7500 AND maximum_price_cents=7500);

UPDATE services SET name = 'BBK Full Glam', description = 'One full-glam makeup application for one person, customized for the requested finish.', price_type = 'fixed', updated_at = CURRENT_TIMESTAMP WHERE id = 'svc-full-glam';
UPDATE service_prices SET effective_to = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE service_id = 'svc-full-glam' AND effective_to IS NULL AND (minimum_price_cents <> 15000 OR maximum_price_cents <> 15000);
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents) SELECT 'svc-full-glam', 15000, 15000, NULL WHERE EXISTS (SELECT 1 FROM services WHERE id='svc-full-glam') AND NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id='svc-full-glam' AND effective_to IS NULL AND minimum_price_cents=15000 AND maximum_price_cents=15000);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
SELECT 'svc-bbk-glam-party', 'bbk-glam-party', 'BBK Glam', 'Makeup', 'Makeup services for small parties and special occasions.', 'Up to 2 people — $250 total. Up to 3 people — $300 total. Parties of 4 or more require a custom quote based on party size, timing, location, and service requirements.', 'range', 1, 0, 'makeupParty', '["inspiration"]'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE id='svc-bbk-glam-party');
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents) SELECT 'svc-bbk-glam-party', 25000, 30000, NULL WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id='svc-bbk-glam-party' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes) SELECT 'svc-bbk-glam-party', 180 WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id='svc-bbk-glam-party' AND effective_to IS NULL);

UPDATE services SET notice = 'Hair and makeup for the bride plus four additional people are included. Larger parties, requested services, service complexity, location, and wedding-day timeline may require an adjusted custom quote.', updated_at=CURRENT_TIMESTAMP WHERE id='svc-wedding-glam';

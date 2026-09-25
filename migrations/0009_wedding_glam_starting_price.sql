-- Approved bridal package baseline: customer-facing pricing starts at $1,195.
-- Existing bookings keep their historical price snapshots.
UPDATE services
SET price_type = 'starting',
    description = 'Bridal package pricing starts at $1,195 and is reviewed for the look, location, schedule, party size, and trial needs.',
    notice = 'Bridal package pricing starts at $1,195. Larger parties, requested services, service complexity, location, and wedding-day timeline may require an adjusted custom quote.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-wedding-glam';

UPDATE service_prices
SET effective_to = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE service_id = 'svc-wedding-glam'
  AND effective_to IS NULL
  AND (minimum_price_cents <> 119500 OR maximum_price_cents IS NOT NULL OR starting_price_cents <> 119500);

INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-wedding-glam', 119500, NULL, 119500
WHERE EXISTS (
  SELECT 1 FROM services WHERE id = 'svc-wedding-glam'
)
AND NOT EXISTS (
  SELECT 1 FROM service_prices
  WHERE service_id = 'svc-wedding-glam'
    AND effective_to IS NULL
    AND minimum_price_cents = 119500
    AND maximum_price_cents IS NULL
    AND starting_price_cents = 119500
);

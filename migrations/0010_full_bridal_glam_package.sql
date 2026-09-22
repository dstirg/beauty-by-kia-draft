-- Clarify individual full-glam pricing and the five-person bridal package.
-- Existing booking price snapshots remain unchanged.
UPDATE services
SET name = 'BBK Full Glam — per person',
    description = 'One full-glam makeup application for one person, customized for the requested finish.',
    notice = '',
    price_type = 'range',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-full-glam';

UPDATE service_prices
SET effective_to = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE service_id = 'svc-full-glam'
  AND effective_to IS NULL
  AND (minimum_price_cents <> 25000 OR maximum_price_cents <> 30000 OR starting_price_cents IS NOT NULL);

INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-full-glam', 25000, 30000, NULL
WHERE EXISTS (SELECT 1 FROM services WHERE id = 'svc-full-glam')
  AND NOT EXISTS (
    SELECT 1 FROM service_prices
    WHERE service_id = 'svc-full-glam'
      AND effective_to IS NULL
      AND minimum_price_cents = 25000
      AND maximum_price_cents = 30000
      AND starting_price_cents IS NULL
  );

UPDATE services
SET name = 'BBK Full Bridal Glam — Bride + 4',
    description = 'A five-person bridal makeup package for the bride and four additional people. Pricing starts at $1,195 and is reviewed for the look, location, schedule, and trial needs.',
    notice = 'Bride + 4 is included. Five BBK Full Glam appointments start at $1,250, so this bridal package starts at $1,195. Larger parties, requested services, service complexity, location, and wedding-day timeline may require an adjusted custom quote.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-wedding-glam';

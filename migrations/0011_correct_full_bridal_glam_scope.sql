-- Correct customer-facing service scope: BBK Glam is makeup only; Full Bridal includes hair and makeup.
-- Existing booking price snapshots remain unchanged.
UPDATE services
SET name = 'BBK Glam — Makeup per person',
    description = 'One full-glam makeup application for one person, customized for the requested finish.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-full-glam';

UPDATE services
SET name = 'BBK Full Bridal Glam — Hair + Makeup for Bride + 4',
    description = 'A five-person bridal package with hair and makeup for the bride and four additional people. Pricing starts at $1,195 and is reviewed for the look, location, schedule, and trial needs.',
    notice = 'Hair and makeup for the bride plus four additional people are included. Five BBK Glam makeup-only appointments start at $1,250 before hair, so this full bridal package starts at $1,195. Larger parties, requested services, service complexity, location, and wedding-day timeline may require an adjusted custom quote.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-wedding-glam';

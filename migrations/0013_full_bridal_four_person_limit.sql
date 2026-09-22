-- Correct the standard Full Bridal Glam package to Bride plus up to three additional people.
-- Historical booking snapshots and paid/completed bookings remain unchanged.
UPDATE services
SET name = 'BBK Full Bridal Glam — Hair + Makeup for Bride + 3',
    description = 'Wedding-day hair and makeup for the bride plus up to three additional people, for a maximum of four people total. Pricing starts at $1,195.',
    notice = 'Parties larger than 4 require a custom quote and may require an additional beauty professional. Final pricing is reviewed for requested styles, complexity, location, travel, ready-by time, timeline, and staffing needs.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'svc-wedding-glam';

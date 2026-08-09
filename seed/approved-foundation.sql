PRAGMA foreign_keys = ON;

-- Approved catalog seed. Idempotent inserts preserve later owner edits.
-- No administrator email, PIN, session secret, or provider credential belongs here.

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-silk-press', 'silk-press', 'Silk Press', 'Hair', 'A smooth, polished press tailored to the client’s hair needs.', '', 'range', 1, 1, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-silk-press', 7500, 9500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-silk-press' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-silk-press', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-silk-press' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-twist-out', 'twist-out', 'Twist Out', 'Hair', 'A defined twist-out styled for shape, movement, and lasting definition.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-twist-out', 6000, 8000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-twist-out' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-twist-out', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-twist-out' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-perm-rod', 'perm-rod', 'Perm Rod Set', 'Hair', 'A polished rod set with curl placement suited to the requested finish.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-perm-rod', 7500, 9500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-perm-rod' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-perm-rod', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-perm-rod' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-flexi-rod', 'flexi-rod', 'Flexi Rod Set', 'Hair', 'A flexible-rod style designed for soft, dimensional curls.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-flexi-rod', 7500, 9500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-flexi-rod' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-flexi-rod', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-flexi-rod' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-wash-go', 'wash-go', 'Wash & Go', 'Hair', 'A curl-defining wash-and-go finish based on the client’s natural texture.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-wash-go', 5000, 7000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-wash-go' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-wash-go', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-wash-go' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-mini-twists', 'mini-twists', 'Mini Twists', 'Hair', 'Small two-strand twists customized to the client’s hair and desired finish.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-mini-twists', 13000, 18000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-mini-twists' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-mini-twists', 240
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-mini-twists' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-mini-braids', 'mini-braids', 'Mini Braids', 'Hair', 'Detailed mini braids customized for size, length, and density.', '', 'starting', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-mini-braids', 18000, 25000, 18000
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-mini-braids' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-mini-braids', 300
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-mini-braids' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-wash-blowout-trim', 'wash-blowout-trim', 'Wash, Blowout & Trim', 'Hair', 'Includes washing, blow-drying, and a basic trim as part of this service.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-wash-blowout-trim', 5000, 7000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-wash-blowout-trim' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-wash-blowout-trim', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-wash-blowout-trim' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-miracle-knots', 'miracle-knots', 'Miracle Knots', 'Braids', 'A customized knot-style braid service based on length, size, and density.', '', 'starting', 1, 1, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-miracle-knots', 18000, 30000, 18000
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-miracle-knots' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-miracle-knots', 300
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-miracle-knots' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-soft-locs', 'soft-locs', 'Soft Locs', 'Braids', 'Soft loc installation customized by length, density, and finish.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-soft-locs', 18000, 27500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-soft-locs' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-soft-locs', 300
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-soft-locs' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-man-braids', 'man-braids', 'Man Braids', 'Braids', 'A tailored braided style with clean parting and a polished finish.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-man-braids', 4500, 9000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-man-braids' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-man-braids', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-man-braids' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-full-color', 'full-color', 'Full Head Color', 'Color', 'All-over color customized after review of the current hair and desired result.', 'Final color pricing may depend on current hair color, hair length, thickness, product amount, corrective work, and the desired result. A consultation or photo review may be required.', 'range', 1, 0, NULL, '["current","inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-full-color', 11000, 17500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-full-color' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-full-color', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-full-color' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-color-touch-up', 'color-touch-up', 'Color Touch-Up', 'Color', 'Targeted color maintenance based on existing color and regrowth.', 'Final color pricing may depend on current hair color, hair length, thickness, product amount, corrective work, and the desired result. A consultation or photo review may be required.', 'range', 1, 0, NULL, '["current","inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-color-touch-up', 7500, 10000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-color-touch-up' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-color-touch-up', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-color-touch-up' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-quick-weave-style', 'quick-weave-style', 'Quick Weave & Style', 'Weaves', 'A quick-weave installation finished in the selected style.', 'Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.', 'range', 1, 1, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-quick-weave-style', 7500, 9500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-quick-weave-style' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-quick-weave-style', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-quick-weave-style' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-quick-weave-closure', 'quick-weave-closure', 'Quick Weave with Closure', 'Weaves', 'A quick-weave installation designed for use with a closure.', 'Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-quick-weave-closure', 10000, 13000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-quick-weave-closure' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-quick-weave-closure', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-quick-weave-closure' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-quick-weave-leave-out', 'quick-weave-leave-out', 'Quick Weave with Leave-Out', 'Weaves', 'A quick-weave installation blended with leave-out.', 'Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-quick-weave-leave-out', 9000, 12000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-quick-weave-leave-out' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-quick-weave-leave-out', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-quick-weave-leave-out' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-slick-ponytail', 'slick-ponytail', 'Slick Back Ponytail', 'Weaves', 'A sleek ponytail style tailored to the desired finish.', 'Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-slick-ponytail', 7000, 9500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-slick-ponytail' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-slick-ponytail', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-slick-ponytail' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-braided-ponytail', 'braided-ponytail', 'Braided Ponytail', 'Weaves', 'A polished ponytail finished with a braided extension style.', 'Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-braided-ponytail', 8500, 12000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-braided-ponytail' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-braided-ponytail', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-braided-ponytail' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-wig-install', 'wig-install', 'Wig Install', 'Weaves', 'A customized wig installation and finish.', 'Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-wig-install', 10000, 15000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-wig-install' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-wig-install', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-wig-install' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-wig-construction', 'wig-construction', 'Wig Construction', 'Weaves', 'Custom wig construction based on approved specifications.', 'Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-wig-construction', 15000, 25000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-wig-construction' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-wig-construction', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-wig-construction' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-press-short', 'press-short', 'Custom Press-On Set — Short', 'Nails', 'A custom short press-on nail set made to the approved design.', '', 'fixed', 1, 0, 'pressOn', '["inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-press-short', 3500, 3500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-press-short' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-press-short', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-press-short' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-press-medium', 'press-medium', 'Custom Press-On Set — Medium', 'Nails', 'A custom medium press-on nail set made to the approved design.', '', 'fixed', 1, 0, 'pressOn', '["inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-press-medium', 4500, 4500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-press-medium' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-press-medium', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-press-medium' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-press-long', 'press-long', 'Custom Press-On Set — Long', 'Nails', 'A custom long press-on nail set made to the approved design.', '', 'fixed', 1, 0, 'pressOn', '["inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-press-long', 5500, 5500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-press-long' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-press-long', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-press-long' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-press-extra-long', 'press-extra-long', 'Custom Press-On Set — Extra Long', 'Nails', 'An extra-long custom press-on set priced by design complexity.', '', 'range', 1, 0, 'pressOn', '["inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-press-extra-long', 6500, 8000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-press-extra-long' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-press-extra-long', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-press-extra-long' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-press-premade', 'press-premade', 'Premade Press-On Set', 'Nails', 'A ready-designed press-on set selected from available options.', '', 'range', 1, 0, 'pressOn', '["inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-press-premade', 2000, 4000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-press-premade' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-press-premade', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-press-premade' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-manicure', 'manicure', 'Manicure', 'Nails', 'A professional manicure finished to the selected preferences.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-manicure', 3000, 4500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-manicure' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-manicure', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-manicure' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-pedicure', 'pedicure', 'Pedicure', 'Nails', 'A professional pedicure finished to the selected preferences.', '', 'range', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-pedicure', 4500, 6500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-pedicure' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-pedicure', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-pedicure' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-basic-glam', 'basic-glam', 'BBK Basic Glam', 'Makeup', 'A polished basic-glam makeup application.', '', 'fixed', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-basic-glam', 6500, 6500, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-basic-glam' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-basic-glam', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-basic-glam' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-full-glam', 'full-glam', 'BBK Full Glam', 'Makeup', 'A full-glam makeup application with a more defined finish.', '', 'fixed', 1, 0, NULL, '[]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-full-glam', 9000, 9000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-full-glam' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-full-glam', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-full-glam' AND effective_to IS NULL);

INSERT INTO services (id, slug, name, category, description, notice, price_type, is_active, is_featured, questionnaire_type, required_upload_types)
VALUES ('svc-wedding-glam', 'wedding-glam', 'BBK Wedding Glam', 'Makeup', 'A wedding makeup request reviewed for the look, location, schedule, party size, and trial needs.', 'Wedding pricing may depend on the requested look, location, schedule, trial session, number of people, and other event requirements.', 'consultation', 1, 0, 'wedding', '["inspiration"]')
ON CONFLICT(id) DO NOTHING;
INSERT INTO service_prices (service_id, minimum_price_cents, maximum_price_cents, starting_price_cents)
SELECT 'svc-wedding-glam', 15000, 25000, NULL
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_id = 'svc-wedding-glam' AND effective_to IS NULL);
INSERT INTO service_durations (service_id, duration_minutes)
SELECT 'svc-wedding-glam', 120
WHERE NOT EXISTS (SELECT 1 FROM service_durations WHERE service_id = 'svc-wedding-glam' AND effective_to IS NULL);

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-shampoo', 'shampoo', 'Shampoo', 'Professional cleansing service.', 'range', 1500, 2000, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-deep-conditioning', 'deep-conditioning', 'Deep Conditioning Treatment', 'Conditioning treatment selected for the client’s needs.', 'range', 2000, 3000, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-trim', 'trim', 'Trim', 'A basic maintenance trim.', 'range', 1500, 2500, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-finish', 'finish', 'Curling or Flat-Iron Finish', 'A curling or flat-iron finish.', 'range', 1500, 2000, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-hair-included', 'hair-included', 'Hair Included', 'The final hair cost depends on the style, brand, color, length, quantity, and current product price.', 'starting', 4000, NULL, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-extra-length', 'extra-length', 'Extra Length', 'Additional length beyond the standard service.', 'range', 2000, 5000, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-extra-thickness', 'extra-thickness', 'Extra Thickness', 'Additional time and work for extra thickness.', 'range', 2000, 4000, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-same-day', 'same-day', 'Same-Day Appointment', 'Approved same-day appointment request.', 'fixed', 2500, 2500, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-before-hours', 'before-hours', 'Before-Hours Appointment', 'Approved appointment before regular hours.', 'range', 3500, 5000, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO add_ons (id, slug, name, description, price_type, minimum_price_cents, maximum_price_cents, is_active)
VALUES ('ao-after-hours', 'after-hours', 'After-Hours Appointment', 'Approved appointment after regular hours.', 'range', 3500, 5000, 1)
ON CONFLICT(id) DO NOTHING;

INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-silk-press', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-twist-out', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-perm-rod', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-flexi-rod', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-go', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-twists', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-mini-braids', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wash-blowout-trim', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-miracle-knots', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-soft-locs', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-man-braids', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-color', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-color-touch-up', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-style', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-closure', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-quick-weave-leave-out', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-slick-ponytail', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-braided-ponytail', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-install', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wig-construction', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-short', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-medium', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-long', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-extra-long', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-press-premade', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-manicure', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-pedicure', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-basic-glam', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-full-glam', 'ao-after-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-shampoo');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-deep-conditioning');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-trim');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-finish');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-hair-included');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-extra-length');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-extra-thickness');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-same-day');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-before-hours');
INSERT OR IGNORE INTO service_add_ons (service_id, add_on_id) VALUES ('svc-wedding-glam', 'ao-after-hours');

INSERT OR IGNORE INTO deposit_rules (id, name, minimum_total_cents, maximum_total_cents, deposit_cents) VALUES
  ('deposit-under-100', 'Under $100', 0, 10000, 2500),
  ('deposit-under-180', '$100–$179.99', 10000, 18000, 4000),
  ('deposit-180-plus', '$180 or more', 18000, NULL, 5000);

INSERT OR IGNORE INTO promotions (id, name, banner_text, is_active, show_badges)
VALUES ('grand-opening-special', 'Grand Opening Special', 'Grand-opening pricing is available for a limited time and may not be combined with other discounts.', 0, 1);

INSERT OR IGNORE INTO promotion_services (promotion_id, service_id, promotional_price_cents) VALUES
  ('grand-opening-special', 'svc-silk-press', 6500),
  ('grand-opening-special', 'svc-quick-weave-style', 6500),
  ('grand-opening-special', 'svc-basic-glam', 5500),
  ('grand-opening-special', 'svc-wig-install', 8500);

INSERT OR IGNORE INTO weekly_availability (weekday, is_working_day, opens_at, closes_at, requires_owner_review) VALUES
  (0, 0, NULL, NULL, 1),
  (1, 0, NULL, NULL, 1),
  (2, 1, '17:30', '21:00', 1),
  (3, 1, '17:30', '21:00', 1),
  (4, 1, '17:30', '21:00', 1),
  (5, 1, '17:00', '21:00', 1),
  (6, 1, '08:00', '18:00', 1);

INSERT OR IGNORE INTO appointment_buffers (id, before_minutes, after_minutes, minimum_notice_hours, maximum_booking_window_days, maximum_appointments_per_day, requires_owner_review)
VALUES ('default', 0, 30, 24, 60, 6, 1);

INSERT OR IGNORE INTO policy_versions (id, version_label, policy_json, is_current, published_at) VALUES (
  'policy-bbk-2026-07-26',
  'BBK-2026-07-26',
  '{"deposit":"A non-refundable deposit of $25–$50 is required to reserve an appointment. The deposit amount is based on the selected service and is applied toward the final service balance.","late":"A $15 late fee applies when a client arrives more than 15 minutes late. Depending on the schedule and service length, the appointment may need to be shortened, rescheduled, or canceled.","noShow":"Clients who fail to attend an appointment without proper notice will forfeit their deposit. Future appointments may require a new deposit or additional payment requirements.","balance":"The remaining service balance is due at the end of the appointment unless Kia provides different written instructions.","cancellation":"Contact Kia as soon as possible if an appointment must be changed or canceled.","rescheduling":"Rescheduling is subject to Kia’s approval and availability.","preparation":"Follow the preparation instructions for the selected service. Unplanned work may affect the final confirmed price.","guests":"Please do not bring extra guests or children unless approved before the appointment.","satisfaction":"Contact Beauty by Kia promptly with any service concern so Kia can review it."}',
  1,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO application_settings (setting_key, setting_value) VALUES
  ('business_name', 'Beauty by Kia'),
  ('business_phone', '501-522-0061'),
  ('draft_label', 'Draft Review — Not Yet Live'),
  ('app_environment', 'production'),
  ('local_storage_fallback', 'false'),
  ('payments_enabled', 'false'),
  ('payment_provider', 'none'),
  ('communications_enabled', 'false'),
  ('timezone', 'America/Chicago'),
  ('initial_admin_setup_complete', 'false');


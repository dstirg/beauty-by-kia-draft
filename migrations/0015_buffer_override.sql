ALTER TABLE bookings ADD COLUMN buffer_override_approved_at TEXT;
ALTER TABLE bookings ADD COLUMN buffer_override_approved_by_admin_id TEXT REFERENCES admin_accounts(id) ON DELETE RESTRICT;

INSERT INTO application_settings (setting_key, setting_value, is_sensitive) VALUES
  ('cash_app_handle', '$beautybybrookia', 1),
  ('zelle_contact', '', 1),
  ('deposit_instructions', 'After Kia approves a request, she will provide Cash App deposit instructions. A payment is not recorded until Kia verifies it.', 0)
ON CONFLICT(setting_key) DO UPDATE SET
  setting_value=excluded.setting_value,
  is_sensitive=excluded.is_sensitive,
  updated_at=CURRENT_TIMESTAMP;

CREATE TRIGGER bookings_prevent_overlap_insert_v2
BEFORE INSERT ON bookings
WHEN NEW.status IN ('awaiting_deposit','confirmed')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings existing
    WHERE existing.status IN ('awaiting_deposit','confirmed')
      AND existing.archived_at IS NULL
      AND (
        (NEW.buffer_override_approved_at IS NULL
          AND existing.buffered_start_at < NEW.buffered_end_at
          AND existing.buffered_end_at > NEW.buffered_start_at)
        OR
        (NEW.buffer_override_approved_at IS NOT NULL
          AND existing.appointment_start_at < NEW.appointment_end_at
          AND existing.appointment_end_at > NEW.appointment_start_at)
      )
  ) THEN RAISE(ABORT, 'appointment time is no longer available') END;
END;

CREATE TRIGGER bookings_prevent_overlap_update_v2
BEFORE UPDATE OF status, appointment_start_at, appointment_end_at, buffered_start_at, buffered_end_at, buffer_override_approved_at ON bookings
WHEN NEW.status IN ('awaiting_deposit','confirmed')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings existing
    WHERE existing.id <> NEW.id
      AND existing.status IN ('awaiting_deposit','confirmed')
      AND existing.archived_at IS NULL
      AND (
        (NEW.buffer_override_approved_at IS NULL
          AND existing.buffered_start_at < NEW.buffered_end_at
          AND existing.buffered_end_at > NEW.buffered_start_at)
        OR
        (NEW.buffer_override_approved_at IS NOT NULL
          AND existing.appointment_start_at < NEW.appointment_end_at
          AND existing.appointment_end_at > NEW.appointment_start_at)
      )
  ) THEN RAISE(ABORT, 'appointment time is no longer available') END;
END;

DROP TRIGGER IF EXISTS bookings_prevent_overlap_insert;
DROP TRIGGER IF EXISTS bookings_prevent_overlap_update;

-- Owner-approved operating schedule, manual deposit workflow, communications
-- foundation, and private-photo retention policy.

UPDATE weekly_availability
SET is_working_day = CASE WHEN weekday BETWEEN 2 AND 6 THEN 1 ELSE 0 END,
    opens_at = CASE
      WHEN weekday BETWEEN 2 AND 5 THEN '18:00'
      WHEN weekday = 6 THEN '08:00'
      ELSE NULL
    END,
    closes_at = CASE
      WHEN weekday BETWEEN 2 AND 5 THEN '21:00'
      WHEN weekday = 6 THEN '18:00'
      ELSE NULL
    END,
    requires_owner_review = 0,
    updated_at = CURRENT_TIMESTAMP;

UPDATE appointment_buffers
SET maximum_appointments_per_day = 2,
    requires_owner_review = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'default';

ALTER TABLE bookings ADD COLUMN sms_consent_at TEXT;
ALTER TABLE bookings ADD COLUMN deposit_method TEXT;
ALTER TABLE bookings ADD COLUMN deposit_requested_at TEXT;
ALTER TABLE bookings ADD COLUMN deposit_received_at TEXT;

CREATE TABLE IF NOT EXISTS communication_outbox (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms')),
  message_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  body_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_provider' CHECK (status IN (
    'pending_provider','queued','sent','failed','cancelled'
  )),
  provider_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code TEXT,
  scheduled_for TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_communication_outbox_status
  ON communication_outbox(status, scheduled_for, created_at);
CREATE INDEX IF NOT EXISTS idx_communication_outbox_booking
  ON communication_outbox(booking_id, created_at);

CREATE TABLE IF NOT EXISTS payment_status_history (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  payment_method TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  changed_by_admin_id TEXT,
  private_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  FOREIGN KEY (changed_by_admin_id) REFERENCES admin_accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_status_history_booking
  ON payment_status_history(booking_id, created_at);

INSERT INTO application_settings (setting_key, setting_value, is_sensitive) VALUES
  ('sunday_request_only', 'true', 0),
  ('sunday_surcharge_cents', '5000', 0),
  ('private_upload_retention_days', '90', 0),
  ('private_upload_retention_approved', 'true', 0),
  ('manual_deposits_enabled', 'true', 0),
  ('payment_provider', 'manual_offsite', 0),
  ('cash_app_handle', '', 1),
  ('zelle_contact', '', 1),
  ('deposit_instructions', 'Kia will send approved Cash App or Zelle instructions after reviewing the appointment request. A payment is not recorded until Kia verifies it.', 0),
  ('stripe_available_later', 'true', 0),
  ('sms_automation_requested', 'true', 0),
  ('sms_provider', 'none', 0),
  ('sms_live_enabled', 'false', 0),
  ('sms_consent_required', 'true', 0)
ON CONFLICT(setting_key) DO UPDATE SET
  setting_value = excluded.setting_value,
  is_sensitive = excluded.is_sensitive,
  updated_at = CURRENT_TIMESTAMP;

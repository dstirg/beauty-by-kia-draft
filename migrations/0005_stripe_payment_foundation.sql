PRAGMA foreign_keys = ON;

-- Stripe-ready records only. Payments remain disabled until owner credentials are connected.
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe','manual')),
  purpose TEXT NOT NULL DEFAULT 'deposit' CHECK (purpose IN ('deposit','remaining_balance')),
  idempotency_key_hash TEXT NOT NULL UNIQUE,
  provider_payment_intent_id TEXT UNIQUE,
  provider_checkout_session_id TEXT UNIQUE,
  provider_charge_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created','requires_payment_method','processing','succeeded','failed',
    'refunding','partially_refunded','refunded','cancelled'
  )),
  receipt_url TEXT,
  failure_code TEXT,
  paid_at TEXT,
  failed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking
  ON payment_transactions(booking_id, created_at);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
  ON payment_transactions(status, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_succeeded_deposit_per_booking
  ON payment_transactions(booking_id, purpose)
  WHERE purpose = 'deposit' AND status = 'succeeded';

CREATE TABLE IF NOT EXISTS payment_refunds (
  id TEXT PRIMARY KEY,
  payment_transaction_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  provider_refund_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested','pending','succeeded','failed','cancelled'
  )),
  reason_code TEXT NOT NULL DEFAULT '',
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  failed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_booking
  ON payment_refunds(booking_id, created_at);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  provider_event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider = 'stripe'),
  event_type TEXT NOT NULL,
  provider_object_id TEXT,
  livemode INTEGER NOT NULL DEFAULT 0 CHECK (livemode IN (0,1)),
  payload_sha256 TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN (
    'received','processed','ignored','failed'
  )),
  error_code TEXT,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status
  ON payment_webhook_events(processing_status, received_at);

INSERT INTO application_settings (setting_key, setting_value, is_sensitive)
VALUES
  ('stripe_checkout_enabled', 'false', 0),
  ('stripe_charge_timing', 'before_approval', 0),
  ('stripe_refund_on_decline', 'true', 0),
  ('stripe_currency', 'usd', 0)
ON CONFLICT(setting_key) DO UPDATE SET
  setting_value = excluded.setting_value,
  is_sensitive = excluded.is_sensitive,
  updated_at = CURRENT_TIMESTAMP;

-- A paid request temporarily holds its full appointment window while Kia reviews it.
DROP INDEX IF EXISTS idx_bookings_appointment_range;
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_range
  ON bookings(buffered_start_at, buffered_end_at)
  WHERE status IN ('awaiting_deposit','confirmed')
     OR (status = 'pending_review' AND payment_status = 'deposit_paid');

DROP TRIGGER IF EXISTS bookings_prevent_overlap_insert;
CREATE TRIGGER bookings_prevent_overlap_insert
BEFORE INSERT ON bookings
WHEN NEW.status IN ('awaiting_deposit','confirmed')
  OR (NEW.status = 'pending_review' AND NEW.payment_status = 'deposit_paid')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings existing
    WHERE (
        existing.status IN ('awaiting_deposit','confirmed')
        OR (existing.status = 'pending_review' AND existing.payment_status = 'deposit_paid')
      )
      AND existing.archived_at IS NULL
      AND existing.buffered_start_at < NEW.buffered_end_at
      AND existing.buffered_end_at > NEW.buffered_start_at
  ) THEN RAISE(ABORT, 'appointment time is no longer available') END;
END;

DROP TRIGGER IF EXISTS bookings_prevent_overlap_update;
CREATE TRIGGER bookings_prevent_overlap_update
BEFORE UPDATE OF status, payment_status, buffered_start_at, buffered_end_at ON bookings
WHEN NEW.status IN ('awaiting_deposit','confirmed')
  OR (NEW.status = 'pending_review' AND NEW.payment_status = 'deposit_paid')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings existing
    WHERE existing.id <> NEW.id
      AND (
        existing.status IN ('awaiting_deposit','confirmed')
        OR (existing.status = 'pending_review' AND existing.payment_status = 'deposit_paid')
      )
      AND existing.archived_at IS NULL
      AND existing.buffered_start_at < NEW.buffered_end_at
      AND existing.buffered_end_at > NEW.buffered_start_at
  ) THEN RAISE(ABORT, 'appointment time is no longer available') END;
END;

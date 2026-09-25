PRAGMA foreign_keys = ON;

-- Safety answers remain in client_intake_json. These indexed booking fields make
-- review-required requests visible without parsing client-provided JSON in lists.
ALTER TABLE bookings ADD COLUMN safety_review_status TEXT NOT NULL DEFAULT 'not_required'
  CHECK (safety_review_status IN ('not_required', 'needs_review', 'reviewed'));
ALTER TABLE bookings ADD COLUMN safety_alert_summary TEXT;
ALTER TABLE bookings ADD COLUMN safety_reviewed_at TEXT;
ALTER TABLE bookings ADD COLUMN safety_reviewed_by_admin_id TEXT REFERENCES admin_accounts(id);

CREATE INDEX IF NOT EXISTS idx_bookings_safety_review
  ON bookings(safety_review_status, requested_start_at);

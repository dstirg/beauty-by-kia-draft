PRAGMA foreign_keys = ON;

-- Future verified payment processing inserts every 15-minute segment of the
-- full appointment and buffer window in the same D1 batch as the payment update.
-- The primary key makes the first successfully paid request win each segment.
CREATE TABLE IF NOT EXISTS booking_slot_locks (
  slot_start_at TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  lock_reason TEXT NOT NULL DEFAULT 'paid_request' CHECK (lock_reason IN ('paid_request','approved')),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_booking_slot_locks_booking
  ON booking_slot_locks(booking_id, slot_start_at);

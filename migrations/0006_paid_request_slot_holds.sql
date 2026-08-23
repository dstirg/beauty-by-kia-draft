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

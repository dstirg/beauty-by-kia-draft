PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  notice TEXT NOT NULL DEFAULT '',
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed','range','starting','consultation')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  questionnaire_type TEXT,
  required_upload_types TEXT NOT NULL DEFAULT '[]',
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  minimum_price_cents INTEGER NOT NULL CHECK (minimum_price_cents >= 0),
  maximum_price_cents INTEGER CHECK (maximum_price_cents IS NULL OR maximum_price_cents >= minimum_price_cents),
  starting_price_cents INTEGER CHECK (starting_price_cents IS NULL OR starting_price_cents >= 0),
  effective_from TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  UNIQUE (service_id, effective_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_prices_current
  ON service_prices(service_id) WHERE effective_to IS NULL;

CREATE TABLE IF NOT EXISTS service_durations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 1440),
  effective_from TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  UNIQUE (service_id, effective_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_durations_current
  ON service_durations(service_id) WHERE effective_to IS NULL;

CREATE TABLE IF NOT EXISTS add_ons (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed','range','starting','consultation')),
  minimum_price_cents INTEGER NOT NULL CHECK (minimum_price_cents >= 0),
  maximum_price_cents INTEGER CHECK (maximum_price_cents IS NULL OR maximum_price_cents >= minimum_price_cents),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_add_ons (
  service_id TEXT NOT NULL,
  add_on_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (service_id, add_on_id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deposit_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  minimum_total_cents INTEGER NOT NULL CHECK (minimum_total_cents >= 0),
  maximum_total_cents INTEGER CHECK (maximum_total_cents IS NULL OR maximum_total_cents > minimum_total_cents),
  deposit_cents INTEGER NOT NULL CHECK (deposit_cents >= 0),
  consultation_required_deposit_cents INTEGER NOT NULL DEFAULT 0 CHECK (consultation_required_deposit_cents >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (minimum_total_cents, maximum_total_cents)
);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  banner_text TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'service_price' CHECK (discount_type IN ('service_price','fixed','percentage')),
  discount_value INTEGER NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  show_badges INTEGER NOT NULL DEFAULT 1 CHECK (show_badges IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS promotion_services (
  promotion_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  promotional_price_cents INTEGER CHECK (promotional_price_cents IS NULL OR promotional_price_cents >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (promotion_id, service_id),
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_availability (
  weekday INTEGER PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  is_working_day INTEGER NOT NULL DEFAULT 0 CHECK (is_working_day IN (0,1)),
  opens_at TEXT,
  closes_at TEXT,
  requires_owner_review INTEGER NOT NULL DEFAULT 1 CHECK (requires_owner_review IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (is_working_day = 0 OR (opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at))
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id TEXT PRIMARY KEY,
  blocked_date TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'blocked' CHECK (block_type IN ('blocked','vacation')),
  reason TEXT NOT NULL DEFAULT '',
  archived_at TEXT,
  created_by_admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_admin_id) REFERENCES admin_accounts(id) ON DELETE SET NULL,
  UNIQUE (blocked_date, block_type)
);

CREATE TABLE IF NOT EXISTS calendar_blocks (
  id TEXT PRIMARY KEY,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  archived_at TEXT,
  created_by_admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_admin_id) REFERENCES admin_accounts(id) ON DELETE SET NULL,
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_range ON calendar_blocks(starts_at, ends_at) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS appointment_buffers (
  id TEXT PRIMARY KEY,
  before_minutes INTEGER NOT NULL DEFAULT 0 CHECK (before_minutes BETWEEN 0 AND 240),
  after_minutes INTEGER NOT NULL DEFAULT 30 CHECK (after_minutes BETWEEN 0 AND 240),
  minimum_notice_hours INTEGER NOT NULL DEFAULT 24 CHECK (minimum_notice_hours BETWEEN 0 AND 8760),
  maximum_booking_window_days INTEGER NOT NULL DEFAULT 60 CHECK (maximum_booking_window_days BETWEEN 1 AND 730),
  maximum_appointments_per_day INTEGER NOT NULL DEFAULT 6 CHECK (maximum_appointments_per_day BETWEEN 1 AND 50),
  requires_owner_review INTEGER NOT NULL DEFAULT 1 CHECK (requires_owner_review IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
    'pending_review','awaiting_deposit','confirmed','completed','reschedule_requested',
    'cancelled_by_client','cancelled_by_brookia','declined','no_show','time_unavailable'
  )),
  payment_status TEXT NOT NULL DEFAULT 'deposit_not_requested' CHECK (payment_status IN (
    'deposit_not_requested','deposit_requested','deposit_pending','deposit_paid',
    'deposit_failed','deposit_refunded'
  )),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  preferred_contact TEXT NOT NULL DEFAULT 'email',
  customer_notes TEXT NOT NULL DEFAULT '',
  private_admin_note TEXT NOT NULL DEFAULT '',
  customer_message TEXT NOT NULL DEFAULT '',
  requested_start_at TEXT NOT NULL,
  proposed_start_at TEXT,
  appointment_start_at TEXT,
  appointment_end_at TEXT,
  buffered_start_at TEXT,
  buffered_end_at TEXT,
  estimated_total_cents INTEGER NOT NULL CHECK (estimated_total_cents >= 0),
  deposit_cents INTEGER NOT NULL DEFAULT 0 CHECK (deposit_cents >= 0),
  remaining_balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (remaining_balance_cents >= 0),
  approved_final_total_cents INTEGER CHECK (approved_final_total_cents IS NULL OR approved_final_total_cents >= 0),
  approved_at TEXT,
  cancelled_at TEXT,
  declined_at TEXT,
  completed_at TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (status NOT IN ('awaiting_deposit','confirmed')) OR
    (appointment_start_at IS NOT NULL AND appointment_end_at IS NOT NULL AND buffered_start_at IS NOT NULL AND buffered_end_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status, requested_start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_range ON bookings(buffered_start_at, buffered_end_at) WHERE status IN ('awaiting_deposit','confirmed');
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email, created_at);

CREATE TABLE IF NOT EXISTS booking_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name_snapshot TEXT NOT NULL,
  price_type_snapshot TEXT NOT NULL,
  minimum_price_cents_snapshot INTEGER NOT NULL,
  maximum_price_cents_snapshot INTEGER,
  duration_minutes_snapshot INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  UNIQUE (booking_id, service_id)
);

CREATE TABLE IF NOT EXISTS booking_add_ons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  add_on_id TEXT NOT NULL,
  add_on_name_snapshot TEXT NOT NULL,
  price_type_snapshot TEXT NOT NULL,
  minimum_price_cents_snapshot INTEGER NOT NULL,
  maximum_price_cents_snapshot INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE RESTRICT,
  UNIQUE (booking_id, add_on_id)
);

CREATE TABLE IF NOT EXISTS booking_price_snapshots (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USD',
  service_price_cents INTEGER NOT NULL,
  add_ons_total_cents INTEGER NOT NULL,
  estimated_total_cents INTEGER NOT NULL,
  deposit_cents INTEGER NOT NULL,
  remaining_balance_cents INTEGER NOT NULL,
  approved_final_total_cents INTEGER,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  customer_reason TEXT NOT NULL DEFAULT '',
  private_admin_note TEXT NOT NULL DEFAULT '',
  changed_by_admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  FOREIGN KEY (changed_by_admin_id) REFERENCES admin_accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_history_booking ON booking_status_history(booking_id, created_at);

CREATE TABLE IF NOT EXISTS policy_versions (
  id TEXT PRIMARY KEY,
  version_label TEXT NOT NULL UNIQUE,
  policy_json TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0,1)),
  published_at TEXT,
  archived_at TEXT,
  created_by_admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_admin_id) REFERENCES admin_accounts(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_one_current ON policy_versions(is_current) WHERE is_current = 1;

CREATE TABLE IF NOT EXISTS policy_acceptances (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  policy_version_id TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  acceptance_ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  FOREIGN KEY (policy_version_id) REFERENCES policy_versions(id) ON DELETE RESTRICT,
  UNIQUE (booking_id, policy_version_id)
);

CREATE TABLE IF NOT EXISTS admin_accounts (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pin_salt TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  pin_iterations INTEGER NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  pin_changed_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_one_primary ON admin_accounts(is_primary) WHERE is_primary = 1;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_account_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_account_id) REFERENCES admin_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(token_hash, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  was_successful INTEGER NOT NULL DEFAULT 0 CHECK (was_successful IN (0,1)),
  failure_category TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_window ON login_attempts(email_hash, ip_hash, created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_account_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_account_id) REFERENCES admin_accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_action_time ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_admin_time ON audit_logs(admin_account_id, created_at);

CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_sha256 TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  caption TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0,1)),
  archived_at TEXT,
  created_by_admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by_admin_id) REFERENCES admin_accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_gallery_public ON gallery_images(service_id, is_published, sort_order) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gallery_featured ON gallery_images(service_id) WHERE is_featured = 1 AND archived_at IS NULL;

CREATE TABLE IF NOT EXISTS private_upload_metadata (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  object_key TEXT NOT NULL UNIQUE,
  upload_type TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  retention_delete_after TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_private_upload_booking ON private_upload_metadata(booking_id, created_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_private_upload_duplicate ON private_upload_metadata(booking_id, content_sha256) WHERE booking_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS application_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  is_sensitive INTEGER NOT NULL DEFAULT 0 CHECK (is_sensitive IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS booking_price_snapshots_immutable_update
BEFORE UPDATE ON booking_price_snapshots
BEGIN
  SELECT RAISE(ABORT, 'booking price snapshots are immutable');
END;

CREATE TRIGGER IF NOT EXISTS booking_price_snapshots_immutable_delete
BEFORE DELETE ON booking_price_snapshots
BEGIN
  SELECT RAISE(ABORT, 'booking price snapshots cannot be deleted');
END;

CREATE TRIGGER IF NOT EXISTS bookings_preserve_history
BEFORE DELETE ON bookings
BEGIN
  SELECT RAISE(ABORT, 'bookings must be archived, not deleted');
END;

CREATE TRIGGER IF NOT EXISTS bookings_prevent_overlap_insert
BEFORE INSERT ON bookings
WHEN NEW.status IN ('awaiting_deposit','confirmed')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings existing
    WHERE existing.status IN ('awaiting_deposit','confirmed')
      AND existing.archived_at IS NULL
      AND existing.buffered_start_at < NEW.buffered_end_at
      AND existing.buffered_end_at > NEW.buffered_start_at
  ) THEN RAISE(ABORT, 'appointment time is no longer available') END;
END;

CREATE TRIGGER IF NOT EXISTS bookings_prevent_overlap_update
BEFORE UPDATE OF status, buffered_start_at, buffered_end_at ON bookings
WHEN NEW.status IN ('awaiting_deposit','confirmed')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM bookings existing
    WHERE existing.id <> NEW.id
      AND existing.status IN ('awaiting_deposit','confirmed')
      AND existing.archived_at IS NULL
      AND existing.buffered_start_at < NEW.buffered_end_at
      AND existing.buffered_end_at > NEW.buffered_start_at
  ) THEN RAISE(ABORT, 'appointment time is no longer available') END;
END;

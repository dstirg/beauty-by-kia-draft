PRAGMA foreign_keys = ON;

-- Preserve every service-specific customer answer without changing or deleting
-- any existing booking. Earlier rows receive an empty JSON object.
ALTER TABLE bookings ADD COLUMN client_intake_json TEXT NOT NULL DEFAULT '{}';

-- A recovery token is one-use. Only its SHA-256 hash is recorded; the token and
-- replacement PIN remain in Cloudflare encrypted secrets / owner memory only.
CREATE TABLE IF NOT EXISTS admin_recovery_uses (
  recovery_token_hash TEXT PRIMARY KEY,
  admin_account_id TEXT NOT NULL,
  used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  FOREIGN KEY (admin_account_id) REFERENCES admin_accounts(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_admin_recovery_uses_admin
  ON admin_recovery_uses(admin_account_id, used_at);


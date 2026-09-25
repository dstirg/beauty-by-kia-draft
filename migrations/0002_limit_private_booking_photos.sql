ALTER TABLE private_upload_metadata ADD COLUMN claim_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_private_upload_claim
ON private_upload_metadata(claim_token_hash, booking_id)
WHERE claim_token_hash IS NOT NULL AND booking_id IS NULL AND deleted_at IS NULL;

ALTER TABLE event_guests
  ADD COLUMN IF NOT EXISTS session_expires_at DATETIME NULL;

UPDATE event_guests
SET session_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
WHERE session_expires_at IS NULL;

ALTER TABLE event_guests
  MODIFY COLUMN session_expires_at DATETIME NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_guests_session_expiry
  ON event_guests (session_expires_at);

ALTER TABLE event_guests
  ADD COLUMN email VARCHAR(255) NULL AFTER name,
  ADD UNIQUE KEY uq_event_guests_event_email (event_id, email);

CREATE TABLE guest_otp_challenges (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id INT UNSIGNED NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  consumed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_guest_otp_event_email_created (event_id, email, created_at),
  CONSTRAINT fk_guest_otp_challenges_event
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

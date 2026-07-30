ALTER TABLE events
  ADD COLUMN quiz_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN quiz_title VARCHAR(150) NULL,
  ADD COLUMN quiz_questions JSON NULL;

CREATE TABLE event_quiz_attempts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id INT UNSIGNED NOT NULL,
  guest_id INT UNSIGNED NOT NULL,
  score INT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  answers JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quiz_attempt_event (event_id, created_at),
  KEY idx_quiz_attempt_guest (guest_id),
  CONSTRAINT fk_quiz_attempt_event FOREIGN KEY (event_id)
    REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_attempt_guest FOREIGN KEY (guest_id)
    REFERENCES event_guests (id) ON DELETE CASCADE
);

ALTER TABLE events
  ADD COLUMN quiz_has_correct_answers BOOLEAN NOT NULL DEFAULT TRUE
  AFTER quiz_enabled;

DELETE duplicate_attempt
FROM event_quiz_attempts AS duplicate_attempt
INNER JOIN event_quiz_attempts AS first_attempt
  ON duplicate_attempt.event_id = first_attempt.event_id
  AND duplicate_attempt.guest_id = first_attempt.guest_id
  AND duplicate_attempt.id > first_attempt.id;

ALTER TABLE event_quiz_attempts
  ADD CONSTRAINT uq_quiz_attempt_event_guest UNIQUE (event_id, guest_id);

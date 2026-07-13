ALTER TABLE `events`
  ADD COLUMN `public_id` CHAR(36) NOT NULL AFTER `id`,
  ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `location`,
  ADD CONSTRAINT `uq_events_public_id` UNIQUE (`public_id`),
  ADD INDEX `idx_events_active_start` (`is_active`, `start_at`);

CREATE TABLE `event_guests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `session_token_hash` CHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `uq_event_guests_session_token_hash`
    UNIQUE (`session_token_hash`),
  INDEX `idx_event_guests_event_id` (`event_id`),
  INDEX `idx_event_guests_event_created` (`event_id`, `created_at`),
  CONSTRAINT `fk_event_guests_event`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `event_images`
  ADD COLUMN `guest_id` INT UNSIGNED NULL AFTER `event_id`,
  ADD INDEX `idx_event_images_guest_id` (`guest_id`),
  ADD CONSTRAINT `fk_event_images_guest`
    FOREIGN KEY (`guest_id`) REFERENCES `event_guests` (`id`)
    ON DELETE SET NULL
    ON UPDATE RESTRICT;

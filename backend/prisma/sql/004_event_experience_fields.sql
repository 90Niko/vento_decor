ALTER TABLE `events`
  ADD COLUMN `event_type` VARCHAR(40) NOT NULL DEFAULT 'other' AFTER `location`,
  ADD COLUMN `upload_deadline` DATETIME NULL AFTER `event_type`,
  ADD COLUMN `cover_image_url` TEXT NULL AFTER `upload_deadline`,
  ADD COLUMN `cover_image_public_id` VARCHAR(255) NULL AFTER `cover_image_url`;

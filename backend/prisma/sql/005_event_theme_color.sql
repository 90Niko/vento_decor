ALTER TABLE `events`
  ADD COLUMN `theme_color` VARCHAR(30) NOT NULL DEFAULT 'ocean'
  AFTER `cover_image_public_id`;

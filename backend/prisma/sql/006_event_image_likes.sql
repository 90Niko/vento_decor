CREATE TABLE `event_image_likes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `image_id` INT UNSIGNED NOT NULL,
  `guest_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `uq_event_image_likes_image_guest` UNIQUE (`image_id`, `guest_id`),
  INDEX `idx_event_image_likes_image` (`image_id`),
  INDEX `idx_event_image_likes_guest` (`guest_id`),
  CONSTRAINT `fk_event_image_likes_image`
    FOREIGN KEY (`image_id`) REFERENCES `event_images` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_image_likes_guest`
    FOREIGN KEY (`guest_id`) REFERENCES `event_guests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

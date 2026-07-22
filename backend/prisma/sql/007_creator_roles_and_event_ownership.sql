ALTER TABLE creators
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'CREATOR',
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE creators
SET role = 'ADMIN'
WHERE id = (SELECT first_creator.id FROM (SELECT MIN(id) AS id FROM creators) AS first_creator);

ALTER TABLE events ADD COLUMN creator_id INT UNSIGNED NULL;

UPDATE events
SET creator_id = (SELECT first_creator.id FROM (SELECT MIN(id) AS id FROM creators) AS first_creator)
WHERE creator_id IS NULL;

ALTER TABLE events
  ADD INDEX idx_events_creator_id (creator_id),
  ADD CONSTRAINT fk_events_creator
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE SET NULL;

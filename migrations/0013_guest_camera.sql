CREATE TABLE guest_photos (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 6291456),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX guest_photos_wedding_event_idx ON guest_photos (wedding_id, event_id, created_at);
CREATE INDEX guest_photos_guest_idx ON guest_photos (wedding_id, guest_id, created_at);

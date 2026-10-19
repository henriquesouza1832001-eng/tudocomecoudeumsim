CREATE TABLE guest_wall_messages (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL CHECK (length(author_name) BETWEEN 1 AND 80),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX guest_wall_messages_wedding_status_created_idx ON guest_wall_messages (wedding_id, status, created_at DESC);

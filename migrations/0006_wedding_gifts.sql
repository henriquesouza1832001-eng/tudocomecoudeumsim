CREATE TABLE gifts (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('fixed', 'custom')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  amount_cents INTEGER CHECK (amount_cents IS NULL OR amount_cents > 0),
  goal_cents INTEGER CHECK (goal_cents IS NULL OR goal_cents > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((gift_type = 'fixed' AND amount_cents IS NOT NULL) OR (gift_type = 'custom' AND amount_cents IS NULL))
);

CREATE INDEX gifts_wedding_status_order_idx ON gifts (wedding_id, status, display_order, created_at);

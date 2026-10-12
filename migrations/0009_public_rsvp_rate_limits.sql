CREATE TABLE public_request_limits (
  identifier_hash TEXT PRIMARY KEY NOT NULL,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  blocked_until INTEGER
);

CREATE INDEX public_request_limits_guest_idx
ON public_request_limits (guest_id);

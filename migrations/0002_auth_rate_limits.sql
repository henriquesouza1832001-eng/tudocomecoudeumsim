CREATE TABLE auth_rate_limits (
  identifier_hash TEXT PRIMARY KEY NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  blocked_until INTEGER
);

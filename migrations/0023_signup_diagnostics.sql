CREATE TABLE signup_diagnostics (
  id TEXT PRIMARY KEY NOT NULL,
  error_code TEXT NOT NULL,
  error_detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_signup_diagnostics_created_at ON signup_diagnostics(created_at);

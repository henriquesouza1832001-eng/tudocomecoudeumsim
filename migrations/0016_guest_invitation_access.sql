ALTER TABLE guests
ADD COLUMN source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'public_request', 'companion'));

CREATE TABLE wedding_guest_policies (
  wedding_id TEXT PRIMARY KEY NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  companions_allowed INTEGER NOT NULL DEFAULT 0 CHECK (companions_allowed IN (0, 1)),
  max_companions INTEGER NOT NULL DEFAULT 0 CHECK (max_companions BETWEEN 0 AND 19),
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (companions_allowed = 1 OR max_companions = 0)
);

CREATE TABLE guest_event_authorizations (
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('authorized', 'revoked')),
  decided_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  decided_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, guest_id)
);

CREATE TABLE guest_rsvp_requests (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('confirmed', 'declined')),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  request_token_hash TEXT NOT NULL UNIQUE,
  idempotency_hash TEXT NOT NULL,
  guest_id TEXT REFERENCES guests(id) ON DELETE SET NULL,
  decided_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (email IS NOT NULL OR phone IS NOT NULL),
  UNIQUE (wedding_id, idempotency_hash)
);

CREATE TABLE guest_companion_requests (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rsvp_request_id TEXT REFERENCES guest_rsvp_requests(id) ON DELETE CASCADE,
  host_guest_id TEXT REFERENCES guests(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  idempotency_hash TEXT,
  guest_id TEXT UNIQUE REFERENCES guests(id) ON DELETE SET NULL,
  decided_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((rsvp_request_id IS NOT NULL AND host_guest_id IS NULL) OR (rsvp_request_id IS NULL AND host_guest_id IS NOT NULL))
);

CREATE TABLE public_wedding_request_limits (
  identifier_hash TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  blocked_until INTEGER
);

CREATE INDEX guest_event_authorizations_wedding_idx ON guest_event_authorizations (wedding_id, guest_id, status);
CREATE INDEX guest_rsvp_requests_wedding_status_idx ON guest_rsvp_requests (wedding_id, review_status, created_at);
CREATE INDEX guest_companion_requests_host_status_idx ON guest_companion_requests (wedding_id, host_guest_id, status);
CREATE INDEX guest_companion_requests_request_status_idx ON guest_companion_requests (wedding_id, rsvp_request_id, status);
CREATE UNIQUE INDEX guest_companion_requests_host_idempotency_idx ON guest_companion_requests (host_guest_id, idempotency_hash) WHERE host_guest_id IS NOT NULL AND idempotency_hash IS NOT NULL;
CREATE INDEX public_wedding_request_limits_wedding_idx ON public_wedding_request_limits (wedding_id);

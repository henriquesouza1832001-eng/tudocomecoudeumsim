PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
  email_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE platform_admins (
  account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('superadmin')),
  granted_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account_mfa (
  account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  totp_secret_ciphertext TEXT,
  enabled_at TEXT,
  recovery_codes_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  mfa_verified_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE TABLE auth_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset', 'mfa_enrollment')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weddings (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL COLLATE NOCASE UNIQUE,
  owner_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  partner_one_name TEXT NOT NULL DEFAULT '',
  partner_two_name TEXT NOT NULL DEFAULT '',
  event_date TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended', 'completed', 'deleted')),
  site_config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE wedding_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('couple_admin', 'editor', 'reader', 'event_staff', 'checkin_staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked')),
  invited_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (wedding_id, account_id)
);

CREATE TABLE guest_groups (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_type TEXT NOT NULL DEFAULT 'guest' CHECK (group_type IN ('guest', 'godparent', 'family', 'friends', 'other')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (wedding_id, name)
);

CREATE TABLE guests (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES guest_groups(id) ON DELETE SET NULL,
  invited_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  access_token_hash TEXT UNIQUE,
  party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 1 AND 20),
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')),
  dietary_notes TEXT,
  guest_type TEXT NOT NULL DEFAULT 'guest' CHECK (guest_type IN ('guest', 'godparent', 'manual_walk_in')),
  privacy_choice TEXT NOT NULL DEFAULT 'private' CHECK (privacy_choice IN ('private', 'ranking_visible')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'other',
  starts_at TEXT,
  venue_name TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_group_access (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, group_id)
);

CREATE TABLE guest_rsvps (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'declined')),
  party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 1 AND 20),
  dietary_notes TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, guest_id)
);

CREATE TABLE godparent_tasks (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE check_ins (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id TEXT REFERENCES guests(id) ON DELETE SET NULL,
  checked_in_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  manual_name TEXT,
  party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 1 AND 20),
  dietary_notes TEXT,
  checked_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (guest_id IS NOT NULL OR manual_name IS NOT NULL)
);

CREATE TABLE fee_policies (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT REFERENCES weddings(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  rate_basis_points INTEGER NOT NULL DEFAULT 0 CHECK (rate_basis_points BETWEEN 0 AND 10000),
  minimum_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (minimum_fee_cents >= 0),
  maximum_fee_cents INTEGER CHECK (maximum_fee_cents IS NULL OR maximum_fee_cents >= minimum_fee_cents),
  paid_by TEXT NOT NULL DEFAULT 'couple' CHECK (paid_by IN ('couple', 'guest')),
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX fee_policies_platform_unique ON fee_policies ((wedding_id IS NULL)) WHERE wedding_id IS NULL;
CREATE UNIQUE INDEX fee_policies_wedding_unique ON fee_policies (wedding_id) WHERE wedding_id IS NOT NULL;

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  actor_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  wedding_id TEXT REFERENCES weddings(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX wedding_memberships_account_role_idx ON wedding_memberships (account_id, role, status);
CREATE INDEX guests_wedding_rsvp_idx ON guests (wedding_id, rsvp_status) WHERE deleted_at IS NULL;
CREATE INDEX guests_wedding_group_idx ON guests (wedding_id, group_id) WHERE deleted_at IS NULL;
CREATE INDEX events_wedding_date_idx ON events (wedding_id, starts_at);
CREATE INDEX check_ins_event_idx ON check_ins (wedding_id, event_id, checked_in_at);
CREATE INDEX godparent_tasks_guest_idx ON godparent_tasks (wedding_id, guest_id, status);
CREATE INDEX auth_sessions_account_expiry_idx ON auth_sessions (account_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX auth_challenges_token_idx ON auth_challenges (token_hash, expires_at) WHERE consumed_at IS NULL;
CREATE INDEX audit_logs_wedding_date_idx ON audit_logs (wedding_id, created_at);

INSERT INTO fee_policies (id, wedding_id, enabled, rate_basis_points, minimum_fee_cents, maximum_fee_cents, paid_by) VALUES ('platform-default', NULL, 0, 0, 0, NULL, 'couple');


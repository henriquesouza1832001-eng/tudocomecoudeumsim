CREATE TABLE gift_contributions (
  id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE RESTRICT,
  gift_id TEXT REFERENCES gifts(id) ON DELETE SET NULL,
  guest_id TEXT REFERENCES guests(id) ON DELETE SET NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('pix_direct', 'stripe')),
  status TEXT NOT NULL CHECK (status IN ('reported', 'pending', 'confirmed', 'paid', 'failed', 'refunded', 'rejected')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  fee_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_amount_cents >= 0),
  fee_rate_basis_points INTEGER NOT NULL DEFAULT 0 CHECK (fee_rate_basis_points BETWEEN 0 AND 10000),
  fee_minimum_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_minimum_cents >= 0),
  fee_maximum_cents INTEGER CHECK (fee_maximum_cents IS NULL OR fee_maximum_cents >= fee_minimum_cents),
  fee_paid_by TEXT NOT NULL DEFAULT 'couple' CHECK (fee_paid_by IN ('couple', 'guest')),
  fee_status TEXT NOT NULL DEFAULT 'not_due' CHECK (fee_status IN ('not_due', 'due', 'paid', 'waived')),
  payer_name TEXT,
  message TEXT,
  provider_account_id TEXT,
  provider_charge_id TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX gift_contributions_provider_charge_unique ON gift_contributions (payment_mode, provider_charge_id) WHERE provider_charge_id IS NOT NULL;
CREATE INDEX gift_contributions_wedding_created_idx ON gift_contributions (wedding_id, created_at DESC);
CREATE INDEX gift_contributions_wedding_status_idx ON gift_contributions (wedding_id, status, fee_status);

CREATE TABLE payment_webhook_events (
  id TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe')),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  wedding_id TEXT REFERENCES weddings(id) ON DELETE SET NULL,
  contribution_id TEXT REFERENCES gift_contributions(id) ON DELETE SET NULL,
  outcome TEXT NOT NULL DEFAULT 'received' CHECK (outcome IN ('received', 'processed', 'ignored', 'failed')),
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX payment_webhook_events_wedding_received_idx ON payment_webhook_events (wedding_id, received_at DESC);

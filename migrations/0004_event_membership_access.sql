CREATE TABLE membership_event_access (
  membership_id TEXT NOT NULL REFERENCES wedding_memberships(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (membership_id, event_id)
);

CREATE INDEX membership_event_access_event_idx ON membership_event_access (event_id, membership_id);

CREATE UNIQUE INDEX check_ins_guest_event_unique ON check_ins (event_id, guest_id) WHERE guest_id IS NOT NULL;

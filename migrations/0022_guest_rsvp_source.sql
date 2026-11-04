ALTER TABLE guest_rsvps ADD COLUMN source TEXT NOT NULL DEFAULT 'invitation' CHECK (source IN ('invitation', 'manual'));
UPDATE guest_rsvps SET source = 'manual' WHERE EXISTS (
  SELECT 1 FROM audit_logs a
  WHERE a.wedding_id = guest_rsvps.wedding_id
    AND a.action = 'guest_rsvp_manually_changed'
    AND a.target_id = guest_rsvps.guest_id
    AND json_extract(a.details_json, '$.eventId') = guest_rsvps.event_id
);

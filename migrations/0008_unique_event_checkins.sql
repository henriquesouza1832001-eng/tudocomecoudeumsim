WITH duplicate_checkins AS (
  SELECT wedding_id, event_id, COUNT(*) - 1 AS removed_records
  FROM check_ins
  WHERE guest_id IS NOT NULL
  GROUP BY wedding_id, event_id, guest_id
  HAVING COUNT(*) > 1
)
INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
SELECT lower(hex(randomblob(16))), NULL, wedding_id, 'duplicate_checkins_reconciled', 'event', event_id,
  json_object('removedRecords', SUM(removed_records))
FROM duplicate_checkins
GROUP BY wedding_id, event_id;

DELETE FROM check_ins
WHERE rowid IN (
  SELECT rowid
  FROM (
    SELECT rowid, ROW_NUMBER() OVER (
      PARTITION BY wedding_id, event_id, guest_id
      ORDER BY checked_in_at, id
    ) AS duplicate_number
    FROM check_ins
    WHERE guest_id IS NOT NULL
  )
  WHERE duplicate_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS check_ins_guest_event_unique
ON check_ins (event_id, guest_id)
WHERE guest_id IS NOT NULL;

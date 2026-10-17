ALTER TABLE weddings ADD COLUMN event_time TEXT;
ALTER TABLE weddings ADD COLUMN published_partner_one_name TEXT;
ALTER TABLE weddings ADD COLUMN published_partner_two_name TEXT;
ALTER TABLE weddings ADD COLUMN published_event_date TEXT;
ALTER TABLE weddings ADD COLUMN published_event_time TEXT;
UPDATE weddings SET published_partner_one_name = partner_one_name,
  published_partner_two_name = partner_two_name,
  published_event_date = event_date,
  published_event_time = event_time
WHERE site_published_at IS NOT NULL;

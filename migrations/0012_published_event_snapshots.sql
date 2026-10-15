ALTER TABLE weddings ADD COLUMN published_events_json TEXT NOT NULL DEFAULT '[]';
UPDATE weddings SET published_events_json = COALESCE((
  SELECT json_group_array(json_object(
    'id', e.id,
    'name', e.name,
    'event_type', e.event_type,
    'starts_at', e.starts_at,
    'venue_name', e.venue_name,
    'address', e.address,
    'group_ids', json(COALESCE((SELECT json_group_array(x.group_id) FROM event_group_access x WHERE x.event_id = e.id), '[]'))
  ))
  FROM events e WHERE e.wedding_id = weddings.id
), '[]') WHERE site_published_at IS NOT NULL;

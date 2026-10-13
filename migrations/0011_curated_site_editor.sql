ALTER TABLE weddings ADD COLUMN published_site_config_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE weddings ADD COLUMN site_published_at TEXT;

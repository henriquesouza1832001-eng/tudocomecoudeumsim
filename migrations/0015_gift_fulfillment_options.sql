ALTER TABLE gifts ADD COLUMN fulfillment_type TEXT NOT NULL DEFAULT 'pix_direct' CHECK (fulfillment_type IN ('pix_direct', 'store_link'));
ALTER TABLE gifts ADD COLUMN store_url TEXT CHECK (store_url IS NULL OR length(store_url) <= 2048);

ALTER TABLE wedding_memberships ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE wedding_memberships ADD COLUMN profession TEXT NOT NULL DEFAULT 'cerimonialista' CHECK (profession IN ('seguranca', 'cerimonialista'));

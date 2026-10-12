ALTER TABLE auth_challenges
ADD COLUMN membership_id TEXT REFERENCES wedding_memberships(id) ON DELETE CASCADE;

UPDATE auth_challenges
SET membership_id = (
  SELECT MIN(m.id)
  FROM wedding_memberships m
  WHERE m.account_id = auth_challenges.account_id AND m.status = 'pending'
  GROUP BY m.account_id
  HAVING COUNT(*) = 1
)
WHERE purpose = 'email_verification' AND consumed_at IS NULL;

CREATE INDEX auth_challenges_membership_idx
ON auth_challenges (membership_id, expires_at)
WHERE membership_id IS NOT NULL AND consumed_at IS NULL;

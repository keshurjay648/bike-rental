-- Run once against an existing database to enable admin features.
-- Example: psql "$DATABASE_URL" -f src/db/migrate-admin.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Promote an account to admin (change the email first):
-- UPDATE users SET role = 'admin' WHERE email = 'you@example.com';

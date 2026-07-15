import { pool } from "../src/config/db.js";
import { assertRequiredEnv } from "../src/config/env.js";

assertRequiredEnv();

await pool.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
`);

await pool.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
`);

await pool.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
    ) THEN
      ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('user', 'admin'));
    END IF;
  END $$;
`);

const cols = await pool.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'users'
  ORDER BY ordinal_position
`);

console.log("Migration OK. users columns:", cols.rows.map((r) => r.column_name).join(", "));
await pool.end();

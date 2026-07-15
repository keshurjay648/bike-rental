import { pool } from "../src/config/db.js";
import { assertRequiredEnv } from "../src/config/env.js";

assertRequiredEnv();

await pool.query(`
  ALTER TABLE bikes
    ADD COLUMN IF NOT EXISTS engine_cc VARCHAR(40),
    ADD COLUMN IF NOT EXISTS torque VARCHAR(40),
    ADD COLUMN IF NOT EXISTS horsepower VARCHAR(40)
`);

const cols = await pool.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'bikes'
  ORDER BY ordinal_position
`);

console.log("bikes columns:", cols.rows.map((r) => r.column_name).join(", "));
await pool.end();

import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export async function checkDbConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT NOW()");
  } finally {
    client.release();
  }
}

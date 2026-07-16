import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes("localhost")
    ? false
    : { rejectUnauthorized: false }   // required for Render / Supabase / Neon hosted DBs
});

export async function checkDbConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT NOW()");
    console.log("Database connected successfully");
  } finally {
    client.release();
  }
}

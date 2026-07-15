import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";
import { assertRequiredEnv, env } from "../src/config/env.js";

assertRequiredEnv();

const ADMIN_PASSWORD = process.argv[2] || "doremon@4";
const adminEmail = (env.adminEmails[0] || "keshurjay648@gmail.com").toLowerCase();
const saltRounds = 10;

const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

const existing = await pool.query(
  `SELECT id, email FROM users WHERE LOWER(email) = $1`,
  [adminEmail]
);

if (existing.rowCount > 0) {
  await pool.query(
    `UPDATE users
     SET password_hash = $1, role = 'admin', updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [passwordHash, existing.rows[0].id]
  );
  console.log(`Updated admin password for ${adminEmail}`);
} else {
  await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, phone_verified, role)
     VALUES ($1, $2, $3, $4, TRUE, 'admin')`,
    ["Admin", adminEmail, "9876543210", passwordHash]
  );
  console.log(`Created admin user ${adminEmail}`);
}

console.log("You can sign in at admin-login.html with this email and the new password.");
await pool.end();

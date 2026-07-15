import { pool } from "../config/db.js";
import { isAdminUser } from "../middleware/auth.js";

export async function getUsers(req, res) {
  const result = await pool.query(
    `SELECT
       id,
       name,
       email,
       phone,
       COALESCE(email_verified, FALSE) AS email_verified,
       phone_verified,
       COALESCE(role, 'user') AS role,
       created_at,
       updated_at
     FROM users
     ORDER BY created_at DESC`
  );

  const users = result.rows.map((user) => ({
    ...user,
    is_admin: isAdminUser(user)
  }));

  res.json({
    success: true,
    data: users
  });
}

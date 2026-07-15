import { pool } from "../src/config/db.js";
import { assertRequiredEnv } from "../src/config/env.js";

assertRequiredEnv();

const r = await pool.query(`
  SELECT id, name, type, availability_status, price_per_hour, image_url
  FROM bikes
  ORDER BY id DESC
`);

console.log("Total bikes:", r.rowCount);
const byStatus = {};
for (const row of r.rows) {
  byStatus[row.availability_status] = (byStatus[row.availability_status] || 0) + 1;
}
console.log("By status:", byStatus);
console.log(
  r.rows
    .map(
      (b) =>
        `#${b.id} ${b.name} | ${b.availability_status} | ₹${b.price_per_hour} | ${b.image_url || "(no image)"}`
    )
    .join("\n")
);

await pool.end();

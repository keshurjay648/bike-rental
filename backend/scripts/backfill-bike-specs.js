import { pool } from "../src/config/db.js";
import { assertRequiredEnv } from "../src/config/env.js";

assertRequiredEnv();

const specs = [
  { name: "BMW G310", engine_cc: "313 cc", torque: "28 Nm", horsepower: "34 hp" },
  { name: "TVS RR310", engine_cc: "312 cc", torque: "29 Nm", horsepower: "34 hp" },
  { name: "TVS RTR160", engine_cc: "159 cc", torque: "14 Nm", horsepower: "16 hp" },
  { name: "BMW GS310", engine_cc: "313 cc", torque: "28 Nm", horsepower: "34 hp" },
  { name: "Honda CBR600rr", engine_cc: "599 cc", torque: "66 Nm", horsepower: "119 hp" },
  { name: "Yamaha Aerox 155", engine_cc: "155 cc", torque: "13.9 Nm", horsepower: "15 hp" },
  { name: "Honda PCX", engine_cc: "157 cc", torque: "15 Nm", horsepower: "16 hp" },
  { name: "Burgman 400", engine_cc: "400 cc", torque: "35 Nm", horsepower: "29 hp" }
];

for (const bike of specs) {
  const result = await pool.query(
    `UPDATE bikes
     SET engine_cc = COALESCE(NULLIF(engine_cc, ''), $2),
         torque = COALESCE(NULLIF(torque, ''), $3),
         horsepower = COALESCE(NULLIF(horsepower, ''), $4)
     WHERE LOWER(name) = LOWER($1)`,
    [bike.name, bike.engine_cc, bike.torque, bike.horsepower]
  );
  console.log(`${bike.name}: updated ${result.rowCount} row(s)`);
}

await pool.end();

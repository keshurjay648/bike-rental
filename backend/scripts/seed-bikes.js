import { pool } from "../src/config/db.js";
import { assertRequiredEnv } from "../src/config/env.js";

assertRequiredEnv();

const seedBikes = [
  { name: "BMW G310", brand: "BMW", type: "Naked", image_url: "img/g310.png", price: 180 },
  { name: "TVS RR310", brand: "TVS", type: "Sports", image_url: "img/tvsrr.png", price: 190 },
  { name: "TVS RTR160", brand: "TVS", type: "Naked", image_url: "img/rtr160.png", price: 120 },
  { name: "BMW GS310", brand: "BMW", type: "Adventure", image_url: "img/gs310.png", price: 200 },
  { name: "Honda CBR600rr", brand: "Honda", type: "Sports", image_url: "img/cbr.png", price: 210 },
  { name: "Yamaha Aerox 155", brand: "Yamaha", type: "Scooter", image_url: "img/yama.png", price: 80 },
  { name: "Honda PCX", brand: "Honda", type: "Scooter", image_url: "img/pcx.png", price: 90 },
  { name: "Burgman 400", brand: "Suzuki", type: "Scooter", image_url: "img/burg.png", price: 140 }
];

const count = await pool.query("SELECT COUNT(*)::int AS c FROM bikes");
if (count.rows[0].c > 0) {
  console.log(`Bikes already present (${count.rows[0].c}). Skipping seed.`);
} else {
  for (const bike of seedBikes) {
    await pool.query(
      `INSERT INTO bikes (name, brand, type, image_url, price_per_hour, availability_status)
       VALUES ($1, $2, $3, $4, $5, 'available')`,
      [bike.name, bike.brand, bike.type, bike.image_url, bike.price]
    );
  }
  console.log(`Seeded ${seedBikes.length} bikes.`);
}

await pool.end();

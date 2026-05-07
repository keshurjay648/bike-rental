import { pool } from "../config/db.js";

export async function getBikes(req, res) {
  const result = await pool.query(
    `SELECT id, name, brand, type, image_url, price_per_hour, availability_status
     FROM bikes
     ORDER BY id DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
}

export async function createBike(req, res) {
  const { name, brand, type, imageUrl, pricePerHour, availabilityStatus } = req.body;

  if (!name || !type || !pricePerHour) {
    return res.status(400).json({
      success: false,
      message: "name, type and pricePerHour are required"
    });
  }

  const status = availabilityStatus || "available";

  const result = await pool.query(
    `INSERT INTO bikes (name, brand, type, image_url, price_per_hour, availability_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, brand, type, image_url, price_per_hour, availability_status`,
    [name, brand || null, type, imageUrl || null, Number(pricePerHour), status]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}

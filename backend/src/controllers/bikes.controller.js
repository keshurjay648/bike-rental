import fs from "fs";
import path from "path";
import { pool } from "../config/db.js";
import { bikesUploadDir, publicUploadPath } from "../middleware/upload.js";

const BIKE_RETURN_COLS = `
  id, name, brand, type, image_url, price_per_hour,
  engine_cc, torque, horsepower, availability_status, created_at
`;

function resolveImageUrlFromRequest(req) {
  if (req.file?.filename) {
    return publicUploadPath(req.file.filename);
  }

  const raw = req.body.imageUrl;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().replace(/\\/g, "/");
  }

  return null;
}

function optionalText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function deleteStoredUpload(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/bikes/")) return;
  const filename = path.basename(imageUrl);
  const fullPath = path.join(bikesUploadDir, filename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export async function getBikes(req, res) {
  const result = await pool.query(
    `SELECT ${BIKE_RETURN_COLS}
     FROM bikes
     ORDER BY id DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
}

/** Admin: bikes with whether they currently have an active booking */
export async function getBikesWithAvailability(req, res) {
  const result = await pool.query(
    `SELECT
       k.id,
       k.name,
       k.brand,
       k.type,
       k.image_url,
       k.price_per_hour,
       k.engine_cc,
       k.torque,
       k.horsepower,
       k.availability_status,
       k.created_at,
       EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.bike_id = k.id
           AND b.booking_status IN ('pending', 'confirmed')
           AND b.end_date > NOW()
       ) AS is_currently_booked,
       (
         SELECT json_build_object(
           'id', b.id,
           'customer_name', b.customer_name,
           'customer_email', b.customer_email,
           'start_date', b.start_date,
           'end_date', b.end_date,
           'booking_status', b.booking_status
         )
         FROM bookings b
         WHERE b.bike_id = k.id
           AND b.booking_status IN ('pending', 'confirmed')
           AND b.end_date > NOW()
         ORDER BY b.start_date ASC
         LIMIT 1
       ) AS current_booking
     FROM bikes k
     ORDER BY k.id DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
}

export async function createBike(req, res) {
  const name = req.body.name?.trim();
  const brand = req.body.brand?.trim() || null;
  const type = req.body.type?.trim();
  const pricePerHour = req.body.pricePerHour;
  const engineCc = optionalText(req.body.engineCc);
  const torque = optionalText(req.body.torque);
  const horsepower = optionalText(req.body.horsepower);
  const availabilityStatus = req.body.availabilityStatus || "available";
  const imageUrl = resolveImageUrlFromRequest(req);

  if (!name || !type || !pricePerHour) {
    if (req.file) deleteStoredUpload(publicUploadPath(req.file.filename));
    return res.status(400).json({
      success: false,
      message: "name, type and pricePerHour are required"
    });
  }

  if (!["available", "unavailable"].includes(availabilityStatus)) {
    if (req.file) deleteStoredUpload(publicUploadPath(req.file.filename));
    return res.status(400).json({
      success: false,
      message: "availabilityStatus must be available or unavailable"
    });
  }

  const result = await pool.query(
    `INSERT INTO bikes (
       name, brand, type, image_url, price_per_hour,
       engine_cc, torque, horsepower, availability_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${BIKE_RETURN_COLS}`,
    [
      name,
      brand,
      type,
      imageUrl,
      Number(pricePerHour),
      engineCc,
      torque,
      horsepower,
      availabilityStatus
    ]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}

export async function updateBike(req, res) {
  const { id } = req.params;
  const name = req.body.name?.trim();
  const brand = req.body.brand?.trim();
  const type = req.body.type?.trim();
  const pricePerHour = req.body.pricePerHour;
  const engineCc = req.body.engineCc !== undefined ? optionalText(req.body.engineCc) : undefined;
  const torque = req.body.torque !== undefined ? optionalText(req.body.torque) : undefined;
  const horsepower =
    req.body.horsepower !== undefined ? optionalText(req.body.horsepower) : undefined;
  const availabilityStatus = req.body.availabilityStatus;

  const existing = await pool.query(
    `SELECT id, image_url FROM bikes WHERE id = $1`,
    [id]
  );
  if (existing.rowCount === 0) {
    if (req.file) deleteStoredUpload(publicUploadPath(req.file.filename));
    return res.status(404).json({ success: false, message: "Bike not found" });
  }

  if (availabilityStatus && !["available", "unavailable"].includes(availabilityStatus)) {
    if (req.file) deleteStoredUpload(publicUploadPath(req.file.filename));
    return res.status(400).json({
      success: false,
      message: "availabilityStatus must be available or unavailable"
    });
  }

  let imageUrl = null;
  if (req.file?.filename) {
    imageUrl = publicUploadPath(req.file.filename);
  } else if (typeof req.body.imageUrl === "string" && req.body.imageUrl.trim()) {
    imageUrl = req.body.imageUrl.trim().replace(/\\/g, "/");
  }

  const result = await pool.query(
    `UPDATE bikes SET
       name = COALESCE($1, name),
       brand = COALESCE($2, brand),
       type = COALESCE($3, type),
       image_url = COALESCE($4, image_url),
       price_per_hour = COALESCE($5, price_per_hour),
       engine_cc = COALESCE($6, engine_cc),
       torque = COALESCE($7, torque),
       horsepower = COALESCE($8, horsepower),
       availability_status = COALESCE($9, availability_status)
     WHERE id = $10
     RETURNING ${BIKE_RETURN_COLS}`,
    [
      name || null,
      brand !== undefined ? brand || null : null,
      type || null,
      imageUrl,
      pricePerHour != null && pricePerHour !== "" ? Number(pricePerHour) : null,
      engineCc !== undefined ? engineCc : null,
      torque !== undefined ? torque : null,
      horsepower !== undefined ? horsepower : null,
      availabilityStatus || null,
      id
    ]
  );

  if (req.file && existing.rows[0].image_url) {
    deleteStoredUpload(existing.rows[0].image_url);
  }

  res.json({ success: true, data: result.rows[0] });
}

export async function deleteBike(req, res) {
  const { id } = req.params;

  const existing = await pool.query(
    `SELECT id, name, image_url FROM bikes WHERE id = $1`,
    [id]
  );
  if (existing.rowCount === 0) {
    return res.status(404).json({ success: false, message: "Bike not found" });
  }

  const activeBookings = await pool.query(
    `SELECT id FROM bookings
     WHERE bike_id = $1 AND booking_status IN ('pending', 'confirmed')
     LIMIT 1`,
    [id]
  );

  if (activeBookings.rowCount > 0) {
    return res.status(409).json({
      success: false,
      message: "Cannot delete a bike with active bookings. Mark it unavailable instead."
    });
  }

  try {
    await pool.query(`DELETE FROM bikes WHERE id = $1`, [id]);
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete bike linked to past bookings. Mark it unavailable instead."
      });
    }
    throw error;
  }

  deleteStoredUpload(existing.rows[0].image_url);

  res.json({
    success: true,
    message: `Bike "${existing.rows[0].name}" removed`
  });
}

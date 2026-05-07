import { pool } from "../config/db.js";

function calculateHours(startDate, endDate) {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

export async function createBooking(req, res) {
  const { bikeId, customerName, customerEmail, startDate, endDate } = req.body;

  if (!bikeId || !customerName || !customerEmail || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "bikeId, customerName, customerEmail, startDate and endDate are required"
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking dates"
    });
  }

  const bikeResult = await pool.query(
    `SELECT id, name, price_per_hour, availability_status
     FROM bikes
     WHERE id = $1`,
    [bikeId]
  );

  if (bikeResult.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: "Bike not found"
    });
  }

  const bike = bikeResult.rows[0];

  if (bike.availability_status !== "available") {
    return res.status(400).json({
      success: false,
      message: "Bike is not available right now"
    });
  }

  const overlapResult = await pool.query(
    `SELECT id FROM bookings
     WHERE bike_id = $1
       AND booking_status IN ('pending', 'confirmed')
       AND tstzrange(start_date, end_date, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
     LIMIT 1`,
    [bikeId, start.toISOString(), end.toISOString()]
  );

  if (overlapResult.rowCount > 0) {
    return res.status(409).json({
      success: false,
      message: "Bike already booked for selected time"
    });
  }

  const totalHours = calculateHours(start, end);
  const totalAmount = totalHours * Number(bike.price_per_hour);

  const insertResult = await pool.query(
    `INSERT INTO bookings (
      bike_id, customer_name, customer_email, start_date, end_date,
      total_hours, total_amount, booking_status, payment_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'pending')
    RETURNING id, bike_id, customer_name, customer_email, start_date, end_date, total_hours, total_amount, booking_status, payment_status`,
    [bikeId, customerName, customerEmail, start.toISOString(), end.toISOString(), totalHours, totalAmount]
  );

  res.status(201).json({
    success: true,
    data: insertResult.rows[0]
  });
}

export async function getBookings(req, res) {
  const result = await pool.query(
    `SELECT b.id, b.bike_id, k.name AS bike_name, b.customer_name, b.customer_email,
            b.start_date, b.end_date, b.total_hours, b.total_amount,
            b.booking_status, b.payment_status, b.created_at
     FROM bookings b
     JOIN bikes k ON k.id = b.bike_id
     ORDER BY b.created_at DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
}

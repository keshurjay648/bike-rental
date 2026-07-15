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

// Get bookings for the currently authenticated user
export async function getMyBookings(req, res) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Match by customer_email since bookings table uses email not user_id FK yet
  const result = await pool.query(
    `SELECT b.id, b.bike_id, k.name AS bike_name, k.image_url AS bike_image,
            k.type AS bike_type,
            b.customer_name, b.customer_email,
            b.start_date, b.end_date, b.total_hours, b.total_amount,
            b.booking_status AS status, b.payment_status, b.created_at
     FROM bookings b
     JOIN bikes k ON k.id = b.bike_id
     WHERE b.customer_email = $1
     ORDER BY b.created_at DESC`,
    [req.user.email]
  );

  res.json({ success: true, data: result.rows });
}

// Cancel a booking (owner or admin)
export async function cancelBooking(req, res) {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const bookingResult = await pool.query(
    `SELECT id, booking_status, customer_email FROM bookings WHERE id = $1`,
    [id]
  );

  if (bookingResult.rowCount === 0) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  const booking = bookingResult.rows[0];
  const isAdmin = Boolean(req.user.is_admin);
  const isOwner = booking.customer_email === req.user.email;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: "Not your booking" });
  }

  if (booking.booking_status === "cancelled") {
    return res.status(400).json({ success: false, message: "Booking already cancelled" });
  }

  if (booking.booking_status === "completed" && !isAdmin) {
    return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
  }

  await pool.query(
    `UPDATE bookings SET booking_status = 'cancelled' WHERE id = $1`,
    [id]
  );

  res.json({
    success: true,
    message: "Booking cancelled successfully",
    data: { id: Number(id), booking_status: "cancelled" }
  });
}

/** Admin: permanently delete a booking (and related payments via CASCADE) */
export async function deleteBooking(req, res) {
  const { id } = req.params;

  const bookingResult = await pool.query(
    `SELECT id, bike_id, customer_email, booking_status FROM bookings WHERE id = $1`,
    [id]
  );

  if (bookingResult.rowCount === 0) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  await pool.query(`DELETE FROM bookings WHERE id = $1`, [id]);

  res.json({
    success: true,
    message: `Booking #${id} deleted`,
    data: { id: Number(id) }
  });
}

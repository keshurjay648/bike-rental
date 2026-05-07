import crypto from "crypto";
import Razorpay from "razorpay";
import { pool } from "../config/db.js";
import { env, isRazorpayConfigured } from "../config/env.js";

function getRazorpayClient() {
  if (!isRazorpayConfigured()) {
    return null;
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret
  });
}

export async function createPaymentOrder(req, res) {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    return res.status(503).json({
      success: false,
      message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
    });
  }

  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: "bookingId is required"
    });
  }

  const bookingResult = await pool.query(
    `SELECT id, total_amount, payment_status
     FROM bookings
     WHERE id = $1`,
    [bookingId]
  );

  if (bookingResult.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  const booking = bookingResult.rows[0];

  if (booking.payment_status === "paid") {
    return res.status(400).json({
      success: false,
      message: "Booking already paid"
    });
  }

  const amountInPaise = Math.round(Number(booking.total_amount) * 100);
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `booking_${booking.id}`
  });

  await pool.query(
    `INSERT INTO payments (booking_id, razorpay_order_id, amount, currency, status)
     VALUES ($1, $2, $3, 'INR', 'created')`,
    [booking.id, order.id, Number(booking.total_amount)]
  );

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpayKeyId
    }
  });
}

export async function verifyPayment(req, res) {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
    });
  }

  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: "bookingId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required"
    });
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    await pool.query(
      `UPDATE payments
       SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'failed'
       WHERE booking_id = $3 AND razorpay_order_id = $4`,
      [razorpayPaymentId, razorpaySignature, bookingId, razorpayOrderId]
    );

    return res.status(400).json({
      success: false,
      message: "Payment signature verification failed"
    });
  }

  await pool.query("BEGIN");
  try {
    await pool.query(
      `UPDATE payments
       SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'paid', paid_at = NOW()
       WHERE booking_id = $3 AND razorpay_order_id = $4`,
      [razorpayPaymentId, razorpaySignature, bookingId, razorpayOrderId]
    );

    await pool.query(
      `UPDATE bookings
       SET payment_status = 'paid', booking_status = 'confirmed'
       WHERE id = $1`,
      [bookingId]
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  res.json({
    success: true,
    message: "Payment verified and booking confirmed"
  });
}

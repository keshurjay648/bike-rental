const API_BASE_URL = "https://bike-rental-2-msm9.onrender.com/api";

const paymentMessage = document.getElementById("paymentMessage");
const payNowBtn      = document.getElementById("payNowBtn");

// Try both storage keys
const booking = JSON.parse(
  localStorage.getItem("booking") ||
  localStorage.getItem("currentBooking") ||
  "null"
);

/* ── Helpers ──────────────────────────────────────────────── */
function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setMsg(text, isError = false) {
  paymentMessage.innerText = text;
  paymentMessage.style.color = isError ? "#d93025" : "#188038";
}

/* ── Populate all summary fields ─────────────────────────── */
function populateSummary() {
  if (!booking) {
    setMsg("No booking found. Please go back and create a booking.", true);
    payNowBtn.disabled = true;
    return;
  }

  // Bike details
  const bikeName  = booking.bikeName  || booking.bike_name  || "—";
  const bikeType  = booking.bikeType  || booking.bike_type  || "—";
  const bikeImg   = booking.bikeImage || booking.bike_image || "img/harly.png";
  const bikePrice = Number(booking.bikePrice || booking.price_per_hour || 0);
  const hours     = Number(booking.totalHours || booking.total_hours || 0);
  const amount    = Number(booking.totalPrice || booking.total_amount || booking.total_price || 0);

  setText("summaryBikeName", bikeName);
  setText("summaryBikeType", bikeType);
  setImg("summaryBikeImg",   bikeImg, bikeName);

  // Trip details
  setText("summaryPickup",   fmt(booking.startDate || booking.start_date));
  setText("summaryDrop",     fmt(booking.endDate   || booking.end_date));
  setText("summaryDuration", hours ? `${hours} hour${hours !== 1 ? "s" : ""}` : "—");

  // Customer
  setText("summaryName",  booking.customerName  || booking.customer_name  || "—");
  setText("summaryEmail", booking.customerEmail || booking.customer_email || "—");

  // Price breakdown
  setText("pricePerHourLabel", bikePrice && hours
    ? `₹${bikePrice} × ${hours} hr${hours !== 1 ? "s" : ""}`
    : "Rental charge");
  setText("priceSubtotal", `₹${amount.toLocaleString("en-IN")}`);
  setText("summaryTotal",  `₹${amount.toLocaleString("en-IN")}`);

  // Amount on button & highlight
  setText("payAmount",    amount.toLocaleString("en-IN"));
  setText("payBtnAmount", amount.toLocaleString("en-IN"));

  // Booking ID
  setText("summaryBookingId", booking.id || "—");

  // Also update legacy IDs used by old code
  setOptional("bookingId",     booking.id    || "—");
  setOptional("bookingAmount", amount);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setOptional(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setImg(id, src, alt) {
  const el = document.getElementById(id);
  if (el) { el.src = src; el.alt = alt; }
}

populateSummary();

/* ── Payment flow ─────────────────────────────────────────── */
async function createOrder() {
  const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: booking.id })
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Failed to create payment order");
  }
  return payload.data;
}

async function verifyPayment(orderId, paymentId, signature) {
  const response = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId:          booking.id,
      razorpayOrderId:    orderId,
      razorpayPaymentId:  paymentId,
      razorpaySignature:  signature
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Payment verification failed");
  }
}

async function startPayment() {
  if (!booking) { setMsg("No booking found.", true); return; }

  try {
    setMsg("Creating payment order…");
    payNowBtn.disabled = true;

    const amount = Number(
      booking.totalPrice || booking.total_amount || booking.total_price || 0
    );

    let orderData;
    try {
      orderData = await createOrder();
    } catch (apiErr) {
      // Fallback: use local booking data if backend isn't available
      orderData = {
        keyId:    "rzp_test_Sh3dNCrbgEosky",
        amount:   amount * 100,
        currency: "INR",
        orderId:  "local_" + Date.now()
      };
    }

    const options = {
      key:         orderData.keyId,
      amount:      orderData.amount,
      currency:    orderData.currency || "INR",
      name:        "Torque Rentals",
      description: `Booking: ${booking.bikeName || booking.bike_name || "Bike"}`,
      order_id:    orderData.orderId,
      image:       "img/logo.png",
      handler: async function (response) {
        try {
          await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
          setMsg("Payment successful! Redirecting…");
          localStorage.removeItem("booking");
          setTimeout(() => { window.location.href = "booking-success.html"; }, 800);
        } catch (err) {
          setMsg(err.message, true);
          payNowBtn.disabled = false;
        }
      },
      prefill: {
        name:  booking.customerName  || booking.customer_name  || "",
        email: booking.customerEmail || booking.customer_email || ""
      },
      notes: {
        bike: booking.bikeName || booking.bike_name || ""
      },
      theme: { color: "#ff4424" },
      modal: {
        ondismiss: () => {
          setMsg("Payment cancelled.", true);
          payNowBtn.disabled = false;
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setMsg("");

  } catch (error) {
    setMsg(error.message, true);
    payNowBtn.disabled = false;
  }
}

if (payNowBtn) {
  payNowBtn.addEventListener("click", startPayment);
}

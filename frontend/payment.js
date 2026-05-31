const API_BASE_URL = "http://localhost:5003/api";

const paymentMessage = document.getElementById("paymentMessage");
const payNowBtn = document.getElementById("payNowBtn");

const booking = JSON.parse(localStorage.getItem("booking") || "null");

function setPaymentMessage(message, isError = false) {
  paymentMessage.innerText = message;
  paymentMessage.style.color = isError ? "#d93025" : "#188038";
}

if (!booking || !booking.id) {
  setPaymentMessage("No booking found. Please create booking first.", true);
  payNowBtn.disabled = true;
} else {
  document.getElementById("bookingId").innerText = booking.id;
  document.getElementById("bookingAmount").innerText = booking.total_amount;
}

async function createOrder() {
  const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
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
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      bookingId: booking.id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Payment verification failed");
  }
}

async function startPayment() {
  try {
    setPaymentMessage("Creating payment order...");
    const orderData = await createOrder();

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Torque Rentals",
      description: `Booking #${booking.id}`,
      order_id: orderData.orderId,
      handler: async function handlePaymentSuccess(response) {
        try {
          await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
          setPaymentMessage("Payment successful! Redirecting…");
          localStorage.removeItem("booking");
          setTimeout(() => { window.location.href = "booking-success.html"; }, 800);
        } catch (error) {
          setPaymentMessage(error.message, true);
        }
      },
      prefill: {
        name: booking.customer_name,
        email: booking.customer_email
      },
      theme: {
        color: "#ff4424"
      }
    };

    const razorpayCheckout = new window.Razorpay(options);
    razorpayCheckout.open();
  } catch (error) {
    setPaymentMessage(error.message, true);
  }
}

payNowBtn.addEventListener("click", startPayment);

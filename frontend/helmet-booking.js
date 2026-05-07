const HELMET_PRICE_PER_HOUR = 40;

const helmetBookingMessage = document.getElementById("helmetBookingMessage");
const helmetQtyInput = document.getElementById("helmetQty");
const confirmHelmetBookingBtn = document.getElementById("confirmHelmetBookingBtn");
const helmetSizeInput = document.getElementById("helmetSize");

const pickupPicker = flatpickr("#pickup", {
  enableTime: true,
  dateFormat: "d M, Y h:i K",
  minDate: "today",
  onChange: calculateHelmetTotal
});

const dropPicker = flatpickr("#drop", {
  enableTime: true,
  dateFormat: "d M, Y h:i K",
  minDate: "today",
  onChange: calculateHelmetTotal
});

helmetQtyInput.addEventListener("input", calculateHelmetTotal);

function setMessage(message, isError = false) {
  helmetBookingMessage.innerText = message;
  helmetBookingMessage.style.color = isError ? "#d93025" : "#188038";
}

function calculateHelmetTotal() {
  const pickup = pickupPicker.selectedDates[0];
  const drop = dropPicker.selectedDates[0];
  const quantity = Number(helmetQtyInput.value || 0);

  if (!pickup || !drop || drop <= pickup || quantity <= 0) {
    document.getElementById("hours").innerText = "0";
    document.getElementById("total").innerText = "0";
    return;
  }

  const diffMs = drop - pickup;
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  const total = hours * HELMET_PRICE_PER_HOUR * quantity;

  document.getElementById("hours").innerText = String(hours);
  document.getElementById("total").innerText = String(total);
}

function confirmHelmetBooking() {
  const pickup = pickupPicker.selectedDates[0];
  const drop = dropPicker.selectedDates[0];
  const customerName = document.getElementById("customerName").value.trim();
  const customerEmail = document.getElementById("customerEmail").value.trim();
  const helmetSize = helmetSizeInput.value;
  const quantity = Number(helmetQtyInput.value || 0);
  const total = Number(document.getElementById("total").innerText);

  if (!customerName || !customerEmail || !helmetSize) {
    setMessage("Name, email and helmet size are required.", true);
    return;
  }

  if (!pickup || !drop || total === 0 || quantity <= 0) {
    setMessage("Select valid rental duration and quantity.", true);
    return;
  }

  const bookingPayload = {
    id: `HLM-${Date.now()}`,
    item: "Premium Riding Helmet",
    customerName,
    customerEmail,
    size: helmetSize,
    quantity,
    pricePerHour: HELMET_PRICE_PER_HOUR,
    startDate: pickup.toISOString(),
    endDate: drop.toISOString(),
    totalAmount: total
  };

  localStorage.setItem("helmetBooking", JSON.stringify(bookingPayload));
  setMessage("Helmet booking confirmed successfully.");
}

confirmHelmetBookingBtn.addEventListener("click", confirmHelmetBooking);

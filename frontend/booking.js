const API_BASE_URL = "http://localhost:5002/api";

const params = new URLSearchParams(window.location.search);
const bike = params.get("bike");
const price = Number(params.get("price") || 0);
const img = params.get("img");
const cc = params.get("cc");
const torque = params.get("torque");
const horsepower = params.get("horsepower");

const bookingMessage = document.getElementById("bookingMessage");
const bikeNameEl = document.getElementById("bikeName");
const bikePriceEl = document.getElementById("bikePrice");
const bikeImgEl = document.getElementById("bikeImg");
const bikeCcEl = document.getElementById("bikeCc");
const bikeTorqueEl = document.getElementById("bikeTorque");
const bikeHorsepowerEl = document.getElementById("bikeHorsepower");
const bikeDescriptionEl = document.getElementById("bikeDescription");
const pickupLocationNameEl = document.getElementById("pickupLocationName");
const pickupLocationAddressEl = document.getElementById("pickupLocationAddress");
const pickupMapEl = document.getElementById("pickupMap");

// Authentication elements
const loggedInContent = document.getElementById("loggedInContent");
const notLoggedInContent = document.getElementById("notLoggedInContent");
const loggedInUserName = document.getElementById("loggedInUserName");
const loggedInUserEmail = document.getElementById("loggedInUserEmail");

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Check authentication status and show appropriate content
function checkAuthStatus() {
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        // User is logged in - show booking form
        if (loggedInContent) loggedInContent.style.display = 'block';
        if (notLoggedInContent) notLoggedInContent.style.display = 'none';
        
        // Update user info
        if (loggedInUserName) loggedInUserName.textContent = currentUser.name || 'User';
        if (loggedInUserEmail) loggedInUserEmail.textContent = currentUser.email || 'Not provided';
        
        return currentUser;
    } else {
        // User is not logged in - show login prompt
        if (loggedInContent) loggedInContent.style.display = 'none';
        if (notLoggedInContent) notLoggedInContent.style.display = 'block';
        
        return null;
    }
}

const bikeExternalMeta = {
  "BMW G310": {
    wikiTitle: "BMW_G_310_R",
    fallbackDescription:
      "The BMW G310 is a lightweight street bike known for agile city handling and easy touring comfort.",
    fallbackSpecs: { cc: "313 cc", torque: "28 Nm", horsepower: "34 hp" }
  },
  "TVS RR310": {
    wikiTitle: "TVS_Apache_RR_310",
    fallbackDescription:
      "TVS RR310 is a fully faired sport bike tuned for balanced track performance and highway stability.",
    fallbackSpecs: { cc: "312 cc", torque: "29 Nm", horsepower: "34 hp" }
  },
  "TVS RTR160": {
    wikiTitle: "TVS_Apache",
    fallbackDescription:
      "The RTR160 is a practical street-naked bike with responsive throttle and commuter-friendly dynamics.",
    fallbackSpecs: { cc: "159 cc", torque: "14 Nm", horsepower: "16 hp" }
  },
  "BMW GS310": {
    wikiTitle: "BMW_G_310_GS",
    fallbackDescription:
      "BMW GS310 is an entry adventure-tourer built for mixed road use, comfort, and long-distance rides.",
    fallbackSpecs: { cc: "313 cc", torque: "28 Nm", horsepower: "34 hp" }
  },
  "Honda CBR600rr": {
    wikiTitle: "Honda_CBR600RR",
    fallbackDescription:
      "Honda CBR600RR is a supersport machine with aggressive power delivery and race-focused ergonomics.",
    fallbackSpecs: { cc: "599 cc", torque: "66 Nm", horsepower: "119 hp" }
  },
  "Yamaha Aerox 155": {
    wikiTitle: "Yamaha_Aerox",
    fallbackDescription:
      "Yamaha Aerox 155 is a sporty maxi-scooter offering quick acceleration and premium urban comfort.",
    fallbackSpecs: { cc: "155 cc", torque: "13.9 Nm", horsepower: "15 hp" }
  },
  "Honda PCX": {
    wikiTitle: "Honda_PCX",
    fallbackDescription:
      "Honda PCX is a refined scooter with smooth performance, practical storage, and efficient city cruising.",
    fallbackSpecs: { cc: "157 cc", torque: "15 Nm", horsepower: "16 hp" }
  },
  "Burgman 400": {
    wikiTitle: "Suzuki_Burgman",
    fallbackDescription:
      "Burgman 400 is a comfortable touring scooter with strong mid-range performance and relaxed ergonomics.",
    fallbackSpecs: { cc: "400 cc", torque: "35 Nm", horsepower: "29 hp" }
  }
};

const mumbaiPickupLocations = [
  {
    name: "Andheri West Metro Gate",
    address: "Near Azad Nagar Metro Station, Andheri West, Mumbai",
    query: "Azad Nagar Metro Station Andheri West Mumbai"
  },
  {
    name: "Bandra Bandstand Point",
    address: "Bandstand Promenade, Bandra West, Mumbai",
    query: "Bandstand Promenade Bandra West Mumbai"
  },
  {
    name: "Dadar TT Circle",
    address: "Dadar TT Circle, Dadar East, Mumbai",
    query: "Dadar TT Circle Mumbai"
  },
  {
    name: "Powai Hiranandani Junction",
    address: "Hiranandani Gardens, Powai, Mumbai",
    query: "Hiranandani Gardens Powai Mumbai"
  },
  {
    name: "Colaba Causeway Start",
    address: "Colaba Causeway Road, Colaba, Mumbai",
    query: "Colaba Causeway Mumbai"
  },
  {
    name: "Navi Mumbai Vashi Plaza",
    address: "Sector 17, Vashi, Navi Mumbai",
    query: "Vashi Plaza Sector 17 Navi Mumbai"
  }
];

if (bike) {
  bikeNameEl.innerText = bike;
  bikePriceEl.innerText = String(price);
  bikeImgEl.src = img;
  bikeDescriptionEl.innerText = "Loading bike details...";
}

const randomPickup = mumbaiPickupLocations[Math.floor(Math.random() * mumbaiPickupLocations.length)];
pickupLocationNameEl.innerText = randomPickup.name;
pickupLocationAddressEl.innerText = randomPickup.address;
pickupMapEl.src = `https://maps.google.com/maps?q=${encodeURIComponent(randomPickup.query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

function setBikeDetails(specs, description) {
  bikeCcEl.innerText = specs.cc || "-";
  bikeTorqueEl.innerText = specs.torque || "-";
  bikeHorsepowerEl.innerText = specs.horsepower || "-";
  bikeDescriptionEl.innerText = description;
}

function cleanSpecValue(value) {
  if (!value) return "";
  return value.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
}

function readInfoboxMetric(doc, labels) {
  const rows = Array.from(doc.querySelectorAll("table.infobox tr"));
  for (const row of rows) {
    const th = row.querySelector("th");
    const td = row.querySelector("td");
    if (!th || !td) continue;

    const label = th.textContent.toLowerCase();
    if (labels.some((key) => label.includes(key))) {
      return cleanSpecValue(td.textContent);
    }
  }
  return "";
}

async function fetchWikipediaSummary(wikiTitle) {
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
  );
  if (!response.ok) throw new Error("summary fetch failed");
  const payload = await response.json();
  return payload.extract || "";
}

async function fetchWikipediaInfoboxSpecs(wikiTitle) {
  const response = await fetch(
    `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
      wikiTitle
    )}&format=json&prop=text&origin=*`
  );
  if (!response.ok) throw new Error("infobox fetch failed");
  const payload = await response.json();
  const html = payload?.parse?.text?.["*"];
  if (!html) throw new Error("infobox content missing");

  const doc = new DOMParser().parseFromString(html, "text/html");
  return {
    cc: readInfoboxMetric(doc, ["displacement", "engine"]),
    torque: readInfoboxMetric(doc, ["torque"]),
    horsepower: readInfoboxMetric(doc, ["power", "horsepower"])
  };
}

async function loadExternalBikeData() {
  const meta = bikeExternalMeta[bike] || {
    wikiTitle: bike,
    fallbackDescription: "A reliable rental bike built for city and highway rides.",
    fallbackSpecs: {
      cc: cc || "-",
      torque: torque || "-",
      horsepower: horsepower || "-"
    }
  };

  const defaultSpecs = {
    cc: cc || meta.fallbackSpecs.cc || "-",
    torque: torque || meta.fallbackSpecs.torque || "-",
    horsepower: horsepower || meta.fallbackSpecs.horsepower || "-"
  };
  setBikeDetails(defaultSpecs, meta.fallbackDescription);

  try {
    const [externalDescription, externalSpecs] = await Promise.all([
      fetchWikipediaSummary(meta.wikiTitle),
      fetchWikipediaInfoboxSpecs(meta.wikiTitle)
    ]);

    setBikeDetails(
      {
        cc: externalSpecs.cc || defaultSpecs.cc,
        torque: externalSpecs.torque || defaultSpecs.torque,
        horsepower: externalSpecs.horsepower || defaultSpecs.horsepower
      },
      externalDescription || meta.fallbackDescription
    );
  } catch (error) {
    setBikeDetails(defaultSpecs, meta.fallbackDescription);
  }
}

// Initialize authentication check when page loads
document.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
  loadExternalBikeData();
  initializeDatePickers();
});

let pickupPicker;
let dropPicker;

function initializeDatePickers() {
  const currentUser = getCurrentUser();
  
  // Only initialize date pickers if user is logged in
  if (currentUser) {
    pickupPicker = flatpickr("#pickup", {
      enableTime: true,
      dateFormat: "d M, Y h:i K",
      minDate: "today",
      onChange: calculateTotal
    });

    dropPicker = flatpickr("#drop", {
      enableTime: true,
      dateFormat: "d M, Y h:i K",
      minDate: "today",
      onChange: calculateTotal
    });
  }
}

loadExternalBikeData();

function setMessage(message, isError = false) {
  bookingMessage.innerText = message;
  bookingMessage.style.color = isError ? "#d93025" : "#188038";
}

function calculateTotal() {
  const pickup = pickupPicker.selectedDates[0];
  const drop = dropPicker.selectedDates[0];

  if (!pickup || !drop || drop <= pickup) {
    document.getElementById("hours").innerText = "0";
    document.getElementById("total").innerText = "0";
    return;
  }

  const diffMs = drop - pickup;
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  const total = hours * price;

  document.getElementById("hours").innerText = String(hours);
  document.getElementById("total").innerText = String(total);
}

async function getBikeIdByName(name) {
  const response = await fetch(`${API_BASE_URL}/bikes`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Failed to fetch bikes");
  }

  const matchedBike = payload.data.find((item) => item.name === name);
  if (!matchedBike) {
    throw new Error(`Bike "${name}" not found in backend database`);
  }

  return matchedBike.id;
}

async function confirmBooking() {
  try {
    // Check if user is logged in
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setMessage("Please login to book this bike", true);
      return;
    }

    setMessage("Creating booking...");

    const pickup = pickupPicker.selectedDates[0];
    const drop = dropPicker.selectedDates[0];
    const total = Number(document.getElementById("total").innerText);

    if (!pickup || !drop || total === 0) {
      setMessage("Select valid pickup and drop times", true);
      return;
    }

    // Use logged-in user's info instead of form inputs
    const customerName = currentUser.name || 'User';
    const customerEmail = currentUser.email || 'Not provided';

    const bikeId = await getBikeIdByName(bike);

    // Try backend API first
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          bikeId,
          customerName,
          customerEmail,
          startDate: pickup.toISOString(),
          endDate: drop.toISOString()
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to create booking");
      }

      localStorage.setItem("booking", JSON.stringify(payload.data));
      setMessage("Booking created. Redirecting to payment...");
      window.location.href = "payment.html";
    } catch (apiError) {
      // Fallback to local storage booking
      createLocalBooking(customerName, customerEmail, pickup, drop, total);
    }
  } catch (error) {
    setMessage(error.message, true);
  }
}

// Create local booking (fallback method)
function createLocalBooking(customerName, customerEmail, pickup, drop, total) {
  const bookingData = {
    id: Date.now().toString(),
    bikeName: bike,
    bikePrice: price,
    bikeImage: img,
    customerName,
    customerEmail,
    startDate: pickup.toISOString(),
    endDate: drop.toISOString(),
    totalHours: Math.ceil((drop - pickup) / (1000 * 60 * 60)),
    totalPrice: total,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  // Save to localStorage
  const existingBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
  existingBookings.push(bookingData);
  localStorage.setItem('userBookings', JSON.stringify(existingBookings));
  localStorage.setItem("currentBooking", JSON.stringify(bookingData));

  setMessage("Booking created. Redirecting to payment...");
  window.location.href = "payment.html";
}

window.confirmBooking = confirmBooking;

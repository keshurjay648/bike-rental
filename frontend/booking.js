const API_BASE_URL = "http://localhost:5003/api";
const API_ORIGIN = "http://localhost:5003";

const params = new URLSearchParams(window.location.search);

function readStoredBike() {
  try {
    return JSON.parse(sessionStorage.getItem("selectedBike") || "null");
  } catch {
    return null;
  }
}

const storedBike = readStoredBike();

/** Selected bike state — from URL params, then sessionStorage backup */
const selectedBike = {
  id: params.get("bikeId")
    ? Number(params.get("bikeId"))
    : storedBike?.id
      ? Number(storedBike.id)
      : null,
  name: params.get("bike") || storedBike?.name || "",
  price: Number(params.get("price") || storedBike?.price || 0),
  image: params.get("img") || storedBike?.image || "",
  cc: params.get("cc") || storedBike?.cc || "",
  torque: params.get("torque") || storedBike?.torque || "",
  horsepower: params.get("horsepower") || storedBike?.horsepower || ""
};

// If URL lost query params (clean-url redirect), restore them so refresh/share still works
if (!params.get("bike") && selectedBike.name) {
  const restored = new URLSearchParams({
    bike: selectedBike.name,
    price: String(selectedBike.price || ""),
    img: selectedBike.image || "",
    cc: selectedBike.cc || "",
    torque: selectedBike.torque || "",
    horsepower: selectedBike.horsepower || ""
  });
  if (selectedBike.id) restored.set("bikeId", String(selectedBike.id));
  const next = `${window.location.pathname}?${restored.toString()}`;
  window.history.replaceState({}, "", next);
}

// Legacy aliases used later in this file
let bike = selectedBike.name;
let price = selectedBike.price;
let img = selectedBike.image;

function resolveImageUrl(url) {
  if (!url) return "img/harly.png";
  const cleaned = String(url).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith("data:")) return cleaned;
  if (cleaned.startsWith("/uploads/")) return `${API_ORIGIN}${cleaned}`;
  return cleaned;
}

function isPlaceholderSpec(value) {
  if (!value) return true;
  const v = String(value).trim();
  return !v || v === "-" || v === "—" || v.toLowerCase() === "null" || v.toLowerCase() === "undefined";
}

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

if (selectedBike.name || selectedBike.id) {
  applyBikeToUi(selectedBike);
} else if (bikeDescriptionEl) {
  bikeDescriptionEl.innerText = "Select a bike from the home page to start booking.";
}

const randomPickup = mumbaiPickupLocations[Math.floor(Math.random() * mumbaiPickupLocations.length)];
pickupLocationNameEl.innerText = randomPickup.name;
pickupLocationAddressEl.innerText = randomPickup.address;
pickupMapEl.src = `https://maps.google.com/maps?q=${encodeURIComponent(randomPickup.query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

function applyBikeToUi(data) {
  selectedBike.id = data.id || selectedBike.id;
  selectedBike.name = data.name || selectedBike.name;
  selectedBike.price = Number(data.price || selectedBike.price || 0);
  selectedBike.image = resolveImageUrl(data.image || selectedBike.image);
  selectedBike.cc = !isPlaceholderSpec(data.cc) ? data.cc : selectedBike.cc;
  selectedBike.torque = !isPlaceholderSpec(data.torque) ? data.torque : selectedBike.torque;
  selectedBike.horsepower = !isPlaceholderSpec(data.horsepower)
    ? data.horsepower
    : selectedBike.horsepower;

  bike = selectedBike.name;
  price = selectedBike.price;
  img = selectedBike.image;

  if (bikeNameEl) bikeNameEl.innerText = selectedBike.name || "Bike";
  if (bikePriceEl) bikePriceEl.innerText = selectedBike.price ? String(selectedBike.price) : "—";
  if (bikeImgEl) {
    bikeImgEl.src = selectedBike.image || "img/harly.png";
    bikeImgEl.onerror = () => {
      bikeImgEl.onerror = null;
      bikeImgEl.src = "img/harly.png";
    };
  }
}

function setBikeDetails(specs, description) {
  bikeCcEl.innerText = !isPlaceholderSpec(specs.cc) ? specs.cc : "-";
  bikeTorqueEl.innerText = !isPlaceholderSpec(specs.torque) ? specs.torque : "-";
  bikeHorsepowerEl.innerText = !isPlaceholderSpec(specs.horsepower) ? specs.horsepower : "-";
  if (description) bikeDescriptionEl.innerText = description;
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
  if (!wikiTitle || String(wikiTitle).toLowerCase() === "null") {
    throw new Error("missing wiki title");
  }
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
  );
  if (!response.ok) throw new Error("summary fetch failed");
  const payload = await response.json();
  return payload.extract || "";
}

async function fetchWikipediaInfoboxSpecs(wikiTitle) {
  if (!wikiTitle || String(wikiTitle).toLowerCase() === "null") {
    throw new Error("missing wiki title");
  }
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

async function hydrateBikeFromApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/bikes`);
    const payload = await response.json();
    if (!response.ok || !payload.success) return null;

    const rows = payload.data || [];
    let match = null;
    if (selectedBike.id) {
      match = rows.find((item) => Number(item.id) === Number(selectedBike.id));
    }
    if (!match && selectedBike.name) {
      match = rows.find(
        (item) =>
          String(item.name || "").toLowerCase() === selectedBike.name.toLowerCase()
      );
    }
    if (!match) return null;

    return {
      id: match.id,
      name: match.name,
      price: Math.round(Number(match.price_per_hour) || 0),
      image: resolveImageUrl(match.image_url),
      cc: match.engine_cc || "",
      torque: match.torque || "",
      horsepower: match.horsepower || ""
    };
  } catch {
    return null;
  }
}

async function loadExternalBikeData() {
  const fromApi = await hydrateBikeFromApi();
  if (fromApi) {
    applyBikeToUi({
      ...fromApi,
      // Prefer API specs, else keep URL params
      cc: fromApi.cc || selectedBike.cc,
      torque: fromApi.torque || selectedBike.torque,
      horsepower: fromApi.horsepower || selectedBike.horsepower,
      image: selectedBike.image && selectedBike.image.includes("/uploads/")
        ? selectedBike.image
        : fromApi.image || selectedBike.image,
      price: fromApi.price || selectedBike.price
    });
  }

  if (!selectedBike.name && !selectedBike.id) {
    setBikeDetails(
      { cc: "-", torque: "-", horsepower: "-" },
      "No bike selected. Go back to the home page and choose a bike to book."
    );
    return;
  }

  const name = selectedBike.name;
  const meta = bikeExternalMeta[name] || {
    wikiTitle: null,
    fallbackDescription: `${name} is available for hourly rental in Mumbai.`,
    fallbackSpecs: {
      cc: selectedBike.cc || "-",
      torque: selectedBike.torque || "-",
      horsepower: selectedBike.horsepower || "-"
    }
  };

  const defaultSpecs = {
    cc: !isPlaceholderSpec(selectedBike.cc) ? selectedBike.cc : meta.fallbackSpecs.cc,
    torque: !isPlaceholderSpec(selectedBike.torque)
      ? selectedBike.torque
      : meta.fallbackSpecs.torque,
    horsepower: !isPlaceholderSpec(selectedBike.horsepower)
      ? selectedBike.horsepower
      : meta.fallbackSpecs.horsepower
  };

  setBikeDetails(defaultSpecs, meta.fallbackDescription);

  // Only enrich from Wikipedia for known catalog bikes with a real wiki page
  if (!meta.wikiTitle) return;

  try {
    const [externalDescription, externalSpecs] = await Promise.all([
      fetchWikipediaSummary(meta.wikiTitle),
      fetchWikipediaInfoboxSpecs(meta.wikiTitle)
    ]);

    setBikeDetails(
      {
        cc: !isPlaceholderSpec(defaultSpecs.cc) ? defaultSpecs.cc : externalSpecs.cc || defaultSpecs.cc,
        torque: !isPlaceholderSpec(defaultSpecs.torque)
          ? defaultSpecs.torque
          : externalSpecs.torque || defaultSpecs.torque,
        horsepower: !isPlaceholderSpec(defaultSpecs.horsepower)
          ? defaultSpecs.horsepower
          : externalSpecs.horsepower || defaultSpecs.horsepower
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

  // Keep full booking URL (with bike params) when sending user to login/signup
  const returnTo = encodeURIComponent(
    `${window.location.pathname}${window.location.search}` || "booking.html"
  );
  const loginLink = document.getElementById("bookingLoginLink");
  const signupLink = document.getElementById("bookingSignupLink");
  if (loginLink) loginLink.href = `login.html?redirect=${returnTo}`;
  if (signupLink) signupLink.href = `signup.html?redirect=${returnTo}`;

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
  if (selectedBike.id) return selectedBike.id;

  const response = await fetch(`${API_BASE_URL}/bikes`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Failed to fetch bikes");
  }

  const matchedBike = payload.data.find(
    (item) => String(item.name || "").toLowerCase() === String(name || "").toLowerCase()
  );
  if (!matchedBike) {
    throw new Error(`Bike "${name}" not found in backend database`);
  }

  selectedBike.id = matchedBike.id;
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

    if (!selectedBike.name && !selectedBike.id) {
      setMessage("No bike selected. Go back and choose a bike.", true);
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

    const bikeId = await getBikeIdByName(selectedBike.name);

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
      localStorage.setItem("currentBooking", JSON.stringify(payload.data));
      if (window.showToast) showToast('Booking confirmed! Redirecting…', 'success');
      setMessage("Booking created. Redirecting to payment...");
      setTimeout(() => { window.location.href = "payment.html"; }, 800);
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

  if (window.showToast) showToast('Booking confirmed! Redirecting…', 'success');
  setMessage("Booking created. Redirecting to payment...");
  setTimeout(() => { window.location.href = "payment.html"; }, 800);
}

window.confirmBooking = confirmBooking;

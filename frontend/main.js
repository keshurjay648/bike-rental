const bikeData = [
  {
    name: "BMW G310",
    type: "Naked",
    price: "180",
    image: "img/g310.png",
    tag: "Free cancellation",
    cc: "313 cc",
    torque: "28 Nm",
    horsepower: "34 hp"
  },
  {
    name: "TVS RR310",
    type: "Sports",
    price: "190",
    image: "img/tvsrr.png",
    tag: "Free cancellation",
    cc: "312 cc",
    torque: "29 Nm",
    horsepower: "34 hp"
  },
  {
    name: "TVS RTR160",
    type: "Naked",
    price: "120",
    image: "img/rtr160.png",
    tag: "Free cancellation",
    cc: "159 cc",
    torque: "14 Nm",
    horsepower: "16 hp"
  },
  {
    name: "BMW GS310",
    type: "Adventure",
    price: "200",
    image: "img/gs310.png",
    tag: "Free cancellation",
    cc: "313 cc",
    torque: "28 Nm",
    horsepower: "34 hp"
  },
  {
    name: "Honda CBR600rr",
    type: "Sports",
    price: "210",
    image: "img/cbr.png",
    tag: "Free cancellation",
    cc: "599 cc",
    torque: "66 Nm",
    horsepower: "119 hp"
  },
  {
    name: "Yamaha Aerox 155",
    type: "Scooter",
    price: "80",
    image: "img/yama.png",
    tag: "Free cancellation",
    cc: "155 cc",
    torque: "13.9 Nm",
    horsepower: "15 hp"
  },
  {
    name: "Honda PCX",
    type: "Scooter",
    price: "90",
    image: "img/pcx.png",
    tag: "Free cancellation",
    cc: "157 cc",
    torque: "15 Nm",
    horsepower: "16 hp"
  },
  {
    name: "Burgman 400",
    type: "Scooter",
    price: "140",
    image: "img/burg.png",
    tag: "Free cancellation",
    cc: "400 cc",
    torque: "35 Nm",
    horsepower: "29 hp"
  }
];

const destinationData = [
  {
    city: "Mumbai",
    description: "Marine Drive sunsets, Bandra lanes, and sea breeze weekend rides."
  },
  {
    city: "Jaipur",
    description: "Ride through forts, palaces, and colorful old-city streets."
  },
  {
    city: "Delhi",
    description: "Explore India Gate, old bazaars, and broad express roads."
  },
  {
    city: "Manipur",
    description: "Green hills, winding roads, and scenic routes around Loktak Lake."
  }
];

const reviewData = [
  {
    name: "Aman Verma",
    city: "Mumbai",
    text: "Bike was clean, pickup was fast, and booking process was super smooth."
  },
  {
    name: "Priya Sharma",
    city: "Jaipur",
    text: "Great support team and fair pricing. I enjoyed the full day trip."
  },
  {
    name: "Rohit Mehta",
    city: "Delhi",
    text: "Helmet and bike condition were excellent. Will definitely book again."
  },
  {
    name: "Nikita Singh",
    city: "Manipur",
    text: "Loved the ride quality and easy payment flow. Highly recommended."
  }
];

const createBikeBox = (bike) => `
<div class="bike-box">
    <img src="${bike.image}" alt="${bike.name}" class="bike-img">
    <div class="bike-content">
        <span class="tag">${bike.tag}</span>
        <div class="title-price">
            <div class="title-data">
                <h2>${bike.name}</h2>
                <p>${bike.type}</p>
            </div>
            <h3 class="bike-price">₹${bike.price}<span>/hour</span></h3>
        </div>
    </div>
    <a href="booking.html?bike=${encodeURIComponent(bike.name)}&price=${bike.price}&img=${encodeURIComponent(
  bike.image
)}&cc=${encodeURIComponent(bike.cc)}&torque=${encodeURIComponent(
  bike.torque
)}&horsepower=${encodeURIComponent(bike.horsepower)}" class="book-btn">
      Book Bike
    </a>
</div>`;

const createDestinationCard = (destination) => `
<article class="destination-card">
  <h3>${destination.city}</h3>
  <p>${destination.description}</p>
</article>`;

const createReviewCard = (review) => `
<article class="review-card">
  <h3>${review.name}</h3>
  <span>${review.city}</span>
  <p>${review.text}</p>
</article>`;

const bikesContainer = document.querySelector(".bikes-content");
const noResults = document.getElementById("no-results");

// --- search & filter state ---
let activeType = "All";
let maxPrice = 250;
let searchQuery = "";

function renderBikes() {
  if (!bikesContainer) return;

  const filtered = bikeData.filter((bike) => {
    const matchType = activeType === "All" || bike.type === activeType;
    const matchPrice = parseInt(bike.price) <= maxPrice;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      bike.name.toLowerCase().includes(q) ||
      bike.type.toLowerCase().includes(q);
    return matchType && matchPrice && matchSearch;
  });

  bikesContainer.innerHTML = "";
  filtered.forEach((bike) => {
    bikesContainer.insertAdjacentHTML("beforeend", createBikeBox(bike));
  });

  if (noResults) {
    noResults.classList.toggle("hidden", filtered.length > 0);
  }
}

if (bikesContainer) {
  renderBikes();

  // search input
  const searchInput = document.getElementById("bike-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderBikes();
    });
  }

  // type filter buttons
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeType = btn.dataset.type;
      renderBikes();
    });
  });

  // price range slider
  const priceRange = document.getElementById("price-range");
  const priceLabel = document.getElementById("price-label");
  if (priceRange) {
    priceRange.addEventListener("input", () => {
      maxPrice = parseInt(priceRange.value);
      if (priceLabel) priceLabel.textContent = `₹${maxPrice}/hr`;
      renderBikes();
    });
  }
}

const destinationContainer = document.querySelector(".destination-content");
if (destinationContainer) {
  destinationData.forEach((destination) => {
    destinationContainer.insertAdjacentHTML("beforeend", createDestinationCard(destination));
  });
}

const reviewsContainer = document.querySelector(".reviews-content");
if (reviewsContainer) {
  reviewData.forEach((review) => {
    reviewsContainer.insertAdjacentHTML("beforeend", createReviewCard(review));
  });
}

const menu = document.querySelector(".menu-icon");
if (menu) {
  menu.onclick = () => {
    menu.classList.toggle("move");
  };
}

// ── Bike Quick-View Modal ─────────────────────────────────────────────────
const bikeModal      = document.getElementById('bikeModal');
const bikeModalClose = document.getElementById('bikeModalClose');

function openBikeModal(bike) {
  if (!bikeModal) return;
  document.getElementById('modalBikeImg').src       = bike.image;
  document.getElementById('modalBikeImg').alt       = bike.name;
  document.getElementById('modalBikeTag').textContent  = bike.tag;
  document.getElementById('modalBikeName').textContent = bike.name;
  document.getElementById('modalBikeType').textContent = bike.type;
  document.getElementById('modalBikeCc').textContent   = bike.cc;
  document.getElementById('modalBikeTorque').textContent = bike.torque;
  document.getElementById('modalBikeHp').textContent   = bike.horsepower;
  document.getElementById('modalBikePrice').textContent = bike.price;
  document.getElementById('modalBookBtn').href =
    `booking.html?bike=${encodeURIComponent(bike.name)}&price=${bike.price}` +
    `&img=${encodeURIComponent(bike.image)}&cc=${encodeURIComponent(bike.cc)}` +
    `&torque=${encodeURIComponent(bike.torque)}&horsepower=${encodeURIComponent(bike.horsepower)}`;
  bikeModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBikeModal() {
  if (!bikeModal) return;
  bikeModal.classList.add('hidden');
  document.body.style.overflow = '';
}

if (bikeModalClose) bikeModalClose.addEventListener('click', closeBikeModal);
if (bikeModal) {
  bikeModal.addEventListener('click', (e) => { if (e.target === bikeModal) closeBikeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBikeModal(); });
}

// Attach "quick view" on bike image click — re-run after each renderBikes
function attachModalTriggers() {
  if (!bikesContainer) return;
  bikesContainer.querySelectorAll('.bike-img').forEach((img, i) => {
    const filtered = bikeData.filter((bike) => {
      const matchType   = activeType === "All" || bike.type === activeType;
      const matchPrice  = parseInt(bike.price) <= maxPrice;
      const q           = searchQuery.toLowerCase();
      const matchSearch = !q || bike.name.toLowerCase().includes(q) || bike.type.toLowerCase().includes(q);
      return matchType && matchPrice && matchSearch;
    });
    if (filtered[i]) {
      img.style.cursor = 'pointer';
      img.title = 'Quick view';
      img.addEventListener('click', (e) => {
        e.preventDefault();
        openBikeModal(filtered[i]);
      });
    }
  });
}

// Patch renderBikes to also attach triggers
const _origRender = renderBikes;
// eslint-disable-next-line no-global-assign
window._renderBikes = function () {
  _origRender();
  attachModalTriggers();
};
// Run once on load
if (bikesContainer) attachModalTriggers();

// ── Scroll-to-top button ──────────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.remove('hidden');
    } else {
      scrollTopBtn.classList.add('hidden');
    }
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

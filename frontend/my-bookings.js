const API_BASE_URL = 'http://localhost:5003/api';
const API_ORIGIN = 'http://localhost:5003';

function resolveImageUrl(url) {
  if (!url) return 'img/harly.png';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return url;
}

// ── Auth guard ────────────────────────────────────────────────────────────
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if (!currentUser) {
  window.location.href = 'login.html?redirect=my-bookings.html';
}

// ── DOM refs ──────────────────────────────────────────────────────────────
const loadingEl = document.getElementById('bookingsLoading');
const emptyEl   = document.getElementById('bookingsEmpty');
const gridEl    = document.getElementById('bookingsGrid');
const modal     = document.getElementById('cancelModal');
const modalYes  = document.getElementById('cancelModalYes');
const modalNo   = document.getElementById('cancelModalNo');

let allBookings = [];
let activeStatus = 'all';
let pendingCancelId = null;

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function statusClass(status) {
  const map = { confirmed: 'status-confirmed', completed: 'status-completed',
                cancelled: 'status-cancelled', pending: 'status-pending' };
  return map[status] || 'status-pending';
}

// ── Render ────────────────────────────────────────────────────────────────
function renderBookings(bookings) {
  gridEl.innerHTML = '';

  const filtered = activeStatus === 'all'
    ? bookings
    : bookings.filter(b => (b.status || b.booking_status || '').toLowerCase() === activeStatus);

  if (filtered.length === 0) {
    loadingEl.classList.add('hidden');
    gridEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  loadingEl.classList.add('hidden');
  gridEl.classList.remove('hidden');

  filtered.forEach(b => {
    const status   = (b.status || b.booking_status || 'pending').toLowerCase();
    const bikeName = b.bikeName || b.bike_name || 'Bike';
    const bikeImg  = resolveImageUrl(b.bikeImage || b.bike_image || 'img/harly.png');
    const bikeType = b.bikeType || b.bike_type || '';
    const amount   = b.totalPrice || b.total_amount || b.total_price || 0;
    const start    = b.startDate || b.start_date;
    const end      = b.endDate   || b.end_date;
    const hours    = b.totalHours || b.total_hours || '—';
    const id       = b.id;

    const canCancel = status === 'confirmed' || status === 'pending';

    const card = document.createElement('div');
    card.className = 'booking-card';
    card.innerHTML = `
      <div class="booking-card-top">
        <img src="${bikeImg}" alt="${bikeName}" class="booking-card-img" onerror="this.src='img/harly.png'">
        <div>
          <div class="booking-card-name">${bikeName}</div>
          ${bikeType ? `<div class="booking-card-type">${bikeType}</div>` : ''}
        </div>
        <span class="booking-status-badge ${statusClass(status)}">${status}</span>
      </div>
      <div class="booking-card-body">
        <div class="booking-detail-row">
          <i class="ri-calendar-line"></i>
          <span>${formatDate(start)}</span>
        </div>
        <div class="booking-detail-row">
          <i class="ri-calendar-check-line"></i>
          <span>${formatDate(end)}</span>
        </div>
        <div class="booking-detail-row">
          <i class="ri-time-line"></i>
          <span>${hours} hour${hours !== 1 ? 's' : ''}</span>
        </div>
        <div class="booking-amount">₹${Number(amount).toLocaleString('en-IN')}</div>
      </div>
      <div class="booking-card-footer">
        ${canCancel ? `<button class="card-btn card-btn-cancel" data-id="${id}"><i class="ri-close-circle-line"></i> Cancel</button>` : ''}
        <button class="card-btn card-btn-rebook" data-bike="${encodeURIComponent(bikeName)}">
          <i class="ri-repeat-line"></i> Book Again
        </button>
      </div>
    `;

    // Cancel
    const cancelBtn = card.querySelector('.card-btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => openCancelModal(id));
    }

    // Rebook
    card.querySelector('.card-btn-rebook').addEventListener('click', () => {
      const match = (window._bikeData || []).find(bk => bk.name === bikeName);
      if (match) {
        window.location.href = `booking.html?bike=${encodeURIComponent(match.name)}&price=${match.price}&img=${encodeURIComponent(match.image)}&cc=${encodeURIComponent(match.cc)}&torque=${encodeURIComponent(match.torque)}&horsepower=${encodeURIComponent(match.horsepower)}`;
      } else {
        window.location.href = 'index.html#bikes';
      }
    });

    gridEl.appendChild(card);
  });
}

// ── Cancel modal ──────────────────────────────────────────────────────────
function openCancelModal(id) {
  pendingCancelId = id;
  modal.classList.remove('hidden');
}

modalNo.addEventListener('click', () => {
  modal.classList.add('hidden');
  pendingCancelId = null;
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) { modal.classList.add('hidden'); pendingCancelId = null; }
});

modalYes.addEventListener('click', async () => {
  if (!pendingCancelId) return;
  modal.classList.add('hidden');
  await cancelBooking(pendingCancelId);
  pendingCancelId = null;
});

async function cancelBooking(id) {
  // Try backend first
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Booking cancelled successfully.', 'success');
      await loadBookings();
      return;
    }
  } catch (_) { /* fall through to local */ }

  // Fallback: update localStorage
  const local = JSON.parse(localStorage.getItem('userBookings') || '[]');
  const updated = local.map(b => b.id === id ? { ...b, status: 'cancelled' } : b);
  localStorage.setItem('userBookings', JSON.stringify(updated));
  allBookings = allBookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b);
  renderBookings(allBookings);
  showToast('Booking cancelled.', 'success');
}

// ── Load bookings ─────────────────────────────────────────────────────────
async function loadBookings() {
  loadingEl.classList.remove('hidden');
  gridEl.classList.add('hidden');
  emptyEl.classList.add('hidden');

  let bookings = [];

  // Try backend
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/bookings/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      bookings = data.data || data.bookings || [];
    }
  } catch (_) { /* fall through */ }

  // Merge with localStorage bookings
  const local = JSON.parse(localStorage.getItem('userBookings') || '[]');
  const backendIds = new Set(bookings.map(b => String(b.id)));
  const localOnly = local.filter(b => !backendIds.has(String(b.id)));
  bookings = [...bookings, ...localOnly];

  // Sort newest first
  bookings.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

  allBookings = bookings;
  renderBookings(allBookings);
}

// ── Tab filters ───────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.dataset.status;
    renderBookings(allBookings);
  });
});

// ── Bike data for rebook ──────────────────────────────────────────────────
window._bikeData = [
  { name: "BMW G310",            type: "Naked",     price: "180", image: "img/g310.png",   cc: "313 cc",              torque: "28 Nm",   horsepower: "34 hp"  },
  { name: "TVS RR310",           type: "Sports",    price: "190", image: "img/tvsrr.png",  cc: "312 cc",              torque: "29 Nm",   horsepower: "34 hp"  },
  { name: "TVS RTR160",          type: "Naked",     price: "120", image: "img/rtr160.png", cc: "159 cc",              torque: "14 Nm",   horsepower: "16 hp"  },
  { name: "BMW GS310",           type: "Adventure", price: "200", image: "img/gs310.png",  cc: "313 cc",              torque: "28 Nm",   horsepower: "34 hp"  },
  { name: "Honda CBR600rr",      type: "Sports",    price: "210", image: "img/cbr.png",    cc: "599 cc",              torque: "66 Nm",   horsepower: "119 hp" },
  { name: "Yamaha Aerox 155",    type: "Scooter",   price: "80",  image: "img/yama.png",   cc: "155 cc",              torque: "13.9 Nm", horsepower: "15 hp"  },
  { name: "Honda PCX",           type: "Scooter",   price: "90",  image: "img/pcx.png",    cc: "157 cc",              torque: "15 Nm",   horsepower: "16 hp"  },
  { name: "Burgman 400",         type: "Scooter",   price: "140", image: "img/burg.png",   cc: "400 cc",              torque: "35 Nm",   horsepower: "29 hp"  },
  { name: "Harley Davidson LiveWire", type: "Electric", price: "160", image: "img/harly.png", cc: "105 kW electric motor", torque: "116 Nm", horsepower: "105 hp" },
];

// ── Init ──────────────────────────────────────────────────────────────────
loadBookings();

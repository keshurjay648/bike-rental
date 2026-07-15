const API_BASE_URL = 'http://localhost:5003/api';
const API_ORIGIN = 'http://localhost:5003';

const gateEl = document.getElementById('adminGate');
const gateMessage = document.getElementById('adminGateMessage');
const loginLink = document.getElementById('adminLoginLink');
const homeLink = document.getElementById('adminHomeLink');
const dashboardEl = document.getElementById('adminDashboard');

let fleetData = [];
let fleetFilter = 'all';

/** Resolve DB image paths so /uploads/... loads from the API server */
function resolveImageUrl(url) {
  if (!url) return 'img/harly.png';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return url;
}

function authHeaders(json = true) {
  const token = localStorage.getItem('authToken');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function toast(message, type = 'info') {
  if (typeof window.showToast === 'function') window.showToast(message, type);
  else console.log(`[${type}]`, message);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showGate(message, { showLogin = false, showHome = false } = {}) {
  gateEl.classList.remove('hidden');
  dashboardEl.classList.add('hidden');
  gateMessage.textContent = message;
  loginLink.style.display = showLogin ? 'inline-flex' : 'none';
  homeLink.style.display = showHome ? 'inline-flex' : 'none';
}

function showDashboard() {
  gateEl.classList.add('hidden');
  dashboardEl.classList.remove('hidden');
}

async function api(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(!isFormData),
      ...(options.headers || {})
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return data;
}

async function ensureAdmin() {
  const token = localStorage.getItem('authToken');
  const cached = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (!token || !cached) {
    window.location.replace('admin-access.html');
    return false;
  }

  try {
    const me = await api('/auth/me');
    const user = me.data?.user;
    if (!user?.isAdmin) {
      showGate('Your account does not have admin access.', {
        showHome: true
      });
      return false;
    }
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        ...cached,
        ...user,
        isAdmin: true,
        role: user.role || 'admin'
      })
    );
    showDashboard();
    return true;
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      window.location.replace('admin-access.html');
    } else {
      showGate(error.message || 'Could not verify admin access.', {
        showLogin: true,
        showHome: true
      });
    }
    return false;
  }
}

function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

function fleetStatusBadge(bike) {
  if (bike.is_currently_booked) {
    return '<span class="badge badge-booked">Booked</span>';
  }
  if (bike.availability_status === 'unavailable') {
    return '<span class="badge badge-unavailable">Unavailable</span>';
  }
  return '<span class="badge badge-available">Available</span>';
}

function renderFleet() {
  const body = document.getElementById('fleetBody');
  const loading = document.getElementById('fleetLoading');
  loading.classList.add('hidden');

  const filtered = fleetData.filter((bike) => {
    if (fleetFilter === 'all') return true;
    if (fleetFilter === 'booked') return bike.is_currently_booked;
    if (fleetFilter === 'unavailable') {
      return !bike.is_currently_booked && bike.availability_status === 'unavailable';
    }
    if (fleetFilter === 'available') {
      return !bike.is_currently_booked && bike.availability_status === 'available';
    }
    return true;
  });

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#666;padding:2rem;">No bikes in this filter</td></tr>`;
    return;
  }

  body.innerHTML = filtered
    .map((bike) => {
      const img = resolveImageUrl(bike.image_url);
      const booking = bike.current_booking;
      const bookingHtml = booking
        ? `<div class="booking-meta">
             <strong>${booking.customer_name || ''}</strong><br>
             ${formatDate(booking.start_date)} → ${formatDate(booking.end_date)}
           </div>`
        : '<span style="color:#999;">—</span>';

      const specs = [bike.engine_cc, bike.torque, bike.horsepower]
        .filter(Boolean)
        .join(' · ') || '—';

      const nextStatus =
        bike.availability_status === 'available' ? 'unavailable' : 'available';
      const toggleLabel =
        bike.availability_status === 'available' ? 'Mark unavailable' : 'Mark available';

      return `
        <tr data-id="${bike.id}">
          <td>
            <div class="bike-cell">
              <img src="${img}" alt="" onerror="this.src='img/harly.png'">
              <div>
                <strong>${bike.name}</strong>
                ${bike.brand ? `<div class="booking-meta">${bike.brand}</div>` : ''}
              </div>
            </div>
          </td>
          <td>${bike.type || '—'}</td>
          <td><div class="booking-meta">${specs}</div></td>
          <td>₹${bike.price_per_hour}</td>
          <td>${fleetStatusBadge(bike)}</td>
          <td>${bookingHtml}</td>
          <td>
            <div class="row-actions">
              <button type="button" class="admin-btn small outline" data-action="toggle" data-status="${nextStatus}">
                ${toggleLabel}
              </button>
              <button type="button" class="admin-btn small danger" data-action="delete">
                Remove
              </button>
            </div>
          </td>
        </tr>`;
    })
    .join('');
}

function updateStats(bikes, users) {
  const available = bikes.filter(
    (b) => !b.is_currently_booked && b.availability_status === 'available'
  ).length;
  const booked = bikes.filter((b) => b.is_currently_booked).length;

  document.getElementById('statBikes').textContent = bikes.length;
  document.getElementById('statAvailable').textContent = available;
  document.getElementById('statBooked').textContent = booked;
  document.getElementById('statUsers').textContent = users.length;
}

async function loadFleet() {
  const loading = document.getElementById('fleetLoading');
  loading.classList.remove('hidden');
  try {
    const result = await api('/bikes/admin/availability');
    fleetData = result.data || [];
    renderFleet();
  } catch (error) {
    loading.textContent = error.message || 'Failed to load fleet';
    toast(error.message, 'error');
  }
}

async function loadBookings() {
  const loading = document.getElementById('bookingsLoading');
  const body = document.getElementById('bookingsBody');
  loading.classList.remove('hidden');
  loading.textContent = 'Loading bookings…';

  try {
    const result = await api('/bookings');
    const rows = result.data || [];
    loading.classList.add('hidden');

    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#666;padding:2rem;">No bookings yet</td></tr>`;
      return;
    }

    body.innerHTML = rows
      .map((b) => {
        const status = (b.booking_status || 'pending').toLowerCase();
        const pay = (b.payment_status || 'pending').toLowerCase();
        const canCancel = status === 'pending' || status === 'confirmed';
        return `
          <tr data-booking-id="${b.id}">
            <td>#${b.id}</td>
            <td>${b.bike_name || '—'}</td>
            <td>
              <strong>${b.customer_name || ''}</strong>
              <div class="booking-meta">${b.customer_email || ''}</div>
            </td>
            <td>
              <div class="booking-meta">
                ${formatDate(b.start_date)}<br>→ ${formatDate(b.end_date)}
                <br>${b.total_hours || '—'} hrs
              </div>
            </td>
            <td>₹${b.total_amount}</td>
            <td><span class="badge badge-${status}">${status}</span></td>
            <td><span class="badge badge-${pay}">${pay}</span></td>
            <td>
              <div class="row-actions">
                ${
                  canCancel
                    ? `<button type="button" class="admin-btn small outline" data-booking-action="cancel">Cancel</button>`
                    : ''
                }
                <button type="button" class="admin-btn small danger" data-booking-action="delete">Delete</button>
              </div>
            </td>
          </tr>`;
      })
      .join('');
  } catch (error) {
    loading.textContent = error.message || 'Failed to load bookings';
  }
}

async function loadUsers() {
  const loading = document.getElementById('usersLoading');
  const body = document.getElementById('usersBody');
  loading.classList.remove('hidden');
  loading.textContent = 'Loading users…';

  try {
    const result = await api('/users');
    const rows = result.data || [];
    loading.classList.add('hidden');

    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#666;padding:2rem;">No users yet</td></tr>`;
      return rows;
    }

    body.innerHTML = rows
      .map((u) => {
        const verified = u.phone_verified
          ? '<span class="badge badge-confirmed">Phone</span>'
          : '<span class="badge badge-unavailable">Unverified</span>';
        const role = u.is_admin || u.role === 'admin'
          ? '<span class="badge badge-admin">Admin</span>'
          : '<span class="badge badge-unavailable">User</span>';
        return `
          <tr>
            <td><strong>${u.name || '—'}</strong></td>
            <td>${u.email || '—'}</td>
            <td>${u.phone || '—'}</td>
            <td>${verified}</td>
            <td>${role}</td>
            <td>${formatDate(u.created_at)}</td>
          </tr>`;
      })
      .join('');

    return rows;
  } catch (error) {
    loading.textContent = error.message || 'Failed to load users';
    return [];
  }
}

async function refreshAll() {
  const [, , users] = await Promise.all([
    loadFleet(),
    loadBookings(),
    loadUsers()
  ]);
  updateStats(fleetData, users || []);
}

// Tabs
document.querySelectorAll('.admin-tabs .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tabs .tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const panel = btn.dataset.panel;
    document.querySelectorAll('.admin-panel').forEach((el) => el.classList.add('hidden'));
    document.getElementById(`panel-${panel}`)?.classList.remove('hidden');
  });
});

// Fleet filters
document.querySelectorAll('.fleet-filters .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.fleet-filters .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    fleetFilter = chip.dataset.fleet;
    renderFleet();
  });
});

document.getElementById('refreshAll')?.addEventListener('click', () => {
  refreshAll().then(() => toast('Dashboard refreshed', 'success'));
});

const bikeImageInput = document.getElementById('bikeImageInput');
const bikeImagePreview = document.getElementById('bikeImagePreview');
const bikeImagePreviewWrap = document.getElementById('bikeImagePreviewWrap');
const clearBikeImageBtn = document.getElementById('clearBikeImage');

bikeImageInput?.addEventListener('change', () => {
  const file = bikeImageInput.files?.[0];
  if (!file) {
    bikeImagePreviewWrap?.classList.add('hidden');
    return;
  }
  bikeImagePreview.src = URL.createObjectURL(file);
  bikeImagePreviewWrap?.classList.remove('hidden');
});

clearBikeImageBtn?.addEventListener('click', () => {
  if (bikeImageInput) bikeImageInput.value = '';
  if (bikeImagePreview) bikeImagePreview.src = '';
  bikeImagePreviewWrap?.classList.add('hidden');
});

document.getElementById('addBikeForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const imageFile = form.image?.files?.[0];

  if (!imageFile) {
    toast('Please choose a bike image', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', form.name.value.trim());
  formData.append('brand', form.brand.value.trim());
  formData.append('type', form.type.value);
  formData.append('pricePerHour', form.pricePerHour.value);
  formData.append('engineCc', form.engineCc.value.trim());
  formData.append('torque', form.torque.value.trim());
  formData.append('horsepower', form.horsepower.value.trim());
  formData.append('availabilityStatus', form.availabilityStatus.value);
  formData.append('image', imageFile);

  try {
    await api('/bikes', {
      method: 'POST',
      body: formData
    });
    form.reset();
    bikeImagePreviewWrap?.classList.add('hidden');
    if (bikeImagePreview) bikeImagePreview.src = '';
    toast('Bike added', 'success');
    await refreshAll();
  } catch (error) {
    toast(error.message || 'Failed to add bike', 'error');
  }
});

document.getElementById('fleetBody')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const row = btn.closest('tr');
  const id = row?.dataset.id;
  if (!id) return;

  if (btn.dataset.action === 'toggle') {
    try {
      await api(`/bikes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ availabilityStatus: btn.dataset.status })
      });
      toast('Availability updated', 'success');
      await refreshAll();
    } catch (error) {
      toast(error.message || 'Update failed', 'error');
    }
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm('Remove this bike from the fleet?')) return;
    try {
      await api(`/bikes/${id}`, { method: 'DELETE' });
      toast('Bike removed', 'success');
      await refreshAll();
    } catch (error) {
      toast(error.message || 'Delete failed', 'error');
    }
  }
});

document.getElementById('bookingsBody')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-booking-action]');
  if (!btn) return;
  const row = btn.closest('tr');
  const id = row?.dataset.bookingId;
  if (!id) return;

  const action = btn.dataset.bookingAction;

  if (action === 'cancel') {
    if (!confirm(`Cancel booking #${id}? The bike will become free for that time slot.`)) return;
    try {
      await api(`/bookings/${id}/cancel`, { method: 'PATCH' });
      toast('Booking cancelled', 'success');
      await refreshAll();
    } catch (error) {
      toast(error.message || 'Cancel failed', 'error');
    }
  }

  if (action === 'delete') {
    if (!confirm(`Permanently delete booking #${id}? This cannot be undone.`)) return;
    try {
      await api(`/bookings/${id}`, { method: 'DELETE' });
      toast('Booking deleted', 'success');
      await refreshAll();
    } catch (error) {
      toast(error.message || 'Delete failed', 'error');
    }
  }
});

(async function init() {
  const ok = await ensureAdmin();
  if (ok) await refreshAll();
})();

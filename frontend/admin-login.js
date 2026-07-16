const API_BASE_URL = 'https://bike-rental-2-msm9.onrender.com/api';

const form = document.getElementById('adminLoginForm');
const messageEl = document.getElementById('adminLoginMessage');
const emailInput = document.getElementById('adminEmail');
const passwordInput = document.getElementById('adminPassword');
const passwordToggle = document.getElementById('adminPasswordToggle');

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#c62828' : '#2e7d32';
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

async function verifyAdmin(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not verify admin access');
  return data.data?.user;
}

async function redirectIfAlreadyAdmin() {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  try {
    const user = await verifyAdmin(token);
    if (user?.isAdmin) {
      window.location.replace('admin.html');
    }
  } catch {
    clearSession();
  }
}

passwordToggle?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  const icon = passwordToggle.querySelector('i');
  icon.classList.toggle('ri-eye-line', !isPassword);
  icon.classList.toggle('ri-eye-off-line', isPassword);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = normalizeEmail(emailInput.value);
  const password = passwordInput.value;

  if (!email || !password) {
    setMessage('Please enter email and password.', true);
    return;
  }

  try {
    setMessage('Signing in…');

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    const token = result.data.token;
    const user = await verifyAdmin(token);

    if (!user?.isAdmin) {
      clearSession();
      setMessage('This account does not have admin access.', true);
      return;
    }

    localStorage.setItem('authToken', token);
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified ?? user.phone_verified,
        role: user.role || 'admin',
        isAdmin: true
      })
    );

    setMessage('Access granted. Redirecting…', false);
    window.location.replace('admin.html');
  } catch (error) {
    clearSession();
    setMessage(error.message || 'Login failed. Please try again.', true);
  }
});

redirectIfAlreadyAdmin();

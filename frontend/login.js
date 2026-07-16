const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const API_BASE_URL = 'https://bike-rental-2-msm9.onrender.com/api';

function setLoginMessage(message, isError = false) {
  loginMessage.innerText = message;
  loginMessage.style.color = isError ? "#d93025" : "#188038";
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = normalizeEmail(document.getElementById("loginEmail").value);
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    setLoginMessage("Please enter email and password.", true);
    return;
  }

  try {
    setLoginMessage("Logging in...");
    
    const result = await loginUser({
      email,
      password
    });

    // Store user data and token in localStorage
    localStorage.setItem('currentUser', JSON.stringify(result.data.user));
    localStorage.setItem('authToken', result.data.token);

    setLoginMessage('Login successful! Redirecting...', false);
    
    // Update auth UI if available
    if (window.authUI) {
      window.authUI.checkAuthStatus();
    }
    
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || 'index.html';
    // Allow booking.html?bike=... and other relative app pages only
    const safeRedirect =
      redirect.startsWith('http') || redirect.startsWith('//') || redirect.includes('://')
        ? 'index.html'
        : redirect;

    setTimeout(() => {
      window.location.href = safeRedirect;
    }, 800);

  } catch (error) {
    setLoginMessage(error.message || "Login failed. Please try again.", true);
  }
});

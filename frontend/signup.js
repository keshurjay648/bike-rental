const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

const API_BASE_URL = 'http://localhost:5003/api';

function setSignupMessage(message, isError = false) {
  signupMessage.innerText = message;
  signupMessage.style.color = isError ? "#d93025" : "#188038";
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validatePhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = normalizeEmail(document.getElementById("signupEmail").value);
  const phone = document.getElementById("signupPhone").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirmPassword").value;

  // Client-side validation
  if (!name || !email || !phone || !password || !confirmPassword) {
    setSignupMessage("Please fill all fields.", true);
    return;
  }

  if (password.length < 6) {
    setSignupMessage("Password must be at least 6 characters.", true);
    return;
  }

  if (password !== confirmPassword) {
    setSignupMessage("Passwords do not match.", true);
    return;
  }

  if (!validatePhone(phone)) {
    setSignupMessage("Invalid phone number. Must be 10 digits starting with 6-9.", true);
    return;
  }

  try {
    setSignupMessage("Creating account...");
    
    const result = await registerUser({
      name,
      email,
      phone,
      password
    });

    // Store user data and token in localStorage
    localStorage.setItem('currentUser', JSON.stringify(result.data.user));
    localStorage.setItem('authToken', result.data.token);

    setSignupMessage('Registration successful! Redirecting to verification...', false);
    
    // Update auth UI if available
    if (window.authUI) {
      window.authUI.checkAuthStatus();
    }
    
    // Redirect to verification page after a short delay
    setTimeout(() => {
      window.location.href = 'verify-otp.html';
    }, 1500);

  } catch (error) {
    setSignupMessage(error.message || "Registration failed. Please try again.", true);
  }
});

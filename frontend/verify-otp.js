const phoneVerifyForm = document.getElementById("phoneVerifyForm");
const phoneMessage = document.getElementById("phoneMessage");
const statusMessage = document.getElementById("statusMessage");
const continueBtn = document.getElementById("continueBtn");
const resendPhoneOtp = document.getElementById("resendPhoneOtp");

const API_BASE_URL = "http://localhost:5002/api";

let currentUser = null;
let phoneVerified = false;

// If this page doesn't include the fallback-phone form elements,
// don't crash—let Firebase OTP (inline in verify-otp.html) work.
const isFallbackUiPresent = Boolean(
  phoneVerifyForm && phoneMessage && statusMessage && continueBtn && resendPhoneOtp,
);
if (!isFallbackUiPresent) {
  document.addEventListener("DOMContentLoaded", () => {
    // Keep status messaging minimal and non-breaking
    const localUser = localStorage.getItem("currentUser");
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        if (parsed?.phoneVerified && statusMessage) {
          statusMessage.innerText = "✅ Phone verified! You can now continue.";
          statusMessage.style.color = "#188038";
          continueBtn.style.display = "inline-block";
        }
      } catch {
        // ignore bad localStorage
      }
    }
  });
  // Stop here: no fallback listeners to attach
  // eslint-disable-next-line no-useless-return
  return;
}

// Get current user from localStorage
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setMessage(element, msg, isError = false) {
  element.innerText = msg;
  element.style.color = isError ? "#d93025" : "#188038";
}

function updateVerificationStatus() {
  currentUser = getCurrentUser();
  
  if (currentUser) {
    phoneVerified = currentUser.phoneVerified || false;
  }
  
  updateStatusDisplay();
}

function updateStatusDisplay() {
  if (phoneVerified) {
    statusMessage.innerText = "✅ Phone verified! You can now continue.";
    statusMessage.style.color = "#188038";
    continueBtn.style.display = "inline-block";
  } else {
    statusMessage.innerText = "Please verify your phone number.";
    statusMessage.style.color = "#666";
  }
}

async function verifyOTP(phone, code) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        code
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function resendOTP(phone) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend OTP');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Phone verification form handler
phoneVerifyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const otp = document.getElementById("phoneOtp").value.trim();
  
  if (!otp) {
    setMessage(phoneMessage, "Please enter the phone OTP.", true);
    return;
  }
  
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    setMessage(phoneMessage, "OTP must be 6 digits.", true);
    return;
  }
  
  try {
    setMessage(phoneMessage, "Verifying phone...");
    
    const result = await verifyOTP(currentUser.phone, otp);
    
    phoneVerified = true;
    
    // Update current user data
    currentUser.phoneVerified = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    setMessage(phoneMessage, "Phone verified successfully!");
    updateStatusDisplay();
    
    // Clear the input
    document.getElementById("phoneOtp").value = "";
    
  } catch (error) {
    setMessage(phoneMessage, error.message || "Phone verification failed.", true);
  }
});

// Resend phone OTP
resendPhoneOtp.addEventListener("click", async () => {
  try {
    setMessage(phoneMessage, "Resending phone OTP...");
    
    const result = await resendOTP(currentUser.phone);
    
    setMessage(phoneMessage, "Phone OTP resent successfully!");
    
  } catch (error) {
    setMessage(phoneMessage, error.message || "Failed to resend phone OTP.", true);
  }
});

// Continue button handler
continueBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  updateVerificationStatus();
  
  if (!currentUser) {
    statusMessage.innerText = "No user session found. Please log in again.";
    statusMessage.style.color = "#d93025";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  }
});

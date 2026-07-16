const API_BASE_URL = "https://bike-rental-2-msm9.onrender.com/api";

let currentUser = null;
let phoneVerified = false;

// If the fallback UI elements aren't present, just handle the
// already-verified state and stop — don't attach broken listeners.
const phoneVerifyForm = document.getElementById("phoneVerifyForm");
const phoneMessage = document.getElementById("phoneMessage");
const statusMessage = document.getElementById("statusMessage");
const continueBtn = document.getElementById("continueBtn");
const resendPhoneOtp = document.getElementById("resendPhoneOtp");

const isFallbackUiPresent = Boolean(
  phoneVerifyForm && phoneMessage && statusMessage && continueBtn && resendPhoneOtp
);

if (!isFallbackUiPresent) {
  // Firebase OTP path — just restore verified state if present
  document.addEventListener("DOMContentLoaded", () => {
    const localUser = localStorage.getItem("currentUser");
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        const sm = document.getElementById("statusMessage");
        const cb = document.getElementById("continueBtn");
        if (parsed?.phoneVerified && sm) {
          sm.innerText = "✅ Phone verified! You can now continue.";
          sm.style.color = "#188038";
          if (cb) cb.style.display = "inline-block";
        }
      } catch (_) { /* ignore */ }
    }
  });
} else {
  // ── Fallback (backend OTP) path ──────────────────────────────────────

  function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

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
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'OTP verification failed');
    return data;
  }

  async function resendOTP(phone) {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');
    return data;
  }

  phoneVerifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const otp = document.getElementById("phoneOtp").value.trim();
    if (!otp) { setMessage(phoneMessage, "Please enter the phone OTP.", true); return; }
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) { setMessage(phoneMessage, "OTP must be 6 digits.", true); return; }
    try {
      setMessage(phoneMessage, "Verifying phone...");
      await verifyOTP(currentUser.phone, otp);
      phoneVerified = true;
      currentUser.phoneVerified = true;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      setMessage(phoneMessage, "Phone verified successfully!");
      updateStatusDisplay();
      document.getElementById("phoneOtp").value = "";
    } catch (error) {
      setMessage(phoneMessage, error.message || "Phone verification failed.", true);
    }
  });

  resendPhoneOtp.addEventListener("click", async () => {
    try {
      setMessage(phoneMessage, "Resending phone OTP...");
      await resendOTP(currentUser.phone);
      setMessage(phoneMessage, "Phone OTP resent successfully!");
    } catch (error) {
      setMessage(phoneMessage, error.message || "Failed to resend phone OTP.", true);
    }
  });

  continueBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  document.addEventListener("DOMContentLoaded", () => {
    updateVerificationStatus();
    if (!currentUser) {
      statusMessage.innerText = "No user session found. Please log in again.";
      statusMessage.style.color = "#d93025";
      setTimeout(() => { window.location.href = "login.html"; }, 2000);
    }
  });
}

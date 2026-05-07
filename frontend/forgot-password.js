const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const message = document.getElementById("message");

const API_BASE_URL = 'http://localhost:5002/api';

function setMessage(msg, isError = false) {
  message.innerText = msg;
  message.style.color = isError ? "#d93025" : "#188038";
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function sendForgotPasswordEmail(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reset instructions');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = normalizeEmail(document.getElementById("email").value);

  if (!email) {
    setMessage("Please enter your email address.", true);
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setMessage("Please enter a valid email address.", true);
    return;
  }

  try {
    setMessage("Sending reset instructions...");
    
    const result = await sendForgotPasswordEmail(email);

    // Store the reset token (in production, this should be handled more securely)
    if (result.data && result.data.resetToken) {
      localStorage.setItem('resetToken', result.data.resetToken);
    }

    setMessage("Reset instructions sent! Check your email for the OTP.");
    
    // Redirect to reset password page after a delay
    setTimeout(() => {
      window.location.href = "reset-password.html";
    }, 2000);

  } catch (error) {
    setMessage(error.message || "Failed to send reset instructions. Please try again.", true);
  }
});

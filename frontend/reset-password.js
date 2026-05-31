const resetPasswordForm = document.getElementById("resetPasswordForm");
const message = document.getElementById("message");

const API_BASE_URL = 'http://localhost:5003/api';

function setMessage(msg, isError = false) {
  message.innerText = msg;
  message.style.color = isError ? "#d93025" : "#188038";
}

async function resetPassword(resetData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resetData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

resetPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validation
  if (!newPassword || !confirmPassword) {
    setMessage("Please fill all fields.", true);
    return;
  }

  if (newPassword.length < 6) {
    setMessage("Password must be at least 6 characters long.", true);
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage("Passwords do not match.", true);
    return;
  }

  // Get reset token from localStorage
  const resetToken = localStorage.getItem('resetToken');
  
  if (!resetToken) {
    setMessage("Reset session expired. Please request a new password reset.", true);
    setTimeout(() => {
      window.location.href = "forgot-password.html";
    }, 2000);
    return;
  }

  try {
    setMessage("Resetting password...");
    
    const result = await resetPassword({
      token: resetToken,
      newPassword: newPassword
    });

    // Clear the reset token
    localStorage.removeItem('resetToken');

    setMessage("Password reset successfully! Redirecting to login...");
    
    // Redirect to login page after a delay
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);

  } catch (error) {
    setMessage(error.message || "Password reset failed. Please try again.", true);
  }
});

// Password visibility toggles
document.addEventListener('DOMContentLoaded', () => {
  [['newPasswordToggle', 'newPassword'], ['confirmPasswordToggle', 'confirmPassword']].forEach(([btnId, inputId]) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.querySelector('i').className = isPassword ? 'ri-eye-off-line' : 'ri-eye-line';
      });
    }
  });
});

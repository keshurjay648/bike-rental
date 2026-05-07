// Firebase Phone Authentication
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBWuYaxiI4xEpqKY24B3j1Wc3QF-J8b1h0",
  authDomain: "tourqe-retals.firebaseapp.com",
  projectId: "tourqe-retals",
  storageBucket: "tourqe-retals.firebasestorage.app",
  messagingSenderId: "24112773418",
  appId: "1:24112773418:web:bc79f633512373b9d24653",
  measurementId: "G-7XDG1MJSQY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set language code
auth.languageCode = 'it';
// To apply the default browser preference instead of explicitly setting it:
// auth.useDeviceLanguage();

let confirmationResult = null;

// DOM elements
const phoneNumberInput = document.getElementById('phoneNumber');
const sendOtpBtn = document.getElementById('sendFirebaseOtp');
const firebaseOtpInput = document.getElementById('firebaseOtp');
const verifyOtpBtn = document.getElementById('verifyFirebaseOtp');
const resendOtpBtn = document.getElementById('resendFirebaseOtp');
const firebaseMessage = document.getElementById('firebaseMessage');
const otpVerificationDiv = document.getElementById('otp-verification');
const firebasePhoneAuthDiv = document.getElementById('firebase-phone-auth');
const fallbackSection = document.getElementById('fallback-section');

// Initialize reCAPTCHA
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
  'size': 'invisible',
  'callback': (response) => {
    console.log('reCAPTCHA solved, allowing sign in');
    // reCAPTCHA solved, allow signInWithPhoneNumber.
    sendFirebaseOTP();
  }
});

// Send OTP via Firebase
async function sendFirebaseOTP() {
  const phoneNumber = phoneNumberInput.value.trim();
  
  if (!phoneNumber) {
    setFirebaseMessage('Please enter your phone number', true);
    return;
  }

  if (!phoneNumber.startsWith('+')) {
    setFirebaseMessage('Please include country code (e.g., +91)', true);
    return;
  }

  try {
    setFirebaseMessage('Sending OTP...', false);
    
    // Get phone number from user input
    const phoneNumberFromUserInput = phoneNumber;
    const appVerifier = window.recaptchaVerifier;
    
    // Send OTP using proper Firebase syntax
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumberFromUserInput, appVerifier);
    
    // SMS sent. Prompt user to type the code from the message, then sign the
    // user in with confirmationResult.confirm(code).
    window.confirmationResult = confirmationResult;
    
    // Show OTP input section
    firebasePhoneAuthDiv.style.display = 'none';
    otpVerificationDiv.style.display = 'block';
    
    setFirebaseMessage('OTP sent successfully!', false);
    console.log('Firebase OTP sent to:', phoneNumber);
    
  } catch (error) {
    console.error('Error sending Firebase OTP:', error);
    
    // Error; SMS not sent
    // If Firebase fails, show fallback option
    if (error.code === 'auth/invalid-phone-number' || error.code === 'auth/quota-exceeded') {
      setFirebaseMessage('Firebase OTP failed. Using fallback method.', true);
      showFallbackVerification();
    } else {
      setFirebaseMessage('Failed to send OTP: ' + error.message, true);
    }
  }
}

// Verify OTP via Firebase
async function verifyFirebaseOTP() {
  const otp = firebaseOtpInput.value.trim();
  
  if (!otp) {
    setFirebaseMessage('Please enter the OTP', true);
    return;
  }

  if (otp.length !== 6) {
    setFirebaseMessage('OTP must be 6 digits', true);
    return;
  }

  try {
    setFirebaseMessage('Verifying OTP...', false);
    
    // Get code from user input
    const code = getCodeFromUserInput();
    
    // Use confirmationResult.confirm() with exact Firebase documentation pattern
    window.confirmationResult.confirm(code).then((result) => {
      // User signed in successfully.
      const user = result.user;
      console.log('Firebase phone verification successful:', user);
      
      // Update user verification status
      updatePhoneVerificationStatus(user.phoneNumber);
      
      setFirebaseMessage('Phone verified successfully!', false);
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      
    }).catch((error) => {
      // User couldn't sign in (bad verification code?)
      console.error('Error verifying Firebase OTP:', error);
      setFirebaseMessage('Invalid OTP. Please try again.', true);
    });
    
  } catch (error) {
    console.error('Error in OTP verification process:', error);
    setFirebaseMessage('Verification failed. Please try again.', true);
  }
}

// Helper function to get code from user input (as per Firebase documentation)
function getCodeFromUserInput() {
  return firebaseOtpInput.value.trim();
}

// Update phone verification status
async function updatePhoneVerificationStatus(phoneNumber) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch('http://localhost:5002/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        phone: phoneNumber,
        code: 'FIREBASE_VERIFIED'
      })
    });

    if (response.ok) {
      console.log('Phone verification status updated');
    }
  } catch (error) {
    console.error('Error updating verification status:', error);
  }
}

// Show fallback verification
function showFallbackVerification() {
  firebasePhoneAuthDiv.style.display = 'none';
  otpVerificationDiv.style.display = 'none';
  fallbackSection.style.display = 'block';
}

// Set message
function setFirebaseMessage(message, isError = false) {
  firebaseMessage.innerText = message;
  firebaseMessage.style.color = isError ? "#d93025" : "#188038";
}

// Event listeners
if (sendOtpBtn) {
  sendOtpBtn.addEventListener('click', sendFirebaseOTP);
}

if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener('click', verifyFirebaseOTP);
}

if (resendOtpBtn) {
  resendOtpBtn.addEventListener('click', () => {
    firebaseOtpInput.value = '';
    sendFirebaseOTP();
  });
}

// Enter key support
if (phoneNumberInput) {
  phoneNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendFirebaseOTP();
    }
  });
}

if (firebaseOtpInput) {
  firebaseOtpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      verifyFirebaseOTP();
    }
  });
}

// Initialize reCAPTCHA when page loads
window.addEventListener('load', () => {
  try {
    // Alternative reCAPTCHA initialization with sign-in-button
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sendFirebaseOtp', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log('reCAPTCHA solved, ready to send OTP');
      }
    });
    
    window.recaptchaVerifier.render().then(widgetId => {
      window.recaptchaWidgetId = widgetId;
      console.log('reCAPTCHA initialized with widget ID:', widgetId);
    });
  } catch (error) {
    console.log('reCAPTCHA initialization failed, using fallback:', error);
    showFallbackVerification();
  }
});

// Export for use in other files
window.firebaseAuth = {
  sendFirebaseOTP,
  verifyFirebaseOTP,
  showFallbackVerification
};

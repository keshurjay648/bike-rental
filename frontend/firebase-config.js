// Firebase configuration for client-side
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey-ReplaceWithYourActualKey",
  authDomain: "bike-rental-app.firebaseapp.com",
  projectId: "bike-rental-app",
  storageBucket: "bike-rental-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set language code
auth.languageCode = 'it';
// To apply the default browser preference instead of explicitly setting it:
// auth.useDeviceLanguage();

export { auth, RecaptchaVerifier };

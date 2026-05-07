import express from 'express';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Verify OTP (email or phone)
router.post('/verify-otp', verifyOTP);

// Resend OTP
router.post('/resend-otp', resendOTP);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

// Protected route example - get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

export default router;

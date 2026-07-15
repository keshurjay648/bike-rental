import express from 'express';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  deleteAccount
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

// Delete account (protected — requires valid JWT)
router.delete('/delete-account', authenticateToken, deleteAccount);

// Protected route example - get current user info
router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phone_verified,
        emailVerified: user.email_verified,
        role: user.role || 'user',
        isAdmin: Boolean(user.is_admin)
      }
    }
  });
});

export default router;

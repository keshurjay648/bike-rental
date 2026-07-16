import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { generateOTP, sendSMSOTP } from '../utils/otp.js';
import { isAdminUser } from '../middleware/auth.js';
import { env } from '../config/env.js';

const saltRounds = 10;
const jwtSecret = env.jwtSecret;

// Helper function to generate JWT token
function generateToken(userId, email) {
  return jwt.sign({ userId, email }, jwtSecret, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    phoneVerified: user.phone_verified,
    role: user.role || 'user',
    isAdmin: isAdminUser(user)
  };
}

// Helper function to validate email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone
function validatePhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// Register new user
export async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number. Must be 10 digits starting with 6-9' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUserQuery = `
      SELECT id FROM users 
      WHERE email = $1 OR phone = $2
    `;
    const existingUserResult = await pool.query(existingUserQuery, [email, phone]);
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email or phone already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const insertUserQuery = `
      INSERT INTO users (name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone,
                COALESCE(email_verified, FALSE) AS email_verified,
                phone_verified,
                COALESCE(role, 'user') AS role
    `;
    const userResult = await pool.query(insertUserQuery, [name, email, phone, passwordHash]);
    const user = userResult.rows[0];

    // Generate and send phone OTP only
    const phoneOTP = generateOTP();
    const phoneOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await pool.query(
      `INSERT INTO otp_codes (user_id, phone, code, type, expires_at)
       VALUES ($1, $2, $3, 'phone', $4)`,
      [user.id, phone, phoneOTP, phoneOTPExpiry]
    );

    try {
      await sendSMSOTP(phone, phoneOTP);
    } catch (smsError) {
      console.error('Failed to send SMS OTP:', smsError);
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your phone number.',
      data: {
        user: publicUser(user),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

// Login user
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Find user
    const userQuery = `
      SELECT id, name, email, phone, password_hash,
             COALESCE(email_verified, FALSE) AS email_verified,
             phone_verified,
             COALESCE(role, 'user') AS role
      FROM users WHERE email = $1
    `;
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicUser(user),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

// Verify OTP
export async function verifyOTP(req, res) {
  try {
    const { phone, code } = req.body;

    // Validation
    if (!code || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code and phone are required' 
      });
    }

    // Find valid OTP
    const otpQuery = `
      SELECT oc.*, u.id as user_id
      FROM otp_codes oc
      JOIN users u ON oc.user_id = u.id
      WHERE oc.code = $1 
        AND oc.type = 'phone' 
        AND oc.used = FALSE 
        AND oc.expires_at > NOW()
        AND oc.phone = $2
      ORDER BY oc.created_at DESC
      LIMIT 1
    `;
    
    const otpResult = await pool.query(otpQuery, [code, phone]);
    
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    const otp = otpResult.rows[0];

    // Mark OTP as used
    await pool.query(
      'UPDATE otp_codes SET used = TRUE WHERE id = $1',
      [otp.id]
    );

    // Update user verification status
    await pool.query(
      'UPDATE users SET phone_verified = TRUE WHERE id = $1',
      [otp.user_id]
    );

    res.json({
      success: true,
      message: 'Phone verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

// Resend OTP
export async function resendOTP(req, res) {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Find user
    const userQuery = 'SELECT id, name, phone FROM users WHERE phone = $1';
    const userResult = await pool.query(userQuery, [phone]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await pool.query(
      `INSERT INTO otp_codes (user_id, phone, code, type, expires_at)
       VALUES ($1, $2, $3, 'phone', $4)`,
      [user.id, phone, otp, otpExpiry]
    );

    // Send OTP
    try {
      await sendSMSOTP(phone, otp);
    } catch (sendError) {
      console.error('Failed to send phone OTP:', sendError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send phone OTP' 
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your phone'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

// Forgot password
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Find user
    const userQuery = 'SELECT id, name, email FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email' 
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = jwt.sign({ userId: user.id, type: 'password_reset' }, jwtSecret, { expiresIn: '1h' });
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, resetTokenExpiry]
    );

    
    res.json({
      success: true,
      message: 'Password reset initiated',
      data: {
        resetToken
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

// Reset password
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Verify reset token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (tokenError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    if (decodedToken.type !== 'password_reset') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token' 
      });
    }

    // Verify token exists and is not used
    const tokenQuery = `
      SELECT user_id, used, expires_at
      FROM password_reset_tokens
      WHERE token = $1 
        AND used = FALSE 
        AND expires_at > NOW()
      LIMIT 1
    `;
    
    const tokenResult = await pool.query(tokenQuery, [token]);
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, decodedToken.userId]
    );

    // Mark token as used
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

// Delete account
export async function deleteAccount(req, res) {
  try {
    // userId comes from the DB row set by authenticateToken middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in again.'
      });
    }

    // Confirm the user actually exists
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Delete in dependency order so foreign keys don't block the user delete.
    // Adjust table names if yours differ.
    await pool.query('DELETE FROM otp_codes            WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

    // Delete bookings if the table exists
    try {
      await pool.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
    } catch (_) {
      // table may not exist yet — safe to ignore
    }

    // Finally delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    return res.json({
      success: true,
      message: 'Account and all associated data deleted successfully.'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting account.'
    });
  }
}

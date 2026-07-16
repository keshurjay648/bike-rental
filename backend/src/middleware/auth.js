import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const jwtSecret = env.jwtSecret;

function isAdminUser(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const email = (user.email || '').toLowerCase();
  return env.adminEmails.includes(email);
}

function mapUserRow(row) {
  if (!row) return null;
  return {
    ...row,
    is_admin: isAdminUser(row)
  };
}

// Authentication middleware
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user from database
    const userQuery = `
      SELECT id, name, email, phone,
             COALESCE(email_verified, FALSE) AS email_verified,
             phone_verified,
             COALESCE(role, 'user') AS role,
             created_at
      FROM users WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    req.user = mapUserRow(userResult.rows[0]);
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    const userQuery = `
      SELECT id, name, email, phone,
             COALESCE(email_verified, FALSE) AS email_verified,
             phone_verified,
             COALESCE(role, 'user') AS role,
             created_at
      FROM users WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    req.user = mapUserRow(userResult.rows[0]) || null;
    next();

  } catch (error) {
    // For optional auth, we don't fail on token errors
    req.user = null;
    next();
  }
}

/** Require authenticated admin (role=admin or ADMIN_EMAILS allowlist) */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!isAdminUser(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
}

export { isAdminUser };

// Check if user has verified email
export function requireEmailVerification(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Email verification required' 
    });
  }

  next();
}

// Check if user has verified phone
export function requirePhoneVerification(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (!req.user.phone_verified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Phone verification required' 
    });
  }

  next();
}

// Check if user has both email and phone verified
export function requireFullVerification(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (!req.user.email_verified || !req.user.phone_verified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Both email and phone verification required' 
    });
  }

  next();
}

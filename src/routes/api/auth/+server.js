import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import bcrypt from 'bcrypt';
import { createLoginRateLimitMiddleware, rateLimiter } from '../../../lib/middleware/rateLimiter.js';

// Create login rate limiter instance
const loginRateLimit = createLoginRateLimitMiddleware();

// POST /api/auth - Authenticate user with account number and password
export async function POST({ request, getClientAddress }) {
  try {
    // Apply rate limiting first
    const rateLimitResult = await loginRateLimit(request, getClientAddress);
    
    if (rateLimitResult.blocked) {
      return json(rateLimitResult.body, { 
        status: rateLimitResult.status,
        headers: rateLimitResult.headers
      });
    }
    
    const ip = rateLimitResult.ip;
    const { accountNumber, password } = await request.json();
    
    // Validate required fields
    if (!accountNumber || !password) {
      // Record failed attempt for missing credentials
      rateLimiter.recordFailedLogin(ip);
      return json({ error: 'Account number and password are required' }, { status: 400 });
    }
    
    // Additional input validation and sanitization
    if (typeof accountNumber !== 'string' || typeof password !== 'string') {
      rateLimiter.recordFailedLogin(ip);
      return json({ error: 'Invalid input format' }, { status: 400 });
    }
    
    // Sanitize account number (remove any non-alphanumeric characters except hyphens and underscores)
    const sanitizedAccountNumber = accountNumber.replace(/[^a-zA-Z0-9\-_]/g, '');
    
    if (sanitizedAccountNumber !== accountNumber || accountNumber.length > 50) {
      rateLimiter.recordFailedLogin(ip);
      return json({ error: 'Invalid account number format' }, { status: 400 });
    }
    
    if (password.length > 200) {
      rateLimiter.recordFailedLogin(ip);
      return json({ error: 'Password too long' }, { status: 400 });
    }
    
    // Query user by account number
    const userQuery = `
      SELECT 
        u.id,
        u.account_number,
        u.full_name,
        u.first_name,
        u.gender,
        u.account_type,
        u.password_hash,
        u.status
      FROM users u
      WHERE u.account_number = $1 AND (u.status IS NULL OR u.status = 'active')
    `;
    
    const result = await query(userQuery, [sanitizedAccountNumber]);
    
    if (result.rows.length === 0) {
      // Record failed login attempt
      const delay = rateLimiter.recordFailedLogin(ip);
      
      // Apply progressive delay if configured
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return json({ error: 'Invalid account number or password' }, { status: 401 });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      // Record failed login attempt
      const delay = rateLimiter.recordFailedLogin(ip);
      
      // Apply progressive delay if configured
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return json({ error: 'Invalid account number or password' }, { status: 401 });
    }
    
    // Clear failed attempts on successful login
    rateLimiter.clearFailedAttempts(ip);
    
    // Return user data (excluding password hash)
    const userData = {
      id: user.id,
      name: user.full_name,
      firstName: user.first_name,
      gender: user.gender,
      accountNumber: user.account_number,
      accountType: user.account_type
    };
    
    // Log the login activity
    try {
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await query(
        'SELECT log_activity($1, $2, $3, $4, $5, $6)',
        [
          'user_login',
          user.id,
          user.account_number,
          JSON.stringify({
            full_name: user.full_name,
            account_type: user.account_type
          }),
          ip_address, // Now capturing actual IP address
          user_agent  // Now capturing actual user agent
        ]
      );
    } catch (logError) {
      console.error('Error logging login activity:', logError);
      // Don't fail the login if logging fails
    }
    
    return json({ 
      success: true, 
      user: userData,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    // Generic error
    return json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
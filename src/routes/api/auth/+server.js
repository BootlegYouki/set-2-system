import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import bcrypt from 'bcrypt';

// POST /api/auth - Authenticate user with account number and password
export async function POST({ request }) {
  try {
    const { accountNumber, password } = await request.json();
    
    // Validate required fields
    if (!accountNumber || !password) {
      return json({ error: 'Account number and password are required' }, { status: 400 });
    }
    
    // Query user by account number
    const userQuery = `
      SELECT 
        u.id,
        u.account_number,
        u.full_name,
        u.account_type,
        u.password_hash,
        u.status
      FROM users u
      WHERE u.account_number = $1 AND (u.status IS NULL OR u.status = 'active')
    `;
    
    const result = await query(userQuery, [accountNumber]);
    
    if (result.rows.length === 0) {
      return json({ error: 'Invalid account number or password' }, { status: 401 });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return json({ error: 'Invalid account number or password' }, { status: 401 });
    }
    
    // Return user data (excluding password hash)
    const userData = {
      id: user.id,
      name: user.full_name,
      accountNumber: user.account_number,
      accountType: user.account_type
    };
    
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
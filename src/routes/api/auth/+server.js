import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import bcrypt from 'bcrypt';

// POST /api/auth - Authenticate user with account number and password
export async function POST({ request, getClientAddress }) {
  try {
    const { accountNumber, password } = await request.json();
    
    // Validate required fields
    if (!accountNumber || !password) {
      return json({ error: 'Account number and password are required' }, { status: 400 });
    }
    
    // Additional input validation and sanitization
    if (typeof accountNumber !== 'string' || typeof password !== 'string') {
      return json({ error: 'Invalid input format' }, { status: 400 });
    }
    
    // Sanitize account number (remove any non-alphanumeric characters except hyphens and underscores)
    const sanitizedAccountNumber = accountNumber.replace(/[^a-zA-Z0-9\-_]/g, '');
    
    if (sanitizedAccountNumber !== accountNumber || accountNumber.length > 50) {
      return json({ error: 'Invalid account number format' }, { status: 400 });
    }
    
    if (password.length > 200) {
      return json({ error: 'Password too long' }, { status: 400 });
    }
    
    // Connect to MongoDB and query user by account number
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({
      account_number: sanitizedAccountNumber,
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: 'active' }
      ]
    });
    
    if (!user) {
      return json({ error: 'Invalid account number or password' }, { status: 401 });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return json({ error: 'Invalid account number or password' }, { status: 401 });
    }
    
    // Return user data (excluding password hash)
    const userData = {
      id: user._id,
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
      
      // Log activity to MongoDB
      const activityLogsCollection = db.collection('activity_logs');
      await activityLogsCollection.insertOne({
        activity_type: 'user_login',
        user_id: user._id,
        account_number: user.account_number,
        details: {
          full_name: user.full_name,
          account_type: user.account_type
        },
        ip_address: ip_address,
        user_agent: user_agent,
        timestamp: new Date()
      });
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
import { json } from '@sveltejs/kit';
import { client } from '../../database/db.js';
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
    
    // Query user by account number from MongoDB
    const db = client.db(process.env.MONGODB_DB_NAME || 'set-2-system');
    const usersCollection = db.collection('users');
    
    // Optimized query: check account_number first (indexed), then filter status
    const user = await usersCollection.findOne({
      account_number: sanitizedAccountNumber,
      status: { $ne: 'archived' } // Simpler condition: not archived = active/null/undefined
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
    
    // Log the login activity asynchronously (don't await - improves response time)
    const ip_address = getClientAddress();
    const user_agent = request.headers.get('user-agent');
    const activityLogsCollection = db.collection('activity_logs');
    
    // Fire and forget - log activity without blocking the response
    activityLogsCollection.insertOne({
      activity_type: 'user_login',
      user_id: user._id,
      user_account_number: user.account_number,
      activity_data: {
        full_name: user.full_name,
        account_type: user.account_type
      },
      ip_address: ip_address,
      user_agent: user_agent,
      created_at: new Date()
    }).catch(logError => {
      console.error('Error logging login activity:', logError);
      // Activity logging failure doesn't affect login success
    });
    
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
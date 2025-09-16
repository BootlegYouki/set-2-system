import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import bcrypt from 'bcrypt';

// POST /api/accounts - Create a new account
export async function POST({ request }) {
  try {
    const { accountType, gender, subjectId, firstName, lastName, middleInitial, email } = await request.json();
    
    // Validate required fields
    if (!accountType || !gender || !firstName || !lastName) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate email for students and teachers
    if ((accountType === 'student' || accountType === 'teacher') && !email) {
      return json({ error: 'Email is required for students and teachers' }, { status: 400 });
    }
    
    // Validate subject for teachers
    if (accountType === 'teacher' && !subjectId) {
      return json({ error: 'Subject is required for teachers' }, { status: 400 });
    }
    
    // Generate account number
    const accountNumber = await generateAccountNumber(accountType);
    
    // Hash password (using account number as password)
    const hashedPassword = await bcrypt.hash(accountNumber, 10);
    
    // Construct full name
    const fullName = `${lastName}, ${firstName}${middleInitial ? ' ' + middleInitial + '.' : ''}`;
    
    // Insert into database
    const insertQuery = `
      INSERT INTO users (
        account_number, 
        account_type, 
        first_name, 
        last_name, 
        middle_initial, 
        full_name,
        gender, 
        email, 
        subject_id, 
        password_hash,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id, account_number, full_name, account_type, created_at, updated_at
    `;
    
    const values = [
      accountNumber,
      accountType,
      firstName,
      lastName,
      middleInitial || null,
      fullName,
      gender,
      email || null,
      subjectId || null,
      hashedPassword
    ];
    
    const result = await query(insertQuery, values);
    const newAccount = result.rows[0];
    
    // Format response to match frontend expectations
    const response = {
      id: newAccount.id,
      name: newAccount.full_name,
      type: accountType === 'student' ? 'Student' : accountType === 'teacher' ? 'Teacher' : 'Admin',
      number: newAccount.account_number,
      createdDate: new Date(newAccount.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(newAccount.updated_at).toLocaleDateString('en-US'),
      status: 'active'
    };
    
    return json({ success: true, account: response }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating account:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint === 'users_email_key') {
        return json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      if (error.constraint === 'users_account_number_key') {
        return json({ error: 'Account number already exists' }, { status: 409 });
      }
    }
    
    if (error.code === '23502') { // Not null constraint violation
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (error.code === '23514') { // Check constraint violation
      return json({ error: 'Invalid data provided' }, { status: 400 });
    }
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    // Generic error
    return json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}

// GET /api/accounts - Fetch recent accounts
export async function GET({ url }) {
  try {
    const limit = url.searchParams.get('limit') || '10';
    
    const selectQuery = `
      SELECT 
        id,
        account_number,
        full_name,
        first_name,
        last_name,
        middle_initial,
        account_type,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await query(selectQuery, [parseInt(limit)]);
    
    // Format the data to match frontend expectations
    const accounts = result.rows.map(account => ({
      id: account.id,
      name: account.full_name,
      firstName: account.first_name,
      lastName: account.last_name,
      middleInitial: account.middle_initial,
      type: account.account_type === 'student' ? 'Student' : account.account_type === 'teacher' ? 'Teacher' : 'Admin',
      number: account.account_number,
      createdDate: new Date(account.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(account.updated_at).toLocaleDateString('en-US'),
      status: 'active'
    }));
    
    return json({ accounts });
    
  } catch (error) {
    console.error('Error fetching accounts:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    // Invalid limit parameter
    if (error.message && error.message.includes('invalid input syntax')) {
      return json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    
    return json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// PUT /api/accounts - Update an existing account
export async function PUT({ request }) {
  try {
    const { id, firstName, lastName, middleInitial } = await request.json();
    
    // Validate required fields
    if (!id || !firstName || !lastName) {
      return json({ error: 'Account ID, first name, and last name are required' }, { status: 400 });
    }
    
    // Check if account exists
    const checkQuery = `SELECT id FROM users WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Construct full name
    const fullName = `${lastName}, ${firstName}${middleInitial ? ' ' + middleInitial + '.' : ''}`;
    
    // Update the account
    const updateQuery = `
      UPDATE users 
      SET 
        first_name = $1,
        last_name = $2,
        middle_initial = $3,
        full_name = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, account_number, full_name, first_name, last_name, middle_initial, account_type, created_at, updated_at
    `;
    
    const values = [
      firstName,
      lastName,
      middleInitial || null,
      fullName,
      id
    ];
    
    const result = await query(updateQuery, values);
    const updatedAccount = result.rows[0];
    
    // Format response to match frontend expectations
    const response = {
      id: updatedAccount.id,
      name: updatedAccount.full_name,
      firstName: updatedAccount.first_name,
      lastName: updatedAccount.last_name,
      middleInitial: updatedAccount.middle_initial,
      type: updatedAccount.account_type === 'student' ? 'Student' : updatedAccount.account_type === 'teacher' ? 'Teacher' : 'Admin',
      number: updatedAccount.account_number,
      createdDate: new Date(updatedAccount.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(updatedAccount.updated_at).toLocaleDateString('en-US'),
      status: 'active'
    };
    
    return json({ 
      success: true, 
      message: `Account for "${updatedAccount.full_name}" has been updated successfully`,
      account: response 
    });
    
  } catch (error) {
    console.error('Error updating account:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    // Not null constraint violation
    if (error.code === '23502') {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    return json({ error: 'Failed to update account. Please try again.' }, { status: 500 });
  }
}

// DELETE /api/accounts - Delete an account by ID
export async function DELETE({ request }) {
  try {
    const { id } = await request.json();
    
    // Validate required fields
    if (!id) {
      return json({ error: 'Account ID is required' }, { status: 400 });
    }
    
    // Check if account exists
    const checkQuery = `SELECT id, full_name FROM users WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Delete the account
    const deleteQuery = `DELETE FROM users WHERE id = $1`;
    await query(deleteQuery, [id]);
    
    return json({ 
      success: true, 
      message: `Account for "${checkResult.rows[0].full_name}" has been deleted successfully` 
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to delete account. Please try again.' }, { status: 500 });
  }
}

// Helper function to generate account numbers
async function generateAccountNumber(accountType) {
  const prefix = accountType === 'student' ? 'STU' : accountType === 'teacher' ? 'TCH' : 'ADM';
  const year = new Date().getFullYear();
  
  // Get the highest existing number for this type and year
  const countQuery = `
    SELECT account_number 
    FROM users 
    WHERE account_number LIKE $1 
    ORDER BY account_number DESC 
    LIMIT 1
  `;
  
  const result = await query(countQuery, [`${prefix}-${year}-%`]);
  
  let nextNumber = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].account_number;
    const match = lastNumber.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  return `${prefix}-${year}-${nextNumber.toString().padStart(3, '0')}`;
}
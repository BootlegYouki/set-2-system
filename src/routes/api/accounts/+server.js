import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import bcrypt from 'bcrypt';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';

// POST /api/accounts - Create a new account
export async function POST({ request, getClientAddress }) {
  try {
    const { accountType, gender, gradeLevel, firstName, lastName, middleInitial, email, birthdate, address, guardian, contactNumber, createdBy } = await request.json();
    
    // Validate required fields
    if (!accountType || !gender || !firstName || !lastName) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate email for students and teachers
    if ((accountType === 'student' || accountType === 'teacher') && !email) {
      return json({ error: 'Email is required for students and teachers' }, { status: 400 });
    }
    
    // Validate grade level for students
    if (accountType === 'student' && !gradeLevel) {
      return json({ error: 'Grade level is required for students' }, { status: 400 });
    }
    
    // Validate additional information for students
    if (accountType === 'student') {
      if (!birthdate || !address || !guardian || !contactNumber) {
        return json({ error: 'Birthdate, address, guardian, and contact number are required for students' }, { status: 400 });
      }
    }
    
    // Calculate age from birthdate for students
    let age = null;
    if (accountType === 'student' && birthdate) {
      const birthDate = new Date(birthdate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
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
        grade_level,
        birthdate,
        address,
        age,
        guardian,
        contact_number,
        password_hash,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
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
      gradeLevel || null,
      birthdate || null,
      address || null,
      age,
      guardian || null,
      contactNumber || null,
      hashedPassword
    ];
    
    const result = await query(insertQuery, values);
    const newAccount = result.rows[0];
    
    // Log the account creation activity
    try {
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await query(
        'SELECT log_activity($1, $2, $3, $4, $5, $6)',
        [
          'account_created',
          createdBy || null, // Use the ID of the user who created the account
          newAccount.account_number,
          JSON.stringify({
            account_type: accountType,
            full_name: fullName,
            grade_level: gradeLevel
          }),
          ip_address, // Now capturing actual IP address
          user_agent  // Now capturing actual user agent
        ]
      );
    } catch (logError) {
      console.error('Error logging account creation activity:', logError);
      // Don't fail the account creation if logging fails
    }
    
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
    const type = url.searchParams.get('type'); // Get the type parameter
    
    // Build the query with optional WHERE clause for type filtering
    let selectQuery = `
      SELECT 
        u.id,
        u.account_number,
        u.full_name,
        u.first_name,
        u.last_name,
        u.middle_initial,
        u.email,
        u.account_type,
        u.grade_level,
        u.birthdate,
        u.address,
        u.age,
        u.guardian,
        u.contact_number,
        u.created_at,
        u.updated_at
      FROM users u
    `;
    
    const queryParams = [parseInt(limit)];
    
    // Add WHERE clause if type parameter is provided
    if (type) {
      selectQuery += ` WHERE u.account_type = $2 AND (u.status IS NULL OR u.status = 'active')`;
      queryParams.push(type);
    } else {
      selectQuery += ` WHERE (u.status IS NULL OR u.status = 'active')`;
    }
    
    selectQuery += ` ORDER BY u.created_at DESC LIMIT $1`;
    
    const result = await query(selectQuery, queryParams);
    
    // Format the data to match frontend expectations
    const accounts = result.rows.map(account => ({
      id: account.id,
      name: account.full_name,
      firstName: account.first_name,
      lastName: account.last_name,
      middleInitial: account.middle_initial,
      email: account.email,
      type: account.account_type === 'student' ? 'Student' : account.account_type === 'teacher' ? 'Teacher' : 'Admin',
      number: account.account_number,
      gradeLevel: account.grade_level,
      birthdate: account.birthdate,
      address: account.address,
      age: account.age,
      guardian: account.guardian,
      contactNumber: account.contact_number,
      createdDate: new Date(account.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(account.updated_at).toLocaleDateString('en-US'),
      status: 'active'
    }));
    
    return json({ success: true, accounts });
    
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
// PUT /api/accounts - Update an existing account
export async function PUT({ request, getClientAddress }) {
  try {
    const { id, firstName, lastName, middleInitial, gradeLevel, birthdate, address, guardian, contactNumber } = await request.json();
    
    // Validate required fields
    if (!id || !firstName || !lastName) {
      return json({ error: 'Account ID, first name, and last name are required' }, { status: 400 });
    }
    
    // Check if account exists and get its type
    const checkQuery = `SELECT id, account_type, full_name FROM users WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return json({ error: 'Account not found' }, { status: 404 });
    }
    
    const accountType = checkResult.rows[0].account_type;
    const oldFullName = checkResult.rows[0].full_name;
    
    // Validate additional information for students
    if (accountType === 'student') {
      if (!birthdate || !address || !guardian || !contactNumber) {
        return json({ error: 'Birthdate, address, guardian, and contact number are required for students' }, { status: 400 });
      }
    }
    
    // Calculate age from birthdate for students
    let age = null;
    if (accountType === 'student' && birthdate) {
      const birthDate = new Date(birthdate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    // Construct full name
    const fullName = `${lastName}, ${firstName}${middleInitial ? ' ' + middleInitial + '.' : ''}`;
    
    // Prepare update query based on account type
    let updateQuery;
    let values;

    if (accountType === 'teacher') {
      // Update teacher accounts (subject functionality removed)
      updateQuery = `
        UPDATE users 
        SET 
          first_name = $1,
          last_name = $2,
          middle_initial = $3,
          full_name = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, account_number, full_name, first_name, last_name, middle_initial, account_type, grade_level, birthdate, address, age, guardian, contact_number, created_at, updated_at
      `;
      values = [
        firstName,
        lastName,
        middleInitial || null,
        fullName,
        id
      ];
    } else if (accountType === 'student') {
      // Update with grade_level and additional information for student accounts
      updateQuery = `
        UPDATE users 
        SET 
          first_name = $1,
          last_name = $2,
          middle_initial = $3,
          full_name = $4,
          grade_level = $5,
          birthdate = $6,
          address = $7,
          age = $8,
          guardian = $9,
          contact_number = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING id, account_number, full_name, first_name, last_name, middle_initial, account_type, grade_level, birthdate, address, age, guardian, contact_number, created_at, updated_at
      `;
      values = [
        firstName,
        lastName,
        middleInitial || null,
        fullName,
        gradeLevel || null,
        birthdate || null,
        address || null,
        age,
        guardian || null,
        contactNumber || null,
        id
      ];
    } else {
      // Update without grade_level for admin accounts
      updateQuery = `
        UPDATE users 
        SET 
          first_name = $1,
          last_name = $2,
          middle_initial = $3,
          full_name = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, account_number, full_name, first_name, last_name, middle_initial, account_type, grade_level, birthdate, address, age, guardian, contact_number, created_at, updated_at
      `;
      values = [
        firstName,
        lastName,
        middleInitial || null,
        fullName,
        id
      ];
    }
    
    const result = await query(updateQuery, values);
    const updatedAccount = result.rows[0];
    
    // Log the account update activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'account_updated',
        user,
        {
          account_type: updatedAccount.account_type,
          old_full_name: oldFullName,
          new_full_name: updatedAccount.full_name,
          account_number: updatedAccount.account_number
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error('Error logging account update activity:', logError);
      // Don't fail the update if logging fails
    }
    
    // Format response to match frontend expectations
    const response = {
      id: updatedAccount.id,
      name: updatedAccount.full_name,
      firstName: updatedAccount.first_name,
      lastName: updatedAccount.last_name,
      middleInitial: updatedAccount.middle_initial,
      type: updatedAccount.account_type === 'student' ? 'Student' : updatedAccount.account_type === 'teacher' ? 'Teacher' : 'Admin',
      number: updatedAccount.account_number,
      gradeLevel: updatedAccount.grade_level,
      birthdate: updatedAccount.birthdate,
      address: updatedAccount.address,
      age: updatedAccount.age,
      guardian: updatedAccount.guardian,
      contactNumber: updatedAccount.contact_number,
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
export async function DELETE({ request, getClientAddress }) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json({ error: 'Account ID is required' }, { status: 400 });
    }
    
    // Check if account exists
    const checkQuery = `SELECT id, full_name, account_type FROM users WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return json({ error: 'Account not found' }, { status: 404 });
    }
    
    const account = checkResult.rows[0];
    
    // Handle different account types - now delete all account types permanently
    // Actually delete the account permanently
    const deleteQuery = `DELETE FROM users WHERE id = $1`;
    await query(deleteQuery, [id]);
    
    // Log the account deletion activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'account_deleted',
        user,
        {
          account_type: account.account_type,
          full_name: account.full_name
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error('Error logging account deletion activity:', logError);
      // Don't fail the deletion if logging fails
    }
    
    const accountTypeLabel = account.account_type === 'student' ? 'Student' : 
                            account.account_type === 'teacher' ? 'Teacher' : 'Admin';
    return json({
      success: true,
      message: `${accountTypeLabel} "${account.full_name}" has been deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting/archiving account:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    // Foreign key constraint violation (if account is referenced elsewhere)
    if (error.code === '23503') {
      return json({ error: 'Cannot delete account as it is referenced by other records' }, { status: 409 });
    }
    
    return json({ error: 'Failed to delete account. Please try again.' }, { status: 500 });
  }
}

// Helper function to generate account numbers
async function generateAccountNumber(accountType) {
  const prefix = accountType === 'student' ? 'STU' : accountType === 'teacher' ? 'TCH' : 'ADM';
  const year = new Date().getFullYear();
  
  // Get all existing account numbers for this type and year (including archived accounts)
  const existingQuery = `
    SELECT account_number 
    FROM users 
    WHERE account_number LIKE $1 
    ORDER BY account_number ASC
  `;
  
  const result = await query(existingQuery, [`${prefix}-${year}-%`]);
  
  // Extract the numeric parts and create a Set for O(1) lookup
  const existingNumbers = new Set(
    result.rows.map(row => {
      const match = row.account_number.match(/-(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }).filter(num => num > 0) // Filter out invalid numbers
  );
  
  // Find the lowest available number starting from 1
  let nextNumber = 1;
  while (existingNumbers.has(nextNumber)) {
    nextNumber++;
  }
  
  return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

// PATCH /api/accounts - Archive a student account by ID
export async function PATCH({ request, getClientAddress }) {
  try {
    const { id, action } = await request.json();
    
    if (!id) {
      return json({ error: 'Account ID is required' }, { status: 400 });
    }
    
    if (action !== 'archive') {
      return json({ error: 'Invalid action. Only "archive" is supported.' }, { status: 400 });
    }
    
    // Check if account exists and is a student
    const checkQuery = `SELECT id, full_name, account_type FROM users WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return json({ error: 'Account not found' }, { status: 404 });
    }
    
    const account = checkResult.rows[0];
    
    if (account.account_type !== 'student') {
      return json({ error: 'Only student accounts can be archived' }, { status: 400 });
    }
    
    // Archive the student
    const archiveQuery = `
      UPDATE users 
      SET 
        status = 'archived',
        archived_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(archiveQuery, [id]);
    
    // Log the account archiving activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'account_archived',
        user,
        {
          account_type: account.account_type,
          full_name: account.full_name
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error('Error logging account archiving activity:', logError);
      // Don't fail the archiving if logging fails
    }
    
    return json({
      success: true,
      message: `Student "${account.full_name}" has been archived successfully`
    });
    
  } catch (error) {
    console.error('Error archiving account:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed. Please try again.' }, { status: 503 });
    }
    
    // Foreign key constraint errors
    if (error.code === '23503') {
      return json({ error: 'Cannot archive account as it is referenced by other records' }, { status: 409 });
    }
    
    return json({ error: 'Failed to archive account. Please try again.' }, { status: 500 });
  }
}
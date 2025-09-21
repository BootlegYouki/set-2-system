import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

// GET /api/archived-students - Fetch archived students
export async function GET({ url }) {
  try {
    const limit = url.searchParams.get('limit') || '50';
    const search = url.searchParams.get('search') || '';
    const yearLevel = url.searchParams.get('yearLevel') || '';
    const gender = url.searchParams.get('gender') || '';
    
    // Build the query with WHERE clause for archived students
    let selectQuery = `
      SELECT 
        u.id,
        u.account_number,
        u.full_name,
        u.first_name,
        u.last_name,
        u.middle_initial,
        u.email,
        u.year_level,
        u.birthdate,
        u.address,
        u.age,
        u.guardian,
        u.contact_number,
        u.gender,
        u.archived_at,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.account_type = 'student' AND u.status = 'archived'
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Add search filter
    if (search) {
      selectQuery += ` AND (
        u.full_name ILIKE $${paramIndex} OR 
        u.account_number ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add year level filter
    if (yearLevel) {
      selectQuery += ` AND u.year_level = $${paramIndex}`;
      queryParams.push(yearLevel);
      paramIndex++;
    }
    
    // Add gender filter
    if (gender) {
      selectQuery += ` AND u.gender = $${paramIndex}`;
      queryParams.push(gender);
      paramIndex++;
    }
    
    selectQuery += ` ORDER BY u.archived_at DESC LIMIT $${paramIndex}`;
    queryParams.push(parseInt(limit));
    
    const result = await query(selectQuery, queryParams);
    
    // Format the data to match frontend expectations
    const archivedStudents = result.rows.map(student => ({
      id: student.id,
      name: student.full_name,
      firstName: student.first_name,
      lastName: student.last_name,
      middleInitial: student.middle_initial,
      email: student.email,
      number: student.account_number,
      yearLevel: student.year_level,
      birthdate: student.birthdate,
      address: student.address,
      age: student.age,
      guardian: student.guardian,
      contactNumber: student.contact_number,
      gender: student.gender,
      archivedDate: student.archived_at ? new Date(student.archived_at).toLocaleDateString('en-US') : '',
      createdDate: new Date(student.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(student.updated_at).toLocaleDateString('en-US'),
      status: 'archived'
    }));
    
    return json({ students: archivedStudents });
    
  } catch (error) {
    console.error('Error fetching archived students:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    // Invalid limit parameter
    if (error.message && error.message.includes('invalid input syntax')) {
      return json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    
    return json({ error: 'Failed to fetch archived students' }, { status: 500 });
  }
}

// PUT /api/archived-students - Restore a student from archive
export async function PUT({ request }) {
  try {
    const { id } = await request.json();
    
    // Validate required fields
    if (!id) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }
    
    // Check if student exists and is archived
    const checkQuery = `SELECT id, account_type, status FROM users WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return json({ error: 'Student not found' }, { status: 404 });
    }
    
    const student = checkResult.rows[0];
    
    if (student.account_type !== 'student') {
      return json({ error: 'Only students can be restored from archive' }, { status: 400 });
    }
    
    if (student.status !== 'archived') {
      return json({ error: 'Student is not archived' }, { status: 400 });
    }
    
    // Restore student by updating status to active and clearing archived_at
    const updateQuery = `
      UPDATE users 
      SET 
        status = 'active',
        archived_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, full_name, account_number
    `;
    
    const result = await query(updateQuery, [id]);
    const restoredStudent = result.rows[0];
    
    return json({ 
      success: true, 
      message: `Student ${restoredStudent.full_name} (${restoredStudent.account_number}) has been restored from archive`,
      student: {
        id: restoredStudent.id,
        name: restoredStudent.full_name,
        number: restoredStudent.account_number
      }
    });
    
  } catch (error) {
    console.error('Error restoring student:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to restore student from archive' }, { status: 500 });
  }
}
import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';

// GET /api/subjects - Fetch all subjects with optional filtering
export async function GET({ url }) {
  try {
    const action = url.searchParams.get('action');
    const searchTerm = url.searchParams.get('search') || '';
    const gradeLevel = url.searchParams.get('grade_level');
    
    // Handle different actions
    if (action === 'available-subjects') {
      // For schedule form - filter by grade level if provided
      let sqlQuery = `
        SELECT 
          s.id,
          s.name,
          s.code,
          s.grade_level,
          s.department_id,
          s.created_at,
          s.updated_at,
          d.name as department_name,
          d.code as department_code
        FROM subjects s
        LEFT JOIN departments d ON s.department_id = d.id
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Add grade level filter for available-subjects action
      if (gradeLevel && gradeLevel !== '') {
        sqlQuery += ` WHERE s.grade_level = $${paramIndex}`;
        params.push(parseInt(gradeLevel));
        paramIndex++;
      }
      
      sqlQuery += ' ORDER BY s.name ASC';
      
      const result = await query(sqlQuery, params);
      
      // Format the data for schedule form dropdown
      const subjects = result.rows.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        grade_level: subject.grade_level,
        gradeLevel: `Grade ${subject.grade_level}`,
        department_id: subject.department_id,
        department_name: subject.department_name,
        department_code: subject.department_code
      }));
      
      return json({
        success: true,
        data: subjects
      });
    }
    
    // Default behavior for admin subjects management
    
    let sqlQuery = `
      SELECT 
        s.id,
        s.name,
        s.code,
        s.grade_level,
        s.department_id,
        s.created_at,
        s.updated_at,
        d.name as department_name,
        d.code as department_code
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
    `;
    
    const params = [];
    let paramIndex = 1;
    let whereAdded = false;
    
    // Add search filter
    if (searchTerm) {
      sqlQuery += ` WHERE (LOWER(name) LIKE $${paramIndex} OR LOWER(code) LIKE $${paramIndex})`;
      params.push(`%${searchTerm.toLowerCase()}%`);
      paramIndex++;
      whereAdded = true;
    }
    
    // Add grade level filter
    if (gradeLevel && gradeLevel !== '') {
      sqlQuery += whereAdded ? ` AND grade_level = $${paramIndex}` : ` WHERE grade_level = $${paramIndex}`;
      params.push(parseInt(gradeLevel));
      paramIndex++;
    }
    
    sqlQuery += ' ORDER BY created_at DESC';
    
    const result = await query(sqlQuery, params);
    
    // Format the data to match the component's expected structure
    const subjects = result.rows.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      grade_level: subject.grade_level, // Keep the original numeric grade_level for filtering
      gradeLevel: `Grade ${subject.grade_level}`, // Formatted version for display
      department_id: subject.department_id,
      department_name: subject.department_name,
      department_code: subject.department_code,
      icon: 'book', // Default icon for subjects
      createdDate: new Date(subject.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(subject.updated_at).toLocaleDateString('en-US')
    }));
    
    return json({
      success: true,
      data: subjects
    });
    
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return json({
      success: false,
      message: 'Failed to fetch subjects: ' + error.message
    }, { status: 500 });
  }
}

// POST /api/subjects - Create a new subject
export async function POST({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { name, code, gradeLevel } = data;
    
    // Validation
    if (!name || !code || !gradeLevel) {
      return json({
        success: false,
        message: 'Name, code, and grade level are required'
      }, { status: 400 });
    }
    
    // Check if subject code already exists
    const existingSubject = await query(
      'SELECT id FROM subjects WHERE code = $1',
      [code]
    );
    
    if (existingSubject.rows.length > 0) {
      return json({
        success: false,
        message: 'Subject code already exists'
      }, { status: 409 });
    }
    
    // Insert new subject
    const result = await query(
      `INSERT INTO subjects (name, code, grade_level) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, code, grade_level, created_at, updated_at`,
      [name, code, parseInt(gradeLevel)]
    );
    
    const newSubject = result.rows[0];
    
    // Log the subject creation activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'subject_created',
        user,
        {
          name: newSubject.name,
          code: newSubject.code,
          grade_level: newSubject.grade_level
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error('Error logging subject creation activity:', logError);
      // Don't fail the subject creation if logging fails
    }
    
    // Format response to match component structure
    const formattedSubject = {
      id: newSubject.id,
      name: newSubject.name,
      code: newSubject.code,
      gradeLevel: `Grade ${newSubject.grade_level}`,
      createdDate: new Date(newSubject.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(newSubject.updated_at).toLocaleDateString('en-US')
    };
    
    return json({
      success: true,
      message: `Subject "${name}" created successfully`,
      data: formattedSubject
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating subject:', error);
    return json({
      success: false,
      message: 'Failed to create subject: ' + error.message
    }, { status: 500 });
  }
}

// PUT /api/subjects - Update an existing subject
export async function PUT({ request }) {
  try {
    const data = await request.json();
    const { id, name, code, gradeLevel } = data;
    
    // Validation
    if (!id || !name || !code || !gradeLevel) {
      return json({
        success: false,
        message: 'ID, name, code, and grade level are required'
      }, { status: 400 });
    }
    
    // Check if subject exists
    const existingSubject = await query(
      'SELECT id FROM subjects WHERE id = $1',
      [id]
    );
    
    if (existingSubject.rows.length === 0) {
      return json({
        success: false,
        message: 'Subject not found'
      }, { status: 404 });
    }
    
    // Check if new code conflicts with another subject
    const codeConflict = await query(
      'SELECT id FROM subjects WHERE code = $1 AND id != $2',
      [code, id]
    );
    
    if (codeConflict.rows.length > 0) {
      return json({
        success: false,
        message: 'Subject code already exists'
      }, { status: 409 });
    }
    
    // Update subject
    const result = await query(
      `UPDATE subjects 
       SET name = $1, code = $2, grade_level = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, code, grade_level, created_at, updated_at`,
      [name, code, parseInt(gradeLevel), id]
    );
    
    const updatedSubject = result.rows[0];
    
    // Format response to match component structure
    const formattedSubject = {
      id: updatedSubject.id,
      name: updatedSubject.name,
      code: updatedSubject.code,
      gradeLevel: `Grade ${updatedSubject.grade_level}`,
      createdDate: new Date(updatedSubject.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(updatedSubject.updated_at).toLocaleDateString('en-US')
    };
    
    return json({
      success: true,
      message: `Subject "${name}" updated successfully`,
      data: formattedSubject
    });
    
  } catch (error) {
    console.error('Error updating subject:', error);
    return json({
      success: false,
      message: 'Failed to update subject: ' + error.message
    }, { status: 500 });
  }
}

// DELETE /api/subjects - Delete a subject
export async function DELETE({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { id } = data;
    
    if (!id) {
      return json({
        success: false,
        message: 'Subject ID is required'
      }, { status: 400 });
    }
    
    // Check if subject exists and get its code and name
    const existingSubject = await query(
      'SELECT id, name, code FROM subjects WHERE id = $1',
      [id]
    );
    
    if (existingSubject.rows.length === 0) {
      return json({
        success: false,
        message: 'Subject not found'
      }, { status: 404 });
    }
    
    // Hard delete the subject
    await query(
      'DELETE FROM subjects WHERE id = $1',
      [id]
    );
    
    // Log the subject deletion activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'subject_deleted',
        user,
        {
          subject_code: existingSubject.rows[0].code,
          subject_name: existingSubject.rows[0].name,
          subject_id: id
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error('Error logging subject deletion activity:', logError);
      // Don't fail the deletion if logging fails
    }
    
    return json({
      success: true,
      message: `Subject "${existingSubject.rows[0].name} (${existingSubject.rows[0].code})" has been removed successfully`
    });
    
  } catch (error) {
    console.error('Error deleting subject:', error);
    return json({
      success: false,
      message: 'Failed to delete subject: ' + error.message
    }, { status: 500 });
  }
}
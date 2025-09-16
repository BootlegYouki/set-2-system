import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

// GET /api/subjects - Fetch all subjects with optional filtering
export async function GET({ url }) {
  try {
    const searchTerm = url.searchParams.get('search') || '';
    const gradeLevel = url.searchParams.get('grade_level');
    
    let sqlQuery = `
      SELECT 
        id,
        name,
        code,
        grade_level,
        created_at,
        updated_at
      FROM subjects
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
      gradeLevel: `Grade ${subject.grade_level}`,
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
export async function POST({ request }) {
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
export async function DELETE({ request }) {
  try {
    const data = await request.json();
    const { id } = data;
    
    if (!id) {
      return json({
        success: false,
        message: 'Subject ID is required'
      }, { status: 400 });
    }
    
    // Check if subject exists and get its name
    const existingSubject = await query(
      'SELECT id, name FROM subjects WHERE id = $1',
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
    
    return json({
      success: true,
      message: `Subject "${existingSubject.rows[0].name}" has been removed successfully`
    });
    
  } catch (error) {
    console.error('Error deleting subject:', error);
    return json({
      success: false,
      message: 'Failed to delete subject: ' + error.message
    }, { status: 500 });
  }
}
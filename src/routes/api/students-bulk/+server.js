import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';

// GET /api/students-bulk - Get all students with their sections and GWA in one optimized query
export async function GET({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    // Single optimized query to get all student data with sections and grades
    const studentsQuery = `
      WITH student_grades AS (
        SELECT 
          fg.student_id,
          AVG(fg.final_grade) as gwa
        FROM final_grades fg
        WHERE fg.verified = true 
        AND fg.final_grade IS NOT NULL
        GROUP BY fg.student_id
      )
      SELECT 
        u.id,
        u.account_number,
        u.full_name,
        u.grade_level,
        s.name as section_name,
        sg.gwa,
        CASE 
          WHEN ss.student_id IS NOT NULL THEN true 
          ELSE false 
        END as has_section
      FROM users u
      LEFT JOIN section_students ss ON u.id = ss.student_id AND ss.status = 'active'
      LEFT JOIN sections s ON ss.section_id = s.id AND s.status = 'active'
      LEFT JOIN student_grades sg ON u.id = sg.student_id
      WHERE u.account_type = 'student' 
      AND (u.status IS NULL OR u.status = 'active')
      AND u.grade_level IS NOT NULL
      ORDER BY u.full_name
    `;

    const result = await query(studentsQuery);

    // Format the data to match frontend expectations
    const students = result.rows.map(row => ({
      id: row.account_number || row.id,
      name: row.full_name,
      gradeLevel: row.grade_level?.toString() || 'Not specified',
      section: row.section_name || 'No section',
      gwa: row.gwa ? parseFloat(row.gwa) : 0,
      studentId: row.id,
      hasSection: row.has_section
    }));

    return json({ 
      success: true, 
      students,
      count: students.length 
    });

  } catch (error) {
    console.error('Error fetching students bulk data:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to fetch students data' }, { status: 500 });
  }
}
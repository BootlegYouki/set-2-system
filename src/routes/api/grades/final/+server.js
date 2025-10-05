import { json } from '@sveltejs/kit';
import { query } from '../../../../database/db.js';
import { verifyAuth } from '../../../api/helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  console.log('=== FINAL GRADES SAVE API CALLED ===');
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request, ['teacher']);
    
    if (!authResult.success) {
      console.log('Authentication failed:', authResult.error);
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    console.log('User authenticated:', authResult.user.account_number);

    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { section_id, subject_id, grading_period_id, final_grades } = body;

    // Validate required fields
    if (!section_id || !subject_id || !grading_period_id || !final_grades || !Array.isArray(final_grades)) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const teacherId = authResult.user.id;

    // Start transaction
    await query('BEGIN');

    try {
      const results = [];

      // Process each student's final grades
      for (const studentGrade of final_grades) {
        const { 
          student_id, 
          written_work_average, 
          performance_tasks_average, 
          quarterly_assessment_average, 
          final_grade,
          letter_grade,
          written_work_items,
          performance_tasks_items,
          quarterly_assessment_items
        } = studentGrade;

        console.log(`Processing final grades for student: ${student_id}`);

        // Convert student account number to student ID if needed
        let actualStudentId = student_id;
        if (typeof student_id === 'string' || (typeof student_id === 'number' && student_id > 1000)) {
          try {
            const studentQuery = 'SELECT id FROM users WHERE account_number = $1 AND account_type = $2';
            const studentResult = await query(studentQuery, [student_id, 'student']);
            
            if (studentResult.rows.length === 0) {
              console.log(`Student not found: ${student_id}`);
              continue; // Skip this student
            }
            
            actualStudentId = studentResult.rows[0].id;
            console.log(`Found student ID: ${actualStudentId} for account: ${student_id}`);
          } catch (error) {
            console.error(`Error finding student ${student_id}:`, error);
            continue; // Skip this student
          }
        }

        // Check if grades are already verified - if so, skip this student
        try {
          const verificationQuery = `
            SELECT verified 
            FROM final_grades 
            WHERE student_id = $1 
              AND section_id = $2 
              AND subject_id = $3 
              AND grading_period_id = $4
          `;
          const verificationResult = await query(verificationQuery, [
            actualStudentId, 
            section_id, 
            subject_id, 
            grading_period_id
          ]);

          if (verificationResult.rows.length > 0 && verificationResult.rows[0].verified) {
            console.log(`Skipping student ${student_id} - grades already verified by adviser`);
            continue; // Skip this student as grades are already verified
          }
        } catch (error) {
          console.error(`Error checking verification status for student ${student_id}:`, error);
          continue; // Skip this student on error
        }

        // Calculate letter grade based on final grade
        const calculatedLetterGrade = calculateLetterGrade(final_grade);

        // Upsert final grade record
        const upsertQuery = `
          INSERT INTO final_grades (
            student_id, 
            section_id, 
            subject_id, 
            grading_period_id, 
            written_work_average, 
            performance_tasks_average, 
            quarterly_assessment_average, 
            final_grade, 
            letter_grade,
            written_work_items,
            performance_tasks_items,
            quarterly_assessment_items,
            computed_at,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (student_id, section_id, subject_id, grading_period_id)
          DO UPDATE SET 
            written_work_average = EXCLUDED.written_work_average,
            performance_tasks_average = EXCLUDED.performance_tasks_average,
            quarterly_assessment_average = EXCLUDED.quarterly_assessment_average,
            final_grade = EXCLUDED.final_grade,
            letter_grade = EXCLUDED.letter_grade,
            written_work_items = EXCLUDED.written_work_items,
            performance_tasks_items = EXCLUDED.performance_tasks_items,
            quarterly_assessment_items = EXCLUDED.quarterly_assessment_items,
            computed_at = EXCLUDED.computed_at,
            updated_at = EXCLUDED.updated_at
          RETURNING *
        `;

        const result = await query(upsertQuery, [
          actualStudentId,
          section_id,
          subject_id,
          grading_period_id,
          written_work_average || null,
          performance_tasks_average || null,
          quarterly_assessment_average || null,
          final_grade || null,
          calculatedLetterGrade,
          JSON.stringify(written_work_items || []),
          JSON.stringify(performance_tasks_items || []),
          JSON.stringify(quarterly_assessment_items || [])
        ]);

        results.push(result.rows[0]);
        console.log(`Final grades saved for student ${actualStudentId}`);
      }

      // Commit transaction
      await query('COMMIT');

      return json({ 
        success: true, 
        message: `Final grades saved successfully for ${results.length} students`,
        results 
      });

    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error saving final grades:', error);
    return json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// Helper function to calculate letter grade based on numeric grade
function calculateLetterGrade(numericGrade) {
  if (!numericGrade || numericGrade === '' || isNaN(numericGrade)) {
    return 'F';
  }

  const grade = parseFloat(numericGrade);
  
  if (grade >= 97) return 'A+';
  if (grade >= 93) return 'A';
  if (grade >= 90) return 'A-';
  if (grade >= 87) return 'B+';
  if (grade >= 83) return 'B';
  if (grade >= 80) return 'B-';
  if (grade >= 77) return 'C+';
  if (grade >= 73) return 'C';
  if (grade >= 70) return 'C-';
  if (grade >= 67) return 'D+';
  if (grade >= 65) return 'D';
  if (grade >= 60) return 'D-';
  
  return 'F';
}
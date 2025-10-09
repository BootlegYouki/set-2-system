import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const sectionId = url.searchParams.get('section_id');
    const subjectId = url.searchParams.get('subject_id');
    const gradingPeriodId = url.searchParams.get('grading_period_id');
    const studentId = url.searchParams.get('student_id');
    const action = url.searchParams.get('action');

    // Get students with grades for a specific section, subject, and grading period
    if (action === 'students_with_grades' && sectionId && subjectId && gradingPeriodId) {
      const studentsQuery = `
        SELECT DISTINCT
          u.id,
          u.account_number,
          u.full_name,
          u.first_name,
          u.last_name
        FROM users u
        JOIN section_students ss ON u.id = ss.student_id
        WHERE ss.section_id = $1
        AND u.account_type = 'student'
        AND ss.status = 'active'
        AND u.status = 'active'
        ORDER BY u.full_name
      `;
      
      const students = await query(studentsQuery, [sectionId]);

      // Get grade items for this section, subject, and grading period
      const gradeItemsQuery = `
        SELECT 
          gi.id,
          gi.name,
          gi.total_score,
          gc.name as category_name,
          gc.code as category_code,
          gc.weight as category_weight
        FROM grade_items gi
        JOIN grade_categories gc ON gi.category_id = gc.id
        WHERE gi.section_id = $1
        AND gi.subject_id = $2
        AND gi.grading_period_id = $3
        AND gi.status = 'active'
        ORDER BY gc.code, gi.id
      `;
      
      const gradeItems = await query(gradeItemsQuery, [sectionId, subjectId, gradingPeriodId]);

      // Get all grades for these students and grade items
      const gradesQuery = `
        SELECT 
          sg.student_id,
          sg.grade_item_id,
          sg.score,
          gi.total_score,
          gc.code as category_code
        FROM student_grades sg
        JOIN grade_items gi ON sg.grade_item_id = gi.id
        JOIN grade_categories gc ON gi.category_id = gc.id
        WHERE gi.section_id = $1
        AND gi.subject_id = $2
        AND gi.grading_period_id = $3
      `;
      
      const grades = await query(gradesQuery, [sectionId, subjectId, gradingPeriodId]);

      // Get final grades
      const finalGradesQuery = `
        SELECT 
          student_id,
          written_work_average,
          performance_tasks_average,
          quarterly_assessment_average,
          final_grade,
          letter_grade
        FROM final_grades
        WHERE section_id = $1
        AND subject_id = $2
        AND grading_period_id = $3
      `;
      
      const finalGrades = await query(finalGradesQuery, [sectionId, subjectId, gradingPeriodId]);

      // Organize data for frontend
      const studentsWithGrades = students.rows.map(student => {
        const studentGrades = grades.rows.filter(g => g.student_id === student.id);
        const studentFinalGrade = finalGrades.rows.find(fg => fg.student_id === student.id);
        
        // Group grades by category
        const writtenWork = [];
        const performanceTasks = [];
        const quarterlyAssessment = [];
        
        gradeItems.rows.forEach(item => {
          const grade = studentGrades.find(g => g.grade_item_id === item.id);
          const gradeData = {
            itemId: item.id,
            itemName: item.name,
            totalScore: item.total_score,
            score: grade ? grade.score : null
          };
          
          if (item.category_code === 'WW') {
            writtenWork.push(gradeData);
          } else if (item.category_code === 'PT') {
            performanceTasks.push(gradeData);
          } else if (item.category_code === 'QA') {
            quarterlyAssessment.push(gradeData);
          }
        });

        return {
          id: student.id,
          accountNumber: student.account_number,
          name: student.full_name,
          firstName: student.first_name,
          lastName: student.last_name,
          writtenWork,
          performanceTasks,
          quarterlyAssessment,
          averages: {
            writtenWork: studentFinalGrade?.written_work_average || 0,
            performanceTasks: studentFinalGrade?.performance_tasks_average || 0,
            quarterlyAssessment: studentFinalGrade?.quarterly_assessment_average || 0
          },
          finalGrade: studentFinalGrade?.final_grade || 0,
          letterGrade: studentFinalGrade?.letter_grade || ''
        };
      });

      // Get grading configuration
      const gradingConfig = {
        writtenWork: {
          count: gradeItems.rows.filter(item => item.category_code === 'WW').length,
          weight: gradeItems.rows.find(item => item.category_code === 'WW')?.category_weight || 0.30,
          label: "WW",
          items: gradeItems.rows.filter(item => item.category_code === 'WW')
        },
        performanceTasks: {
          count: gradeItems.rows.filter(item => item.category_code === 'PT').length,
          weight: gradeItems.rows.find(item => item.category_code === 'PT')?.category_weight || 0.50,
          label: "PT",
          items: gradeItems.rows.filter(item => item.category_code === 'PT')
        },
        quarterlyAssessment: {
          count: gradeItems.rows.filter(item => item.category_code === 'QA').length,
          weight: gradeItems.rows.find(item => item.category_code === 'QA')?.category_weight || 0.20,
          label: "QA",
          items: gradeItems.rows.filter(item => item.category_code === 'QA')
        }
      };

      return json({
        success: true,
        students: studentsWithGrades,
        gradingConfig,
        gradeItems: gradeItems.rows
      });
    }

    // Get grading periods
    if (action === 'grading_periods') {
      const periodsQuery = `
        SELECT id, name, school_year, start_date, end_date, status
        FROM grading_periods
        WHERE status = 'active'
        ORDER BY start_date
      `;
      
      const periods = await query(periodsQuery);
      return json({ success: true, gradingPeriods: periods.rows });
    }

    // Get grade categories
    if (action === 'categories') {
      const categoriesQuery = `
        SELECT id, name, code, weight, description
        FROM grade_categories
        ORDER BY id
      `;
      
      const categories = await query(categoriesQuery);
      return json({ success: true, categories: categories.rows });
    }

    return json({ error: 'Invalid action or missing parameters' }, { status: 400 });

  } catch (error) {
    console.error('Error in student-grades GET:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Create grade item
    if (action === 'create_grade_item') {
      const { sectionId, subjectId, teacherId, gradingPeriodId, categoryId, name, description, totalScore, dateGiven, dueDate } = body;
      
      const insertQuery = `
        INSERT INTO grade_items (section_id, subject_id, teacher_id, grading_period_id, category_id, name, description, total_score, date_given, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const result = await query(insertQuery, [
        sectionId, subjectId, teacherId, gradingPeriodId, categoryId, 
        name, description, totalScore || 100, dateGiven, dueDate
      ]);
      
      return json({ success: true, gradeItem: result.rows[0] });
    }

    // Update student grade
    if (action === 'update_grade') {
      const { studentId, gradeItemId, score, gradedBy } = body;
      
      const upsertQuery = `
        INSERT INTO student_grades (student_id, grade_item_id, score, graded_by, graded_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (student_id, grade_item_id)
        DO UPDATE SET 
          score = EXCLUDED.score,
          graded_by = EXCLUDED.graded_by,
          graded_at = EXCLUDED.graded_at,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await query(upsertQuery, [studentId, gradeItemId, score, gradedBy]);
      
      return json({ success: true, grade: result.rows[0] });
    }

    // Bulk update grades
    if (action === 'bulk_update_grades') {
      const { grades, gradedBy } = body;
      
      const results = [];
      for (const grade of grades) {
        const { studentId, gradeItemId, score } = grade;
        
        const upsertQuery = `
          INSERT INTO student_grades (student_id, grade_item_id, score, graded_by, graded_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (student_id, grade_item_id)
          DO UPDATE SET 
            score = EXCLUDED.score,
            graded_by = EXCLUDED.graded_by,
            graded_at = EXCLUDED.graded_at,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        const result = await query(upsertQuery, [studentId, gradeItemId, score, gradedBy]);
        results.push(result.rows[0]);
      }
      
      return json({ success: true, grades: results });
    }

    return json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in student-grades POST:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Update grade item
    if (action === 'update_grade_item') {
      const { id, name, description, totalScore, dateGiven, dueDate } = body;
      
      const updateQuery = `
        UPDATE grade_items 
        SET name = $2, description = $3, total_score = $4, date_given = $5, due_date = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await query(updateQuery, [id, name, description, totalScore, dateGiven, dueDate]);
      
      if (result.rows.length === 0) {
        return json({ error: 'Grade item not found' }, { status: 404 });
      }
      
      return json({ success: true, gradeItem: result.rows[0] });
    }

    return json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in student-grades PUT:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Delete grade item
    if (action === 'delete_grade_item') {
      const { id } = body;
      
      const deleteQuery = `
        UPDATE grade_items 
        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await query(deleteQuery, [id]);
      
      if (result.rows.length === 0) {
        return json({ error: 'Grade item not found' }, { status: 404 });
      }
      
      return json({ success: true, message: 'Grade item deleted successfully' });
    }

    return json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in student-grades DELETE:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
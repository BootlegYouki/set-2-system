import { json } from '@sveltejs/kit';
import { query } from '../../../../database/db.js';
import { verifyAuth } from '../../../api/helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request, ['teacher']);
    
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json();
    
    const { section_id, subject_id, grading_period_id, grading_config, grades } = body;

    // Validate required fields
    if (!section_id || !subject_id || !grading_period_id || !grades || !Array.isArray(grades)) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const teacherId = authResult.user.id;

    // Start transaction
    await query('BEGIN');

    try {
      // Get or create grade categories
      const categories = await getOrCreateCategories();
      
      // Process each assessment type
      const results = {
        writtenWork: [],
        performanceTasks: [],
        quarterlyAssessment: []
      };

      // Process Written Work grades
      if (grading_config.writtenWork) {
        results.writtenWork = await processAssessmentGrades(
          grades,
          'writtenWork',
          categories.writtenWork,
          section_id,
          subject_id,
          grading_period_id,
          teacherId,
          grading_config.writtenWork
        );
      }

      // Process Performance Tasks grades
      if (grading_config.performanceTasks) {
        results.performanceTasks = await processAssessmentGrades(
          grades,
          'performanceTasks',
          categories.performanceTasks,
          section_id,
          subject_id,
          grading_period_id,
          teacherId,
          grading_config.performanceTasks
        );
      }

      // Process Quarterly Assessment grades
      if (grading_config.quarterlyAssessment) {
        results.quarterlyAssessment = await processAssessmentGrades(
          grades,
          'quarterlyAssessment',
          categories.quarterlyAssessment,
          section_id,
          subject_id,
          grading_period_id,
          teacherId,
          grading_config.quarterlyAssessment
        );
      }

      // Commit transaction
      await query('COMMIT');

      return json({ 
        success: true, 
        message: 'Grades saved successfully',
        results 
      });

    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error saving grades:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getOrCreateCategories() {
  // Get existing categories or create them if they don't exist
  const categoryQuery = `
    SELECT id, name, code FROM grade_categories 
    WHERE code IN ('WW', 'PT', 'QA')
  `;
  
  const existingCategories = await query(categoryQuery);
  const categoryMap = {};
  
  existingCategories.rows.forEach(cat => {
    if (cat.code === 'WW') categoryMap.writtenWork = cat.id;
    if (cat.code === 'PT') categoryMap.performanceTasks = cat.id;
    if (cat.code === 'QA') categoryMap.quarterlyAssessment = cat.id;
  });

  // Create missing categories
  if (!categoryMap.writtenWork) {
    const result = await query(
      `INSERT INTO grade_categories (name, code, weight) VALUES ('Written Work', 'WW', 0.30) RETURNING id`
    );
    categoryMap.writtenWork = result.rows[0].id;
  }

  if (!categoryMap.performanceTasks) {
    const result = await query(
      `INSERT INTO grade_categories (name, code, weight) VALUES ('Performance Tasks', 'PT', 0.50) RETURNING id`
    );
    categoryMap.performanceTasks = result.rows[0].id;
  }

  if (!categoryMap.quarterlyAssessment) {
    const result = await query(
      `INSERT INTO grade_categories (name, code, weight) VALUES ('Quarterly Assessment', 'QA', 0.20) RETURNING id`
    );
    categoryMap.quarterlyAssessment = result.rows[0].id;
  }

  return categoryMap;
}

async function processAssessmentGrades(grades, assessmentType, categoryId, sectionId, subjectId, gradingPeriodId, teacherId, config) {
  const results = [];
  
  // Get or create grade items for this assessment type
  const gradeItems = await getOrCreateGradeItems(
    sectionId, 
    subjectId, 
    gradingPeriodId, 
    categoryId, 
    teacherId, 
    config,
    assessmentType
  );

  // Process each student's grades for this assessment type
  for (const studentGrade of grades) {
    const studentAccountNumber = studentGrade.student_id;
    const assessmentGrades = studentGrade[assessmentType];

    // Convert student account number to student ID
    let studentId;
    try {
      const studentQuery = 'SELECT id FROM users WHERE account_number = $1 AND account_type = $2';
      const studentResult = await query(studentQuery, [studentAccountNumber, 'student']);
      
      if (studentResult.rows.length === 0) {
        continue; // Skip this student
      }
      
      studentId = studentResult.rows[0].id;
    } catch (error) {
      continue; // Skip this student
    }

    if (assessmentGrades && Array.isArray(assessmentGrades)) {
      for (let i = 0; i < assessmentGrades.length; i++) {
        const score = assessmentGrades[i];
        const gradeItem = gradeItems[i];

        if (gradeItem && score !== null && score !== undefined && score !== '') {
          // Save or update the grade
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

          const result = await query(upsertQuery, [studentId, gradeItem.id, parseFloat(score), teacherId]);
          results.push(result.rows[0]);
        }
      }
    }
  }

  return results;
}

async function getOrCreateGradeItems(sectionId, subjectId, gradingPeriodId, categoryId, teacherId, config, assessmentType) {
  const gradeItems = [];
  const count = config.count || 1;
  const totals = config.totals || [];

  for (let i = 0; i < count; i++) {
    const itemName = `${config.label || assessmentType} ${i + 1}`;
    const totalScore = totals[i] || 100;

    // Check if grade item already exists
    const existingQuery = `
      SELECT * FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 
        AND category_id = $4 AND name = $5
    `;

    const existing = await query(existingQuery, [sectionId, subjectId, gradingPeriodId, categoryId, itemName]);

    if (existing.rows.length > 0) {
      gradeItems.push(existing.rows[0]);
    } else {
      // Create new grade item
      const insertQuery = `
        INSERT INTO grade_items (section_id, subject_id, teacher_id, grading_period_id, category_id, name, total_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await query(insertQuery, [
        sectionId, subjectId, teacherId, gradingPeriodId, categoryId, itemName, totalScore
      ]);

      gradeItems.push(result.rows[0]);
    }
  }

  return gradeItems;
}
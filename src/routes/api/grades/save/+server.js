import { json } from '@sveltejs/kit';
import { query } from '../../../../database/db.js';
import { verifyAuth } from '../../../api/helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  console.log('=== GRADES SAVE API CALLED ===');
  
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

      // Process WW grades
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

      // Process PT grades
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

      // Process QA grades
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
      console.error('Transaction error:', error);
      console.error('Transaction error details:', {
        message: error.message,
        stack: error.stack,
        sectionId: section_id,
        subjectId: subject_id,
        gradingPeriodId: grading_period_id,
        gradesCount: grades?.length
      });
      throw error;
    }

  } catch (error) {
    console.error('Error saving grades:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: body
    });
    return json({ error: 'Internal server error', details: error.message }, { status: 500 });
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

    console.log(`Processing student: ${studentAccountNumber}, assessment: ${assessmentType}`);

    // Convert student account number to student ID
    let studentId;
    try {
      const studentQuery = 'SELECT id FROM users WHERE account_number = $1 AND account_type = $2';
      const studentResult = await query(studentQuery, [studentAccountNumber, 'student']);
      
      if (studentResult.rows.length === 0) {
        console.log(`Student not found: ${studentAccountNumber}`);
        continue; // Skip this student
      }
      
      studentId = studentResult.rows[0].id;
      console.log(`Found student ID: ${studentId} for account: ${studentAccountNumber}`);
    } catch (error) {
      console.error(`Error finding student ${studentAccountNumber}:`, error);
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
  
  // Handle case where config might only have weight (from frontend)
  // Default to 1 item if count is not specified
  const count = config?.count || 1;
  const totals = config?.totals || [];

  console.log(`Creating grade items for ${assessmentType}:`, { sectionId, subjectId, gradingPeriodId, categoryId, count, config });

  for (let i = 0; i < count; i++) {
    const itemName = `${config?.label || assessmentType} ${i + 1}`;
    const totalScore = totals[i] || 100; // Default to 100 if no total specified

    console.log(`Processing grade item: ${itemName}, totalScore: ${totalScore}`);

    // Check if grade item already exists
    const existingQuery = `
      SELECT * FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 
        AND category_id = $4 AND name = $5
    `;

    try {
      const existing = await query(existingQuery, [sectionId, subjectId, gradingPeriodId, categoryId, itemName]);

      if (existing.rows.length > 0) {
        console.log(`Found existing grade item: ${itemName}`);
        gradeItems.push(existing.rows[0]);
      } else {
        console.log(`Creating new grade item: ${itemName}`);
        // Create new grade item
        const insertQuery = `
          INSERT INTO grade_items (section_id, subject_id, teacher_id, grading_period_id, category_id, name, total_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const result = await query(insertQuery, [
          sectionId, subjectId, teacherId, gradingPeriodId, categoryId, itemName, totalScore
        ]);

        console.log(`Created grade item with ID: ${result.rows[0].id}`);
        gradeItems.push(result.rows[0]);
      }
    } catch (error) {
      console.error(`Error processing grade item ${itemName}:`, error);
      throw error;
    }
  }

  console.log(`Returning ${gradeItems.length} grade items for ${assessmentType}`);
  return gradeItems;
}
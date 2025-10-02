import { json } from '@sveltejs/kit';
import { query } from '../../../../database/db.js';
import { verifyAuth } from '../../../api/helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  console.log('=== GRADES SAVE API CALLED ===');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  // Log all headers for debugging
  console.log('Request headers:');
  for (const [key, value] of request.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  // Clone request to read body for logging
  const requestClone = request.clone();
  let requestBody = null;
  try {
    requestBody = await requestClone.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
  } catch (bodyError) {
    console.log('Could not parse request body as JSON:', bodyError.message);
  }
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request, ['teacher']);
    console.log('Auth result:', authResult);
    
    if (!authResult.success) {
      console.log('Authentication failed:', authResult.error);
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { section_id, subject_id, grading_period_id, grading_config, grades } = body;

    // Validate required fields
    if (!section_id || !subject_id || !grading_period_id || !grades || !Array.isArray(grades)) {
      console.log('Missing required fields:', { section_id, subject_id, grading_period_id, grades: !!grades });
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const teacherId = authResult.user.id;
    console.log('Teacher ID:', teacherId);

    // Start transaction
    console.log('Starting database transaction...');
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
      console.log('Transaction committed successfully');

      const response = { 
        success: true, 
        message: 'Grades saved successfully',
        results 
      };
      console.log('Sending success response:', response);
      return json(response);

    } catch (error) {
      // Rollback transaction on error
      console.log('Error occurred, rolling back transaction:', error);
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('=== GRADES SAVE API ERROR ===');
    console.error('Error saving grades:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Try to get request body for debugging
    try {
      const bodyText = await request.text();
      console.error('Request body that caused error:', bodyText);
    } catch (bodyError) {
      console.error('Could not read request body:', bodyError.message);
    }
    
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
  console.log(`Processing ${assessmentType} grades...`);
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
  
  console.log(`Found/created ${gradeItems.length} grade items for ${assessmentType}`);

  // Process each student's grades for this assessment type
  for (const studentGrade of grades) {
    const studentAccountNumber = studentGrade.student_id;
    const assessmentGrades = studentGrade[assessmentType];
    
    console.log(`Processing student ${studentAccountNumber} ${assessmentType}:`, assessmentGrades);

    // Convert student account number to student ID
    let studentId;
    try {
      const studentQuery = 'SELECT id FROM users WHERE account_number = $1 AND account_type = $2';
      const studentResult = await query(studentQuery, [studentAccountNumber, 'student']);
      
      if (studentResult.rows.length === 0) {
        console.error(`Student not found with account number: ${studentAccountNumber}`);
        continue; // Skip this student
      }
      
      studentId = studentResult.rows[0].id;
      console.log(`Converted account number ${studentAccountNumber} to student ID ${studentId}`);
    } catch (error) {
      console.error(`Error converting student account number ${studentAccountNumber}:`, error);
      continue; // Skip this student
    }

    if (assessmentGrades && Array.isArray(assessmentGrades)) {
      for (let i = 0; i < assessmentGrades.length; i++) {
        const score = assessmentGrades[i];
        const gradeItem = gradeItems[i];

        if (gradeItem && score !== null && score !== undefined && score !== '') {
          console.log(`Saving grade: Student ${studentId}, Item ${gradeItem.id}, Score ${score}`);
          
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
          console.log(`Grade saved successfully:`, result.rows[0]);
          results.push(result.rows[0]);
        } else {
          console.log(`Skipping grade: Student ${studentId}, Item ${i}, Score ${score} (empty or no grade item)`);
        }
      }
    } else {
      console.log(`No ${assessmentType} grades found for student ${studentId}`);
    }
  }

  console.log(`Completed processing ${assessmentType}, saved ${results.length} grades`);
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
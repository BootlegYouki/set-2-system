import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import { v as verifyAuth } from './auth-helper-VQdrszph.js';
import 'pg';
import 'dotenv';

async function POST({ request }) {
  console.log("=== GRADES SAVE API CALLED ===");
  try {
    const authResult = await verifyAuth(request, ["teacher"]);
    if (!authResult.success) {
      console.log("Authentication failed:", authResult.error);
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    console.log("User authenticated:", authResult.user.account_number);
    const body2 = await request.json();
    console.log("Request body received:", JSON.stringify(body2, null, 2));
    const { section_id, subject_id, grading_period_id, grading_config, grades } = body2;
    if (!section_id || !subject_id || !grading_period_id || !grades || !Array.isArray(grades)) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    const teacherId = authResult.user.id;
    await query("BEGIN");
    try {
      const categories = await getOrCreateCategories();
      const results = {
        writtenWork: [],
        performanceTasks: [],
        quarterlyAssessment: []
      };
      if (grading_config.writtenWork) {
        results.writtenWork = await processAssessmentGrades(
          grades,
          "writtenWork",
          await getExistingGradeItems(section_id, subject_id, grading_period_id, categories.writtenWork, teacherId, grading_config.writtenWork, "writtenWork"),
          teacherId
        );
      }
      if (grading_config.performanceTasks) {
        results.performanceTasks = await processAssessmentGrades(
          grades,
          "performanceTasks",
          await getExistingGradeItems(section_id, subject_id, grading_period_id, categories.performanceTasks, teacherId, grading_config.performanceTasks, "performanceTasks"),
          teacherId
        );
      }
      if (grading_config.quarterlyAssessment) {
        results.quarterlyAssessment = await processAssessmentGrades(
          grades,
          "quarterlyAssessment",
          await getExistingGradeItems(section_id, subject_id, grading_period_id, categories.quarterlyAssessment, teacherId, grading_config.quarterlyAssessment, "quarterlyAssessment"),
          teacherId
        );
      }
      await query("COMMIT");
      return json({
        success: true,
        message: "Grades saved successfully",
        results
      });
    } catch (error) {
      await query("ROLLBACK");
      console.error("Transaction error:", error);
      console.error("Transaction error details:", {
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
    console.error("Error saving grades:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      body
    });
    return json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
async function getOrCreateCategories() {
  const categoryQuery = `
    SELECT id, name, code FROM grade_categories 
    WHERE code IN ('WW', 'PT', 'QA')
  `;
  const existingCategories = await query(categoryQuery);
  const categoryMap = {};
  existingCategories.rows.forEach((cat) => {
    if (cat.code === "WW") categoryMap.writtenWork = cat.id;
    if (cat.code === "PT") categoryMap.performanceTasks = cat.id;
    if (cat.code === "QA") categoryMap.quarterlyAssessment = cat.id;
  });
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
async function processAssessmentGrades(grades, assessmentType, gradeItems, teacherId) {
  const results = [];
  for (const studentGrade of grades) {
    const studentAccountNumber = studentGrade.student_id;
    const assessmentGrades = studentGrade[assessmentType];
    console.log(`Processing student: ${studentAccountNumber}, assessment: ${assessmentType}`);
    let studentId;
    try {
      const studentQuery = "SELECT id FROM users WHERE account_number = $1 AND account_type = $2";
      const studentResult = await query(studentQuery, [studentAccountNumber, "student"]);
      if (studentResult.rows.length === 0) {
        console.log(`Student not found: ${studentAccountNumber}`);
        continue;
      }
      studentId = studentResult.rows[0].id;
      console.log(`Found student ID: ${studentId} for account: ${studentAccountNumber}`);
    } catch (error) {
      console.error(`Error finding student ${studentAccountNumber}:`, error);
      continue;
    }
    if (assessmentGrades && Array.isArray(assessmentGrades)) {
      for (let i = 0; i < assessmentGrades.length; i++) {
        const score = assessmentGrades[i];
        const gradeItem = gradeItems[i];
        if (gradeItem && score !== null && score !== void 0 && score !== "") {
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
async function getExistingGradeItems(sectionId, subjectId, gradingPeriodId, categoryId, teacherId, config, assessmentType) {
  console.log(`Getting existing grade items for ${assessmentType}:`, { sectionId, subjectId, gradingPeriodId, categoryId, config });
  try {
    const existingQuery = `
      SELECT * FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 
      AND category_id = $4
      ORDER BY created_at ASC
    `;
    const existing = await query(existingQuery, [sectionId, subjectId, gradingPeriodId, categoryId]);
    console.log(`Found ${existing.rows.length} existing grade items for ${assessmentType}`);
    return existing.rows;
  } catch (error) {
    console.error(`Error getting existing grade items for ${assessmentType}:`, error);
    throw error;
  }
}

export { POST };
//# sourceMappingURL=_server-IItkEPMv.js.map

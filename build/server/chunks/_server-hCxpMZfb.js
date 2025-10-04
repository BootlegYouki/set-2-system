import { j as json } from './index-CccDCyu_.js';
import { q as query, g as getClient } from './db--iX-5Jmg.js';
import { v as verifyAuth } from './auth-helper-VQdrszph.js';
import 'pg';
import 'dotenv';

async function GET({ url, request }) {
  try {
    const authResult = await verifyAuth(request, ["teacher"]);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const sectionId = url.searchParams.get("section_id");
    const subjectId = url.searchParams.get("subject_id");
    const gradingPeriodId = url.searchParams.get("grading_period_id");
    if (!sectionId || !subjectId || !gradingPeriodId) {
      return json({ error: "Missing required parameters: section_id, subject_id, grading_period_id" }, { status: 400 });
    }
    const teacherId = authResult.user.id;
    const gradeItemsQuery = `
      SELECT 
        gi.id,
        gi.name,
        gi.total_score,
        gi.category_id,
        gc.name as category_name,
        gc.code as category_code,
        gc.weight as category_weight
      FROM grade_items gi
      JOIN grade_categories gc ON gi.category_id = gc.id
      WHERE gi.section_id = $1
      AND gi.subject_id = $2
      AND gi.grading_period_id = $3
      AND gi.teacher_id = $4
      AND gi.status = 'active'
      ORDER BY gc.id, gi.created_at
    `;
    const result = await query(gradeItemsQuery, [sectionId, subjectId, gradingPeriodId, teacherId]);
    const gradeItemsByCategory = {
      writtenWork: [],
      performanceTasks: [],
      quarterlyAssessment: []
    };
    result.rows.forEach((item) => {
      const categoryKey = item.category_id === 1 ? "writtenWork" : item.category_id === 2 ? "performanceTasks" : "quarterlyAssessment";
      gradeItemsByCategory[categoryKey].push(item);
    });
    return json({
      success: true,
      gradeItems: gradeItemsByCategory
    });
  } catch (error) {
    console.error("Error fetching grade items:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
async function POST({ request }) {
  console.log("=== GRADE ITEMS API CALLED ===");
  try {
    const authResult = await verifyAuth(request, ["teacher"]);
    if (!authResult.success) {
      console.log("Authentication failed:", authResult.error);
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    console.log("User authenticated:", authResult.user.account_number);
    const body = await request.json();
    console.log("Request body received:", JSON.stringify(body, null, 2));
    const { action, section_id, subject_id, grading_period_id, category_id, grade_item_data } = body;
    if (!action || !section_id || !subject_id || !grading_period_id || !category_id) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    const teacherId = authResult.user.id;
    if (action === "add") {
      const gradeItem = await addGradeItem(teacherId, section_id, subject_id, grading_period_id, category_id, grade_item_data);
      return json({
        success: true,
        message: "Grade item added successfully",
        grade_item: gradeItem
      });
    } else if (action === "remove") {
      return await removeGradeItem(teacherId, section_id, subject_id, grading_period_id, category_id, grade_item_data);
    } else {
      return json({ error: 'Invalid action. Use "add" or "remove"' }, { status: 400 });
    }
  } catch (error) {
    console.error("Grade items API error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
async function PUT({ request }) {
  console.log("=== GRADE ITEMS UPDATE API CALLED ===");
  try {
    const authResult = await verifyAuth(request, ["teacher"]);
    if (!authResult.success) {
      console.log("Authentication failed:", authResult.error);
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    console.log("User authenticated:", authResult.user.account_number);
    const body = await request.json();
    console.log("Update request body received:", JSON.stringify(body, null, 2));
    const { grade_item_id, name, total_score } = body;
    if (!grade_item_id) {
      return json({ error: "Missing required field: grade_item_id" }, { status: 400 });
    }
    if (name === void 0 && total_score === void 0) {
      return json({ error: "At least one field (name or total_score) must be provided for update" }, { status: 400 });
    }
    const teacherId = authResult.user.id;
    const updatedGradeItem = await updateGradeItem(teacherId, grade_item_id, { name, total_score });
    return json({
      success: true,
      message: "Grade item updated successfully",
      grade_item: updatedGradeItem
    });
  } catch (error) {
    console.error("Grade items update API error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
async function DELETE({ request }) {
  console.log("=== GRADE ITEMS DELETE API CALLED ===");
  try {
    const authResult = await verifyAuth(request, ["teacher"]);
    if (!authResult.success) {
      console.log("Authentication failed:", authResult.error);
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    console.log("User authenticated:", authResult.user.account_number);
    const body = await request.json();
    console.log("Delete request body received:", JSON.stringify(body, null, 2));
    const { grade_item_id } = body;
    if (!grade_item_id) {
      return json({ error: "Missing required field: grade_item_id" }, { status: 400 });
    }
    const teacherId = authResult.user.id;
    const deletedGradeItem = await deleteGradeItem(teacherId, grade_item_id);
    return json({
      success: true,
      message: "Grade item deleted successfully",
      deleted_item: deletedGradeItem
    });
  } catch (error) {
    console.error("Grade items delete API error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
async function updateGradeItem(teacherId, gradeItemId, updateData) {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const verifyResult = await client.query(`
      SELECT id, name, total_score, section_id, subject_id, grading_period_id, category_id
      FROM grade_items 
      WHERE id = $1 AND teacher_id = $2 AND status = 'active'
    `, [gradeItemId, teacherId]);
    if (verifyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error("Grade item not found or unauthorized");
    }
    const currentItem = verifyResult.rows[0];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    if (updateData.name !== void 0 && updateData.name !== null) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(updateData.name.trim());
      paramIndex++;
    }
    if (updateData.total_score !== void 0 && updateData.total_score !== null) {
      const totalScore = parseFloat(updateData.total_score);
      if (isNaN(totalScore) || totalScore <= 0 || totalScore > 1e3) {
        await client.query("ROLLBACK");
        throw new Error("Total score must be a positive number between 1 and 1000");
      }
      updateFields.push(`total_score = $${paramIndex}`);
      updateValues.push(totalScore);
      paramIndex++;
    }
    if (updateFields.length === 0) {
      await client.query("ROLLBACK");
      throw new Error("No valid fields to update");
    }
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(gradeItemId, teacherId);
    const whereClause = `WHERE id = $${paramIndex} AND teacher_id = $${paramIndex + 1}`;
    const updateQuery = `
      UPDATE grade_items 
      SET ${updateFields.join(", ")}
      ${whereClause}
      RETURNING *
    `;
    console.log("Update query:", updateQuery);
    console.log("Update values:", updateValues);
    const updateResult = await client.query(updateQuery, updateValues);
    if (updateResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error("Failed to update grade item");
    }
    await client.query("COMMIT");
    console.log("Grade item updated:", updateResult.rows[0]);
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating grade item:", error);
    throw error;
  } finally {
    client.release();
  }
}
async function addGradeItem(teacherId, sectionId, subjectId, gradingPeriodId, categoryId, gradeItemData) {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(`LOCK TABLE grade_items IN EXCLUSIVE MODE`);
    const existingItemsResult = await client.query(`
      SELECT name 
      FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 AND category_id = $4 AND teacher_id = $5 AND status = 'active'
      ORDER BY created_at
    `, [sectionId, subjectId, gradingPeriodId, categoryId, teacherId]);
    const categoryResult = await client.query(`
      SELECT name, code FROM grade_categories WHERE id = $1
    `, [categoryId]);
    if (categoryResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error("Invalid category");
    }
    const categoryCode = categoryResult.rows[0].code;
    let newItemNumber = 1;
    const existingNumbers = existingItemsResult.rows.map((row) => {
      const match = row.name.match(new RegExp(`${categoryCode}\\s+(\\d+)$`));
      return match ? parseInt(match[1]) : 0;
    }).filter((num) => num > 0).sort((a, b) => a - b);
    for (let i = 0; i < existingNumbers.length; i++) {
      if (existingNumbers[i] !== i + 1) {
        newItemNumber = i + 1;
        break;
      }
      newItemNumber = existingNumbers[i] + 1;
    }
    const itemName = gradeItemData?.name || `${categoryCode} ${newItemNumber}`;
    const totalScore = gradeItemData?.total_score || 100;
    const insertResult = await client.query(`
      INSERT INTO grade_items (section_id, subject_id, teacher_id, grading_period_id, category_id, name, total_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `, [sectionId, subjectId, teacherId, gradingPeriodId, categoryId, itemName, totalScore]);
    await client.query("COMMIT");
    console.log("Grade item added:", insertResult.rows[0]);
    return insertResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding grade item:", error);
    throw error;
  } finally {
    client.release();
  }
}
async function removeGradeItem(teacherId, sectionId, subjectId, gradingPeriodId, categoryId, gradeItemData) {
  try {
    const gradeItemId = gradeItemData?.grade_item_id;
    let itemToRemove;
    if (gradeItemId) {
      const specificItemResult = await query(`
        SELECT id, name 
        FROM grade_items 
        WHERE id = $1 AND section_id = $2 AND subject_id = $3 AND grading_period_id = $4 AND category_id = $5 AND teacher_id = $6 AND status = 'active'
      `, [gradeItemId, sectionId, subjectId, gradingPeriodId, categoryId, teacherId]);
      if (specificItemResult.rows.length === 0) {
        return json({ error: "Grade item not found or unauthorized" }, { status: 404 });
      }
      itemToRemove = specificItemResult.rows[0];
    } else {
      const itemsResult = await query(`
        SELECT id, name 
        FROM grade_items 
        WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 AND category_id = $4 AND teacher_id = $5 AND status = 'active'
        ORDER BY created_at DESC
      `, [sectionId, subjectId, gradingPeriodId, categoryId, teacherId]);
      if (itemsResult.rows.length === 0) {
        return json({ error: "No grade items found to remove" }, { status: 400 });
      }
      if (itemsResult.rows.length <= 1) {
        return json({ error: "Cannot remove the last grade item. At least one item is required." }, { status: 400 });
      }
      itemToRemove = itemsResult.rows[0];
    }
    const countResult = await query(`
      SELECT COUNT(*) as count 
      FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 AND category_id = $4 AND teacher_id = $5 AND status = 'active'
    `, [sectionId, subjectId, gradingPeriodId, categoryId, teacherId]);
    if (parseInt(countResult.rows[0].count) <= 1) {
      return json({ error: "Cannot remove the last grade item. At least one item is required." }, { status: 400 });
    }
    await query("BEGIN");
    try {
      await query(`
        DELETE FROM student_grades 
        WHERE grade_item_id = $1
      `, [itemToRemove.id]);
      const deleteResult = await query(`
        DELETE FROM grade_items 
        WHERE id = $1 AND teacher_id = $2
        RETURNING *
      `, [itemToRemove.id, teacherId]);
      if (deleteResult.rows.length === 0) {
        await query("ROLLBACK");
        return json({ error: "Grade item not found or unauthorized" }, { status: 404 });
      }
      await query("COMMIT");
      console.log("Grade item removed:", deleteResult.rows[0]);
      return json({
        success: true,
        message: "Grade item removed successfully",
        removed_item: deleteResult.rows[0]
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error removing grade item:", error);
    return json({ error: "Failed to remove grade item" }, { status: 500 });
  }
}
async function deleteGradeItem(teacherId, gradeItemId) {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const verifyResult = await client.query(`
      SELECT id, name, total_score, section_id, subject_id, grading_period_id, category_id
      FROM grade_items 
      WHERE id = $1 AND teacher_id = $2 AND status = 'active'
    `, [gradeItemId, teacherId]);
    if (verifyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error("Grade item not found or unauthorized");
    }
    const gradeItem = verifyResult.rows[0];
    const countResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 AND category_id = $4 AND teacher_id = $5 AND status = 'active'
    `, [gradeItem.section_id, gradeItem.subject_id, gradeItem.grading_period_id, gradeItem.category_id, teacherId]);
    if (parseInt(countResult.rows[0].count) <= 1) {
      await client.query("ROLLBACK");
      throw new Error("Cannot delete the last grade item. At least one item is required per category.");
    }
    await client.query(`
      DELETE FROM student_grades 
      WHERE grade_item_id = $1
    `, [gradeItemId]);
    const deleteResult = await client.query(`
      DELETE FROM grade_items 
      WHERE id = $1 AND teacher_id = $2
      RETURNING id, name, total_score
    `, [gradeItemId, teacherId]);
    if (deleteResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error("Failed to delete grade item");
    }
    await client.query("COMMIT");
    console.log("Grade item deleted:", deleteResult.rows[0]);
    return deleteResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export { DELETE, GET, POST, PUT };
//# sourceMappingURL=_server-hCxpMZfb.js.map

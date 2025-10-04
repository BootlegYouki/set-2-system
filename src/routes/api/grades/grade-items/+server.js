import { json } from '@sveltejs/kit';
import { query, getClient } from '../../../../database/db.js';
import { verifyAuth } from '../../../api/helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request, ['teacher']);
    
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const sectionId = url.searchParams.get('section_id');
    const subjectId = url.searchParams.get('subject_id');
    const gradingPeriodId = url.searchParams.get('grading_period_id');

    // Validate required fields
    if (!sectionId || !subjectId || !gradingPeriodId) {
      return json({ error: 'Missing required parameters: section_id, subject_id, grading_period_id' }, { status: 400 });
    }

    const teacherId = authResult.user.id;

    // Get grade items for this section, subject, and grading period
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
    
    // Group grade items by category
    const gradeItemsByCategory = {
      writtenWork: [],
      performanceTasks: [],
      quarterlyAssessment: []
    };

    result.rows.forEach(item => {
      const categoryKey = item.category_id === 1 ? 'writtenWork' : 
                         item.category_id === 2 ? 'performanceTasks' : 'quarterlyAssessment';
      gradeItemsByCategory[categoryKey].push(item);
    });

    return json({ 
      success: true, 
      gradeItems: gradeItemsByCategory
    });

  } catch (error) {
    console.error('Error fetching grade items:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  console.log('=== GRADE ITEMS API CALLED ===');
  
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
    
    const { action, section_id, subject_id, grading_period_id, category_id, grade_item_data } = body;

    // Validate required fields
    if (!action || !section_id || !subject_id || !grading_period_id || !category_id) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const teacherId = authResult.user.id;

    if (action === 'add') {
      const gradeItem = await addGradeItem(teacherId, section_id, subject_id, grading_period_id, category_id, grade_item_data);
      return json({ 
        success: true, 
        message: 'Grade item added successfully',
        grade_item: gradeItem
      });
    } else if (action === 'remove') {
      return await removeGradeItem(teacherId, section_id, subject_id, grading_period_id, category_id, grade_item_data);
    } else {
      return json({ error: 'Invalid action. Use "add" or "remove"' }, { status: 400 });
    }

  } catch (error) {
    console.error('Grade items API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function addGradeItem(teacherId, sectionId, subjectId, gradingPeriodId, categoryId, gradeItemData) {
  const client = await getClient();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get the current count of grade items for this category within the transaction
    // First, lock the table to prevent concurrent insertions
    await client.query(`LOCK TABLE grade_items IN EXCLUSIVE MODE`);
    
    const countResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 AND category_id = $4 AND teacher_id = $5 AND status = 'active'
    `, [sectionId, subjectId, gradingPeriodId, categoryId, teacherId]);

    const currentCount = parseInt(countResult.rows[0].count);
    
    // Get category name for generating item name
    const categoryResult = await client.query(`
      SELECT name, code FROM grade_categories WHERE id = $1
    `, [categoryId]);

    if (categoryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Invalid category');
    }

    const categoryName = categoryResult.rows[0].name;
    const newItemNumber = currentCount + 1;
    const itemName = gradeItemData?.name || `${categoryName} ${newItemNumber}`;
    const totalScore = gradeItemData?.total_score || 100;

    // Insert new grade item within the same transaction
    const insertResult = await client.query(`
      INSERT INTO grade_items (section_id, subject_id, teacher_id, grading_period_id, category_id, name, total_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `, [sectionId, subjectId, teacherId, gradingPeriodId, categoryId, itemName, totalScore]);

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Grade item added:', insertResult.rows[0]);

    return insertResult.rows[0];

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error adding grade item:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

async function removeGradeItem(teacherId, sectionId, subjectId, gradingPeriodId, categoryId, gradeItemData) {
  try {
    // Get all grade items for this category, ordered by creation date
    const itemsResult = await query(`
      SELECT id, name 
      FROM grade_items 
      WHERE section_id = $1 AND subject_id = $2 AND grading_period_id = $3 AND category_id = $4 AND teacher_id = $5 AND status = 'active'
      ORDER BY created_at DESC
    `, [sectionId, subjectId, gradingPeriodId, categoryId, teacherId]);

    if (itemsResult.rows.length === 0) {
      return json({ error: 'No grade items found to remove' }, { status: 400 });
    }

    if (itemsResult.rows.length <= 1) {
      return json({ error: 'Cannot remove the last grade item. At least one item is required.' }, { status: 400 });
    }

    // Remove the most recently created grade item (last column)
    const itemToRemove = itemsResult.rows[0];
    
    // Start transaction
    await query('BEGIN');

    try {
      // First, delete any grades associated with this grade item
      await query(`
        DELETE FROM student_grades 
        WHERE grade_item_id = $1
      `, [itemToRemove.id]);

      // Then, delete the grade item itself
      const deleteResult = await query(`
        DELETE FROM grade_items 
        WHERE id = $1 AND teacher_id = $2
        RETURNING *
      `, [itemToRemove.id, teacherId]);

      if (deleteResult.rows.length === 0) {
        await query('ROLLBACK');
        return json({ error: 'Grade item not found or unauthorized' }, { status: 404 });
      }

      await query('COMMIT');

      console.log('Grade item removed:', deleteResult.rows[0]);

      return json({ 
        success: true, 
        message: 'Grade item removed successfully',
        removed_item: deleteResult.rows[0]
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error removing grade item:', error);
    return json({ error: 'Failed to remove grade item' }, { status: 500 });
  }
}
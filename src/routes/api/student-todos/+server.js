import { json } from '@sveltejs/kit';
import { query } from '../../database/db.js';

// GET /api/student-todos - Fetch student todos
export async function GET({ url }) {
  try {
    const studentId = url.searchParams.get('student_id');
    
    if (!studentId) {
      return json({ error: 'student_id parameter is required' }, { status: 400 });
    }

    // Verify the student exists and is a student account
    const studentCheck = await query(`
      SELECT id FROM users 
      WHERE id = $1 AND account_type = 'student' AND (status IS NULL OR status = 'active')
    `, [studentId]);

    if (studentCheck.rows.length === 0) {
      return json({ error: 'Student not found or invalid account type' }, { status: 404 });
    }

    // Fetch todos for the student
    const todosResult = await query(`
      SELECT 
        id,
        title,
        description,
        category,
        due_date,
        completed,
        created_at,
        updated_at,
        completed_at
      FROM student_todos 
      WHERE student_id = $1
      ORDER BY 
        completed ASC,
        CASE 
          WHEN due_date IS NULL THEN 1 
          ELSE 0 
        END,
        due_date ASC,
        created_at DESC
    `, [studentId]);

    // Format the data to match frontend expectations
    const todos = todosResult.rows.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      category: todo.category,
      dueDate: todo.due_date ? (() => {
        // Convert UTC timestamp to local date in user's timezone (UTC+08:00)
        const date = new Date(todo.due_date);
        // Add 8 hours to convert from UTC to UTC+08:00
        const localDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
        const year = localDate.getUTCFullYear();
        const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(localDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })() : null,
      completed: todo.completed,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      completedAt: todo.completed_at
    }));

    return json({ success: true, data: todos });

  } catch (error) {
    console.error('Error in GET /api/student-todos:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

// POST /api/student-todos - Create a new todo
export async function POST({ request }) {
  try {
    const { studentId, title, description, category, dueDate } = await request.json();

    // Validate required fields
    if (!studentId || !title) {
      return json({ error: 'studentId and title are required' }, { status: 400 });
    }

    // Validate category
    const validCategories = ['assignment', 'study', 'personal', 'project', 'exam'];
    if (category && !validCategories.includes(category)) {
      return json({ error: 'Invalid category' }, { status: 400 });
    }

    // Verify the student exists and is a student account
    const studentCheck = await query(`
      SELECT id FROM users 
      WHERE id = $1 AND account_type = 'student' AND (status IS NULL OR status = 'active')
    `, [studentId]);

    if (studentCheck.rows.length === 0) {
      return json({ error: 'Student not found or invalid account type' }, { status: 404 });
    }

    console.log('Received dueDate:', dueDate);
    const processedDate = dueDate ? new Date(dueDate + 'T00:00:00.000Z') : null;
    console.log('Processed dueDate object:', processedDate);
    console.log('Processed dueDate ISO:', processedDate ? processedDate.toISOString() : null);

    // Insert the new todo
    const result = await query(`
      INSERT INTO student_todos (student_id, title, description, category, due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        title,
        description,
        category,
        due_date,
        completed,
        created_at,
        updated_at,
        completed_at
    `, [
      studentId,
      title.trim(),
      description ? description.trim() : null,
      category || 'personal',
      processedDate  // Use the processed Date object
    ]);

    const newTodo = result.rows[0];
    
    // Format the response
    const formattedTodo = {
      id: newTodo.id,
      title: newTodo.title,
      description: newTodo.description,
      category: newTodo.category,
      dueDate: newTodo.due_date ? newTodo.due_date.toISOString().split('T')[0] : null,
      completed: newTodo.completed,
      createdAt: newTodo.created_at,
      updatedAt: newTodo.updated_at,
      completedAt: newTodo.completed_at
    };

    return json({ success: true, data: formattedTodo }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/student-todos:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

// PUT /api/student-todos - Update a todo
export async function PUT({ request }) {
  try {
    const { id, studentId, title, description, category, dueDate, completed } = await request.json();

    // Validate required fields
    if (!id || !studentId) {
      return json({ error: 'id and studentId are required' }, { status: 400 });
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['assignment', 'study', 'personal', 'project', 'exam'];
      if (!validCategories.includes(category)) {
        return json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    // Verify the todo exists and belongs to the student
    const todoCheck = await query(`
      SELECT st.id 
      FROM student_todos st
      JOIN users u ON st.student_id = u.id
      WHERE st.id = $1 AND st.student_id = $2 AND u.account_type = 'student' AND (u.status IS NULL OR u.status = 'active')
    `, [id, studentId]);

    if (todoCheck.rows.length === 0) {
      return json({ error: 'Todo not found or access denied' }, { status: 404 });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description ? description.trim() : null);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCount++}`);
      values.push(dueDate || null);
    }
    if (completed !== undefined) {
      updateFields.push(`completed = $${paramCount++}`);
      values.push(completed);
    }

    if (updateFields.length === 0) {
      return json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add WHERE clause parameters
    values.push(id, studentId);

    const updateQuery = `
      UPDATE student_todos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount++} AND student_id = $${paramCount++}
      RETURNING 
        id,
        title,
        description,
        category,
        due_date,
        completed,
        created_at,
        updated_at,
        completed_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return json({ error: 'Todo not found' }, { status: 404 });
    }

    const updatedTodo = result.rows[0];
    
    // Format the response
    const formattedTodo = {
      id: updatedTodo.id,
      title: updatedTodo.title,
      description: updatedTodo.description,
      category: updatedTodo.category,
      dueDate: updatedTodo.due_date ? updatedTodo.due_date.toISOString().split('T')[0] : null,
      completed: updatedTodo.completed,
      createdAt: updatedTodo.created_at,
      updatedAt: updatedTodo.updated_at,
      completedAt: updatedTodo.completed_at
    };

    return json({ success: true, data: formattedTodo });

  } catch (error) {
    console.error('Error in PUT /api/student-todos:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

// DELETE /api/student-todos - Delete a todo
export async function DELETE({ request }) {
  try {
    const { id, studentId } = await request.json();

    // Validate required fields
    if (!id || !studentId) {
      return json({ error: 'id and studentId are required' }, { status: 400 });
    }

    // Verify the todo exists and belongs to the student
    const todoCheck = await query(`
      SELECT st.id 
      FROM student_todos st
      JOIN users u ON st.student_id = u.id
      WHERE st.id = $1 AND st.student_id = $2 AND u.account_type = 'student' AND (u.status IS NULL OR u.status = 'active')
    `, [id, studentId]);

    if (todoCheck.rows.length === 0) {
      return json({ error: 'Todo not found or access denied' }, { status: 404 });
    }

    // Delete the todo
    const result = await query(`
      DELETE FROM student_todos 
      WHERE id = $1 AND student_id = $2
      RETURNING id
    `, [id, studentId]);

    if (result.rows.length === 0) {
      return json({ error: 'Todo not found' }, { status: 404 });
    }

    return json({ success: true, message: 'Todo deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/student-todos:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
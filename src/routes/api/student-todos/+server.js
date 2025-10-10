import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';
import { ObjectId } from 'mongodb';

// GET /api/student-todos - Fetch student todos
export async function GET({ url }) {
  try {
    const studentId = url.searchParams.get('student_id');
    
    if (!studentId) {
      return json({ error: 'student_id parameter is required' }, { status: 400 });
    }

    const db = await connectToDatabase();

    // Verify the student exists and is a student account
    const student = await db.collection('users').findOne({
      _id: new ObjectId(studentId),
      account_type: 'student',
      $or: [{ status: { $exists: false } }, { status: 'active' }]
    });

    if (!student) {
      return json({ error: 'Student not found or invalid account type' }, { status: 404 });
    }

    // Fetch todos for the student with proper sorting
    const todos = await db.collection('student_todos').find({
      student_id: studentId
    }).sort({
      completed: 1,  // Incomplete todos first
      due_date: 1,   // Then by due date (nulls last in MongoDB)
      created_at: -1 // Then by creation date (newest first)
    }).toArray();

    // Format the data to match frontend expectations
    const formattedTodos = todos.map(todo => ({
      id: todo._id.toString(),
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

    return json({ success: true, data: formattedTodos });

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

    const db = await connectToDatabase();

    // Verify the student exists and is a student account
    const student = await db.collection('users').findOne({
      _id: new ObjectId(studentId),
      account_type: 'student',
      $or: [{ status: { $exists: false } }, { status: 'active' }]
    });

    if (!student) {
      return json({ error: 'Student not found or invalid account type' }, { status: 404 });
    }

    console.log('Received dueDate:', dueDate);
    const processedDate = dueDate ? new Date(dueDate + 'T00:00:00.000Z') : null;
    console.log('Processed dueDate object:', processedDate);
    console.log('Processed dueDate ISO:', processedDate ? processedDate.toISOString() : null);

    // Create the new todo document
    const newTodo = {
      student_id: studentId,
      title: title.trim(),
      description: description ? description.trim() : null,
      category: category || 'personal',
      due_date: processedDate,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
      completed_at: null
    };

    // Insert the new todo
    const result = await db.collection('student_todos').insertOne(newTodo);
    
    // Format the response
    const formattedTodo = {
      id: result.insertedId.toString(),
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

    const db = await connectToDatabase();

    // Verify the todo exists and belongs to the student
    const existingTodo = await db.collection('student_todos').findOne({
      _id: new ObjectId(id),
      student_id: studentId
    });

    if (!existingTodo) {
      return json({ error: 'Todo not found or access denied' }, { status: 404 });
    }

    // Verify the student exists and is active
    const student = await db.collection('users').findOne({
      _id: new ObjectId(studentId),
      account_type: 'student',
      $or: [{ status: { $exists: false } }, { status: 'active' }]
    });

    if (!student) {
      return json({ error: 'Student not found or invalid account type' }, { status: 404 });
    }

    // Build update object
    const updateFields = {
      updated_at: new Date()
    };

    if (title !== undefined) {
      updateFields.title = title.trim();
    }
    if (description !== undefined) {
      updateFields.description = description ? description.trim() : null;
    }
    if (category !== undefined) {
      updateFields.category = category;
    }
    if (dueDate !== undefined) {
      updateFields.due_date = dueDate ? new Date(dueDate + 'T00:00:00.000Z') : null;
    }
    if (completed !== undefined) {
      updateFields.completed = completed;
      if (completed) {
        updateFields.completed_at = new Date();
      } else {
        updateFields.completed_at = null;
      }
    }

    if (Object.keys(updateFields).length === 1) { // Only updated_at
      return json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update the todo
    const result = await db.collection('student_todos').findOneAndUpdate(
      { _id: new ObjectId(id), student_id: studentId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return json({ error: 'Todo not found' }, { status: 404 });
    }

    const updatedTodo = result.value;
    
    // Format the response
    const formattedTodo = {
      id: updatedTodo._id.toString(),
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

    const db = await connectToDatabase();

    // Verify the todo exists and belongs to the student
    const existingTodo = await db.collection('student_todos').findOne({
      _id: new ObjectId(id),
      student_id: studentId
    });

    if (!existingTodo) {
      return json({ error: 'Todo not found or access denied' }, { status: 404 });
    }

    // Verify the student exists and is active
    const student = await db.collection('users').findOne({
      _id: new ObjectId(studentId),
      account_type: 'student',
      $or: [{ status: { $exists: false } }, { status: 'active' }]
    });

    if (!student) {
      return json({ error: 'Student not found or invalid account type' }, { status: 404 });
    }

    // Delete the todo
    const result = await db.collection('student_todos').deleteOne({
      _id: new ObjectId(id),
      student_id: studentId
    });

    if (result.deletedCount === 0) {
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
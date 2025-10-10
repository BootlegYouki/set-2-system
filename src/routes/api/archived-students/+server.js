import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';
import { ObjectId } from 'mongodb';

// GET /api/archived-students - Fetch archived students
export async function GET({ url, request }) {
  try {
    // Authenticate user first
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    if (user.account_type !== 'admin') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const gradeLevel = url.searchParams.get('gradeLevel') || '';
    const gender = url.searchParams.get('gender') || '';
    
    // Connect to MongoDB
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Build MongoDB query for archived students
    const query = {
      account_type: 'student',
      status: 'archived'
    };
    
    // Add search filter
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { account_number: { $regex: search, $options: 'i' } },
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add grade level filter
    if (gradeLevel) {
      query.grade_level = gradeLevel;
    }
    
    // Add gender filter
    if (gender) {
      query.gender = gender;
    }
    
    // Execute query with limit and sort by archived_at descending
    const archivedStudents = await usersCollection
      .find(query)
      .sort({ archived_at: -1 })
      .limit(limit)
      .toArray();
    
    // Format the data to match frontend expectations
    const formattedStudents = archivedStudents.map(student => ({
      id: student._id.toString(),
      name: student.full_name,
      firstName: student.first_name,
      lastName: student.last_name,
      middleInitial: student.middle_initial,
      email: student.email,
      number: student.account_number,
      gradeLevel: student.grade_level,
      birthdate: student.birthdate,
      address: student.address,
      age: student.age,
      guardian: student.guardian,
      contactNumber: student.contact_number,
      gender: student.gender,
      archivedDate: student.archived_at ? new Date(student.archived_at).toLocaleDateString('en-US') : '',
      createdDate: new Date(student.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(student.updated_at).toLocaleDateString('en-US'),
      status: 'archived'
    }));
    
    return json({ students: formattedStudents });
    
  } catch (error) {
    console.error('Error fetching archived students:', error);
    
    // Authentication/Authorization errors
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return json({ error: error.message }, { status: error.message === 'Authentication required' ? 401 : 403 });
    }
    
    // MongoDB connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to fetch archived students' }, { status: 500 });
  }
}

// PUT /api/archived-students - Restore a student from archive
export async function PUT({ request, getClientAddress }) {
  try {
    // Authenticate user first
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    if (user.account_type !== 'admin') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await request.json();
    
    // Validate required fields
    if (!id) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }
    
    // Connect to MongoDB
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Check if student exists and is archived
    const student = await usersCollection.findOne({ 
      _id: new ObjectId(id),
      account_type: 'student'
    });
    
    if (!student) {
      return json({ error: 'Student not found' }, { status: 404 });
    }
    
    if (student.status !== 'archived') {
      return json({ error: 'Student is not archived' }, { status: 400 });
    }
    
    // Restore student by updating status to active and clearing archived_at
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'active',
          updated_at: new Date()
        },
        $unset: { 
          archived_at: ""
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Get updated student data
    const restoredStudent = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    // Log the student restoration activity
    try {
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      // Create activity log with proper structure
      const activityCollection = db.collection('activity_logs');
      await activityCollection.insertOne({
        activity_type: 'student_restored',
        user_id: user?.id ? new ObjectId(user.id) : null,
        user_account_number: user?.account_number || null,
        activity_data: {
          account_type: 'student',
          full_name: restoredStudent.full_name,
          account_number: restoredStudent.account_number
        },
        ip_address: ip_address,
        user_agent: user_agent,
        created_at: new Date()
      });
    } catch (logError) {
      console.error('Error logging student restoration activity:', logError);
      // Don't fail the restoration if logging fails
    }
    
    return json({ 
      success: true, 
      message: `Student ${restoredStudent.full_name} (${restoredStudent.account_number}) has been restored from archive`,
      student: {
        id: restoredStudent._id.toString(),
        name: restoredStudent.full_name,
        number: restoredStudent.account_number
      }
    });
    
  } catch (error) {
    console.error('Error restoring student:', error);
    
    // Authentication/Authorization errors
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return json({ error: error.message }, { status: error.message === 'Authentication required' ? 401 : 403 });
    }
    
    // MongoDB connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to restore student from archive' }, { status: 500 });
  }
}
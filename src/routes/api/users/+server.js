import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';

// GET /api/users - Handle user data requests
export async function GET({ url }) {
  try {
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'teachers':
        // Connect to MongoDB
        const db = await connectToDatabase();
        
        // Fetch all active teachers
        const teachers = await db.collection('users').find({
          account_type: 'teacher',
          $or: [
            { status: { $exists: false } },
            { status: 'active' }
          ]
        }).sort({ first_name: 1, last_name: 1 }).toArray();
        
        // Format the data to match frontend expectations
        const formattedTeachers = teachers.map(teacher => ({
          id: teacher._id,
          accountNumber: teacher.account_number,
          fullName: teacher.full_name,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          middleInitial: teacher.middle_initial,
          email: teacher.email,
          accountType: teacher.account_type,
          createdAt: teacher.created_at,
          updatedAt: teacher.updated_at
        }));
        
        return json({ success: true, data: formattedTeachers });
        
      default:
        return json({ error: 'Invalid action parameter' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error in /api/users:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
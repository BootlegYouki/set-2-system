import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';

// GET /api/dashboard/students-per-grade - Fetch students count per grade level
export async function GET() {
  try {
    // Connect to MongoDB
    const db = await connectToDatabase();
    
    // Aggregate students by grade level
    const studentsPerGrade = await db.collection('users').aggregate([
      {
        $match: {
          account_type: 'student',
          $or: [
            { status: { $exists: false } },
            { status: 'active' }
          ]
        }
      },
      {
        $group: {
          _id: '$grade_level',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          grade_level: '$_id',
          count: 1
        }
      },
      {
        $sort: { grade_level: 1 }
      }
    ]).toArray();
    
    return json({ 
      success: true, 
      data: studentsPerGrade 
    });
    
  } catch (error) {
    console.error('Error fetching students per grade level:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch students per grade level' 
    }, { status: 500 });
  }
}

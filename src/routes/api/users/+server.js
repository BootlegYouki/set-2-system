import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

// GET /api/users - Handle user data requests
export async function GET({ url }) {
  try {
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'teachers':
        // Fetch all active teachers
        const teachersResult = await query(`
          SELECT 
            id,
            account_number,
            full_name,
            first_name,
            last_name,
            middle_initial,
            email,
            account_type,
            created_at,
            updated_at
          FROM users 
          WHERE account_type = 'teacher' 
          AND (status IS NULL OR status = 'active')
          ORDER BY first_name, last_name
        `);
        
        // Format the data to match frontend expectations
        const teachers = teachersResult.rows.map(teacher => ({
          id: teacher.id,
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
        
        return json({ success: true, data: teachers });
        
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
import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

// GET /api/dashboard - Fetch dashboard statistics
export async function GET() {
  try {
    // Get total students count
    const studentsResult = await query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE account_type = 'student' 
      AND (status IS NULL OR status = 'active')
    `);
    
    // Get total teachers count
    const teachersResult = await query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE account_type = 'teacher' 
      AND (status IS NULL OR status = 'active')
    `);
    
    // Get total sections count
    const sectionsResult = await query(`
      SELECT COUNT(*) as count 
      FROM sections 
      WHERE status = 'active'
    `);
    
    // Get total rooms count
    const roomsResult = await query(`
      SELECT COUNT(*) as count 
      FROM rooms
    `);
    
    const statistics = {
      students: parseInt(studentsResult.rows[0].count),
      teachers: parseInt(teachersResult.rows[0].count),
      sections: parseInt(sectionsResult.rows[0].count),
      rooms: parseInt(roomsResult.rows[0].count)
    };
    
    return json({ 
      success: true, 
      data: statistics 
    });
    
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics' 
    }, { status: 500 });
  }
}
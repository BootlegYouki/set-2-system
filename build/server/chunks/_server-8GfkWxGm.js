import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import 'pg';
import 'dotenv';

async function GET() {
  try {
    const studentsResult = await query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE account_type = 'student' 
      AND (status IS NULL OR status = 'active')
    `);
    const teachersResult = await query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE account_type = 'teacher' 
      AND (status IS NULL OR status = 'active')
    `);
    const sectionsResult = await query(`
      SELECT COUNT(*) as count 
      FROM sections 
      WHERE status = 'active'
    `);
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
    console.error("Error fetching dashboard statistics:", error);
    return json({
      success: false,
      error: "Failed to fetch dashboard statistics"
    }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-8GfkWxGm.js.map

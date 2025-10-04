import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import 'pg';
import 'dotenv';

async function GET({ url }) {
  try {
    const action = url.searchParams.get("action");
    switch (action) {
      case "teachers":
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
        const teachers = teachersResult.rows.map((teacher) => ({
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
        return json({ error: "Invalid action parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/users:", error);
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return json({ error: "Database connection failed" }, { status: 503 });
    }
    return json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-l9IC5Sm7.js.map

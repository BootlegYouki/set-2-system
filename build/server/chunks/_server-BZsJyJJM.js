import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import { g as getUserFromRequest, l as logActivityWithUser } from './auth-helper-VQdrszph.js';
import 'pg';
import 'dotenv';

async function GET({ url }) {
  try {
    const limit = url.searchParams.get("limit") || "50";
    const search = url.searchParams.get("search") || "";
    const gradeLevel = url.searchParams.get("gradeLevel") || "";
    const gender = url.searchParams.get("gender") || "";
    let selectQuery = `
      SELECT 
        u.id,
        u.account_number,
        u.full_name,
        u.first_name,
        u.last_name,
        u.middle_initial,
        u.email,
        u.grade_level,
        u.birthdate,
        u.address,
        u.age,
        u.guardian,
        u.contact_number,
        u.gender,
        u.archived_at,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.account_type = 'student' AND u.status = 'archived'
    `;
    const queryParams = [];
    let paramIndex = 1;
    if (search) {
      selectQuery += ` AND (
        u.full_name ILIKE $${paramIndex} OR 
        u.account_number ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    if (gradeLevel) {
      selectQuery += ` AND u.grade_level = $${paramIndex}`;
      queryParams.push(gradeLevel);
      paramIndex++;
    }
    if (gender) {
      selectQuery += ` AND u.gender = $${paramIndex}`;
      queryParams.push(gender);
      paramIndex++;
    }
    selectQuery += ` ORDER BY u.archived_at DESC LIMIT $${paramIndex}`;
    queryParams.push(parseInt(limit));
    const result = await query(selectQuery, queryParams);
    const archivedStudents = result.rows.map((student) => ({
      id: student.id,
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
      archivedDate: student.archived_at ? new Date(student.archived_at).toLocaleDateString("en-US") : "",
      createdDate: new Date(student.created_at).toLocaleDateString("en-US"),
      updatedDate: new Date(student.updated_at).toLocaleDateString("en-US"),
      status: "archived"
    }));
    return json({ students: archivedStudents });
  } catch (error) {
    console.error("Error fetching archived students:", error);
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return json({ error: "Database connection failed" }, { status: 503 });
    }
    if (error.message && error.message.includes("invalid input syntax")) {
      return json({ error: "Invalid limit parameter" }, { status: 400 });
    }
    return json({ error: "Failed to fetch archived students" }, { status: 500 });
  }
}
async function PUT({ request, getClientAddress }) {
  try {
    const { id } = await request.json();
    if (!id) {
      return json({ error: "Student ID is required" }, { status: 400 });
    }
    const checkQuery = `SELECT id, account_type, status FROM users WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      return json({ error: "Student not found" }, { status: 404 });
    }
    const student = checkResult.rows[0];
    if (student.account_type !== "student") {
      return json({ error: "Only students can be restored from archive" }, { status: 400 });
    }
    if (student.status !== "archived") {
      return json({ error: "Student is not archived" }, { status: 400 });
    }
    const updateQuery = `
      UPDATE users 
      SET 
        status = 'active',
        archived_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, full_name, account_number
    `;
    const result = await query(updateQuery, [id]);
    const restoredStudent = result.rows[0];
    try {
      const user = await getUserFromRequest(request);
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await logActivityWithUser(
        "account_restored",
        user,
        {
          account_type: "student",
          full_name: restoredStudent.full_name
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error("Error logging student restoration activity:", logError);
    }
    return json({
      success: true,
      message: `Student ${restoredStudent.full_name} (${restoredStudent.account_number}) has been restored from archive`,
      student: {
        id: restoredStudent.id,
        name: restoredStudent.full_name,
        number: restoredStudent.account_number
      }
    });
  } catch (error) {
    console.error("Error restoring student:", error);
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return json({ error: "Database connection failed" }, { status: 503 });
    }
    return json({ error: "Failed to restore student from archive" }, { status: 500 });
  }
}

export { GET, PUT };
//# sourceMappingURL=_server-BZsJyJJM.js.map

import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-C-gxO138.js';
import 'mongodb';
import 'dotenv';

async function GET({ url }) {
  try {
    const action = url.searchParams.get("action");
    switch (action) {
      case "teachers":
        const db = await connectToDatabase();
        const teachers = await db.collection("users").find({
          account_type: "teacher",
          $or: [
            { status: { $exists: false } },
            { status: "active" }
          ]
        }).sort({ first_name: 1, last_name: 1 }).toArray();
        const formattedTeachers = teachers.map((teacher) => ({
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
//# sourceMappingURL=_server-DEqWHbFq.js.map

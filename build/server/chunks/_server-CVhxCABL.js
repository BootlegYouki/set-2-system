import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-C-gxO138.js';
import 'mongodb';
import 'dotenv';

async function GET() {
  try {
    const db = await connectToDatabase();
    const studentsPerGrade = await db.collection("users").aggregate([
      {
        $match: {
          account_type: "student",
          $or: [
            { status: { $exists: false } },
            { status: "active" }
          ]
        }
      },
      {
        $group: {
          _id: "$grade_level",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          grade_level: "$_id",
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
    console.error("Error fetching students per grade level:", error);
    return json({
      success: false,
      error: "Failed to fetch students per grade level"
    }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-CVhxCABL.js.map

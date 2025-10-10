import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-9uwR-1fD.js';
import { g as getUserFromRequest, l as logActivityWithUser } from './auth-helper-Ct8jEaTQ.js';
import { ObjectId } from 'mongodb';
import 'dotenv';

async function GET({ url, request }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.account_type !== "admin") {
      return json({ error: "Admin access required" }, { status: 403 });
    }
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    const gradeLevel = url.searchParams.get("gradeLevel") || "";
    const gender = url.searchParams.get("gender") || "";
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");
    const query = {
      account_type: "student",
      status: "archived"
    };
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { account_number: { $regex: search, $options: "i" } },
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } }
      ];
    }
    if (gradeLevel) {
      query.grade_level = gradeLevel;
    }
    if (gender) {
      query.gender = gender;
    }
    const archivedStudents = await usersCollection.find(query).sort({ archived_at: -1 }).limit(limit).toArray();
    const formattedStudents = archivedStudents.map((student) => ({
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
      archivedDate: student.archived_at ? new Date(student.archived_at).toLocaleDateString("en-US") : "",
      createdDate: new Date(student.created_at).toLocaleDateString("en-US"),
      updatedDate: new Date(student.updated_at).toLocaleDateString("en-US"),
      status: "archived"
    }));
    return json({ students: formattedStudents });
  } catch (error) {
    console.error("Error fetching archived students:", error);
    if (error.message === "Authentication required" || error.message === "Admin access required") {
      return json({ error: error.message }, { status: error.message === "Authentication required" ? 401 : 403 });
    }
    if (error.name === "MongoNetworkError" || error.name === "MongoServerError") {
      return json({ error: "Database connection failed" }, { status: 503 });
    }
    return json({ error: "Failed to fetch archived students" }, { status: 500 });
  }
}
async function PUT({ request, getClientAddress }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.account_type !== "admin") {
      return json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await request.json();
    if (!id) {
      return json({ error: "Student ID is required" }, { status: 400 });
    }
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");
    const student = await usersCollection.findOne({
      _id: new ObjectId(id),
      account_type: "student"
    });
    if (!student) {
      return json({ error: "Student not found" }, { status: 404 });
    }
    if (student.status !== "archived") {
      return json({ error: "Student is not archived" }, { status: 400 });
    }
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "active",
          updated_at: /* @__PURE__ */ new Date()
        },
        $unset: {
          archived_at: ""
        }
      }
    );
    if (updateResult.matchedCount === 0) {
      return json({ error: "Student not found" }, { status: 404 });
    }
    const restoredStudent = await usersCollection.findOne({ _id: new ObjectId(id) });
    try {
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
        id: restoredStudent._id.toString(),
        name: restoredStudent.full_name,
        number: restoredStudent.account_number
      }
    });
  } catch (error) {
    console.error("Error restoring student:", error);
    if (error.message === "Authentication required" || error.message === "Admin access required") {
      return json({ error: error.message }, { status: error.message === "Authentication required" ? 401 : 403 });
    }
    if (error.name === "MongoNetworkError" || error.name === "MongoServerError") {
      return json({ error: "Database connection failed" }, { status: 503 });
    }
    return json({ error: "Failed to restore student from archive" }, { status: 500 });
  }
}

export { GET, PUT };
//# sourceMappingURL=_server-DUgOikLU.js.map

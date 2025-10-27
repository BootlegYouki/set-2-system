import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-C-gxO138.js';
import 'mongodb';
import 'dotenv';

async function GET({ url }) {
  try {
    const db = await connectToDatabase();
    const schoolYearSetting = await db.collection("admin_settings").findOne({
      setting_key: "current_school_year"
    });
    const school_year = url.searchParams.get("school_year") || schoolYearSetting?.setting_value || "2025-2026";
    const quarter = parseInt(url.searchParams.get("quarter")) || 1;
    const activeStudents = await db.collection("users").find({
      account_type: "student",
      status: "active"
    }).toArray();
    if (activeStudents.length === 0) {
      return json({
        success: true,
        students: [],
        message: "No active students found"
      });
    }
    const studentIds = activeStudents.map((student) => student._id);
    const sectionEnrollments = await db.collection("section_students").find({
      student_id: { $in: studentIds },
      status: "active"
    }).toArray();
    const studentSectionMap = {};
    sectionEnrollments.forEach((enrollment) => {
      studentSectionMap[enrollment.student_id.toString()] = enrollment.section_id;
    });
    const sectionIds = [...new Set(Object.values(studentSectionMap))];
    const sections = await db.collection("sections").find({
      _id: { $in: sectionIds },
      status: "active"
    }).toArray();
    const sectionMap = {};
    sections.forEach((section) => {
      sectionMap[section._id.toString()] = section;
    });
    const gradesData = await db.collection("grades").find({
      student_id: { $in: studentIds },
      school_year,
      quarter,
      $or: [
        { verified: true },
        { "verification.verified": true }
      ]
    }).toArray();
    const studentGradesMap = {};
    gradesData.forEach((grade) => {
      const studentId = grade.student_id.toString();
      if (!studentGradesMap[studentId]) {
        studentGradesMap[studentId] = [];
      }
      studentGradesMap[studentId].push(grade);
    });
    const studentsWithGrades = activeStudents.map((student) => {
      const studentId = student._id.toString();
      const sectionId = studentSectionMap[studentId];
      const section = sectionId && sectionMap[sectionId.toString()];
      const studentGrades = studentGradesMap[studentId] || [];
      let gwa = 0;
      if (studentGrades.length > 0) {
        const validGrades = studentGrades.filter(
          (grade) => grade.averages && grade.averages.final_grade && grade.averages.final_grade > 0
        );
        if (validGrades.length > 0) {
          const totalGrades = validGrades.reduce(
            (sum, grade) => sum + grade.averages.final_grade,
            0
          );
          gwa = totalGrades / validGrades.length;
        }
      }
      const formattedGwa = Math.round(gwa * 10) / 10;
      const gwaDisplay = formattedGwa === Math.floor(formattedGwa) ? Math.floor(formattedGwa) : Number(formattedGwa.toFixed(1));
      return {
        id: student.account_number,
        _id: student._id.toString(),
        name: student.full_name,
        email: student.email,
        gradeLevel: section ? section.grade_level.toString() : student.grade_level?.toString() || "N/A",
        section: section ? section.name : "No Section",
        gwa: gwaDisplay,
        totalSubjects: studentGrades.length,
        verifiedGrades: studentGrades.filter(
          (grade) => grade.verified === true || grade.verification?.verified === true
        ).length
      };
    }).sort((a, b) => {
      const extractNumber = (id) => {
        const match = id.match(/-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      };
      const numA = extractNumber(a.id);
      const numB = extractNumber(b.id);
      return numA - numB;
    });
    return json({
      success: true,
      students: studentsWithGrades,
      metadata: {
        totalStudents: studentsWithGrades.length,
        schoolYear: school_year,
        quarter,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching students bulk data:", error);
    return json({
      success: false,
      error: "Failed to fetch students data",
      students: []
    }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-Ce92v-pC.js.map

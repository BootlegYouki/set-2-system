import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-C-gxO138.js';
import { ObjectId } from 'mongodb';
import { f as formatTeacherName, a as createGradeVerificationNotification, b as createBulkGradeVerificationNotifications } from './notification-helper-3WedpjE4.js';
import 'dotenv';

async function getCurrentSchoolYear(db) {
  try {
    const schoolYearSetting = await db.collection("admin_settings").findOne({
      setting_key: "current_school_year"
    });
    return schoolYearSetting?.setting_value || "2025-2026";
  } catch (error) {
    console.error("Error fetching current school year:", error);
    return "2025-2026";
  }
}
async function GET({ request, url }) {
  try {
    const db = await connectToDatabase();
    const teacherId = url.searchParams.get("teacher_id");
    const schoolYear = url.searchParams.get("school_year") || await getCurrentSchoolYear(db);
    const quarter = parseInt(url.searchParams.get("quarter")) || 1;
    console.log("Teacher Advisory API - Parameters:", { teacherId, schoolYear, quarter });
    if (!teacherId) {
      return json({ error: "Teacher ID is required" }, { status: 400 });
    }
    if (!ObjectId.isValid(teacherId)) {
      console.error("Invalid teacher ID format:", teacherId);
      return json({ error: "Invalid teacher ID format" }, { status: 400 });
    }
    const section = await db.collection("sections").findOne({
      adviser_id: new ObjectId(teacherId),
      status: "active"
    });
    console.log("Found section:", section);
    if (!section) {
      return json({
        success: true,
        data: {
          advisoryData: null,
          students: [],
          message: "No advisory section assigned"
        }
      });
    }
    console.log("Getting section students for section:", section._id);
    const sectionStudents = await db.collection("section_students").find({
      section_id: section._id,
      status: "active"
    }).toArray();
    console.log("Found section students:", sectionStudents.length);
    const studentIds = sectionStudents.map((ss) => ss.student_id);
    console.log("Getting student details for IDs:", studentIds);
    const students = await db.collection("users").find({
      _id: { $in: studentIds },
      account_type: "student",
      status: "active"
    }).sort({ full_name: 1 }).toArray();
    console.log("Found students:", students.length);
    console.log("Getting grades for students in section:", section._id);
    const gradesData = await db.collection("grades").find({
      student_id: { $in: studentIds },
      section_id: section._id,
      school_year: schoolYear,
      quarter,
      submitted_to_adviser: true
      // Only get grades that have been submitted to adviser
    }).toArray();
    console.log("Found grades:", gradesData.length);
    console.log("Getting schedules for section:", section._id);
    const schedules = await db.collection("schedules").find({
      section_id: section._id,
      school_year: section.school_year
      // Use section's school year for schedules
    }).toArray();
    console.log("Found schedules:", schedules.length);
    const subjectIds = [...new Set(schedules.map((s) => s.subject_id))];
    console.log("Getting subjects for IDs:", subjectIds);
    const subjects = await db.collection("subjects").find({
      _id: { $in: subjectIds }
    }).toArray();
    const teacherIds = [...new Set(schedules.map((s) => s.teacher_id))];
    const teachers = await db.collection("users").find({
      _id: { $in: teacherIds },
      account_type: "teacher"
    }).toArray();
    const subjectTeacherMap = {};
    schedules.forEach((schedule) => {
      const teacher2 = teachers.find((t) => t._id.toString() === schedule.teacher_id.toString());
      if (teacher2) {
        subjectTeacherMap[schedule.subject_id.toString()] = teacher2.full_name;
      }
    });
    console.log("Found subjects:", subjects.length);
    console.log("Subject-teacher mapping:", subjectTeacherMap);
    console.log("Processing students with grades...");
    const studentsWithGrades = students.map((student) => {
      console.log("Processing student:", student.full_name);
      const studentGrades = gradesData.filter(
        (g) => g.student_id.toString() === student._id.toString()
      );
      console.log("Student grades found:", studentGrades.length);
      const subjectGrades = subjects.map((subject) => {
        const subjectGrade = studentGrades.find(
          (g) => g.subject_id.toString() === subject._id.toString()
        );
        console.log(`Subject ${subject.name}: grade found =`, !!subjectGrade);
        const isSubmittedToAdviser = subjectGrade?.submitted_to_adviser || false;
        console.log(`Subject ${subject.name}: submitted to adviser =`, isSubmittedToAdviser);
        return {
          subject_id: subject._id,
          subject_name: subject.name,
          subject_code: subject.code,
          teacher_name: subjectTeacherMap[subject._id.toString()] || "Unknown Teacher",
          averages: isSubmittedToAdviser ? subjectGrade?.averages || {
            written_work: 0,
            performance_tasks: 0,
            quarterly_assessment: 0,
            final_grade: 0
          } : {
            written_work: null,
            performance_tasks: null,
            quarterly_assessment: null,
            final_grade: null
          },
          verified: subjectGrade?.verified || false,
          verified_at: subjectGrade?.verified_at || null,
          submitted_to_adviser: isSubmittedToAdviser,
          submitted_at: subjectGrade?.submitted_at || null,
          submitted_by: subjectGrade?.submitted_by || null,
          grade_counts: isSubmittedToAdviser ? {
            written_work: subjectGrade?.written_work?.length || 0,
            performance_tasks: subjectGrade?.performance_tasks?.length || 0,
            quarterly_assessment: subjectGrade?.quarterly_assessment?.length || 0
          } : {
            written_work: 0,
            performance_tasks: 0,
            quarterly_assessment: 0
          }
        };
      });
      console.log("Subject grades processed:", subjectGrades.length);
      const validFinalGrades = subjectGrades.map((sg) => sg.averages.final_grade).filter((grade) => grade !== null && grade > 0);
      const overallAverage = validFinalGrades.length > 0 ? Math.round(validFinalGrades.reduce((sum, grade) => sum + grade, 0) / validFinalGrades.length * 100) / 100 : null;
      const allGradesVerified = subjectGrades.length > 0 && subjectGrades.every((sg) => sg.verified);
      return {
        id: student._id,
        name: student.full_name,
        student_number: student.account_number,
        grade_level: student.grade_level,
        subjects: subjectGrades,
        overall_average: overallAverage,
        grades_verified: allGradesVerified,
        total_subjects: subjects.length
      };
    });
    const validAverages = studentsWithGrades.map((s) => s.overall_average).filter((avg) => avg !== null && avg > 0);
    const classAverage = validAverages.length > 0 ? Math.round(validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length * 100) / 100 : null;
    const room = section.room_id ? await db.collection("rooms").findOne({
      _id: section.room_id
    }) : null;
    const teacher = await db.collection("users").findOne({
      _id: new ObjectId(teacherId),
      account_type: "teacher"
    });
    const advisoryData = {
      section_id: section._id,
      sectionName: section.name,
      gradeLevel: section.grade_level,
      schoolYear: section.school_year,
      roomName: room ? room.name : "No room assigned",
      building: room?.building || "",
      floor: room?.floor || "",
      totalStudents: students.length,
      averageGrade: classAverage,
      subjectsCount: subjects.length,
      quarter,
      teacherName: teacher ? teacher.full_name : "Unknown Teacher",
      submittedDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
    };
    return json({
      success: true,
      data: {
        advisoryData,
        students: studentsWithGrades
      }
    });
  } catch (error) {
    console.error("Error in teacher-advisory GET:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    return json({
      success: false,
      error: "Internal server error",
      details: error.message
    }, { status: 500 });
  }
}
async function POST({ request }) {
  try {
    const db = await connectToDatabase();
    const body = await request.json();
    const { action } = body;
    if (action === "verify_student_grades") {
      const {
        student_id,
        section_id,
        teacher_id,
        quarter = 1,
        verified = true
      } = body;
      const school_year = body.school_year || await getCurrentSchoolYear(db);
      if (!student_id || !section_id || !teacher_id) {
        return json({ error: "Missing required fields" }, { status: 400 });
      }
      const teacher = await db.collection("users").findOne({
        _id: new ObjectId(teacher_id)
      }, { projection: { full_name: 1, gender: 1 } });
      const teacherName = teacher ? formatTeacherName(teacher.full_name, teacher.gender) : "Your teacher";
      const result = await db.collection("grades").updateMany(
        {
          student_id: new ObjectId(student_id),
          section_id: new ObjectId(section_id),
          school_year,
          quarter
        },
        {
          $set: {
            verified,
            verified_at: verified ? /* @__PURE__ */ new Date() : null,
            verified_by: verified ? new ObjectId(teacher_id) : null,
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      if (verified && result.modifiedCount > 0) {
        const verifiedGrades = await db.collection("grades").find({
          student_id: new ObjectId(student_id),
          section_id: new ObjectId(section_id),
          school_year,
          quarter,
          verified: true
        }).toArray();
        const subjectIds = verifiedGrades.map((grade) => grade.subject_id);
        const subjects = await db.collection("subjects").find({
          _id: { $in: subjectIds }
        }).toArray();
        for (const subject of subjects) {
          await createGradeVerificationNotification(
            db,
            student_id,
            teacherName,
            subject.name
          );
        }
      }
      return json({
        success: true,
        message: verified ? "Student grades verified successfully" : "Student grades unverified successfully",
        modified_count: result.modifiedCount
      });
    }
    if (action === "verify_all_grades") {
      const {
        section_id,
        teacher_id,
        quarter = 1,
        verified = true
      } = body;
      const school_year = body.school_year || await getCurrentSchoolYear(db);
      if (!section_id || !teacher_id) {
        return json({ error: "Missing required fields" }, { status: 400 });
      }
      const teacher = await db.collection("users").findOne({
        _id: new ObjectId(teacher_id)
      }, { projection: { full_name: 1, gender: 1 } });
      const teacherName = teacher ? formatTeacherName(teacher.full_name, teacher.gender) : "Your teacher";
      const studentsInSection = await db.collection("grades").distinct("student_id", {
        section_id: new ObjectId(section_id),
        school_year,
        quarter
      });
      const result = await db.collection("grades").updateMany(
        {
          section_id: new ObjectId(section_id),
          school_year,
          quarter
        },
        {
          $set: {
            verified,
            verified_at: verified ? /* @__PURE__ */ new Date() : null,
            verified_by: verified ? new ObjectId(teacher_id) : null,
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      if (verified && result.modifiedCount > 0 && studentsInSection.length > 0) {
        const verifiedGrades = await db.collection("grades").find({
          section_id: new ObjectId(section_id),
          school_year,
          quarter,
          verified: true
        }).toArray();
        const uniqueSubjectIds = [...new Set(verifiedGrades.map((grade) => grade.subject_id.toString()))];
        const subjects = await db.collection("subjects").find({
          _id: { $in: uniqueSubjectIds.map((id) => new ObjectId(id)) }
        }).toArray();
        for (const subject of subjects) {
          await createBulkGradeVerificationNotifications(
            db,
            studentsInSection.map((id) => id.toString()),
            teacherName,
            subject.name
          );
        }
      }
      return json({
        success: true,
        message: verified ? "All grades verified successfully" : "All grades unverified successfully",
        modified_count: result.modifiedCount
      });
    }
    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in teacher-advisory POST:", error);
    return json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}

export { GET, POST };
//# sourceMappingURL=_server-Cn0v0hjx.js.map

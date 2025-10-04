import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import 'pg';
import 'dotenv';

async function GET({ url }) {
  try {
    const sectionId = url.searchParams.get("sectionId");
    const teacherId = url.searchParams.get("teacherId");
    const schoolYear = url.searchParams.get("schoolYear") || "2024-2025";
    if (!sectionId) {
      return json({
        success: false,
        error: "Section ID is required"
      }, { status: 400 });
    }
    if (teacherId) {
      const accessCheck = await query(`
                SELECT COUNT(*) as count
                FROM schedules sch
                JOIN sections s ON sch.section_id = s.id
                WHERE sch.teacher_id = $1 
                    AND s.id = $2 
                    AND s.school_year = $3
                    AND s.status = 'active'
            `, [parseInt(teacherId), parseInt(sectionId), schoolYear]);
      if (accessCheck.rows[0].count === "0") {
        return json({
          success: false,
          error: "Access denied to this section"
        }, { status: 403 });
      }
    }
    const sectionQuery = `
            SELECT 
                s.id,
                s.name as section_name,
                s.grade_level,
                s.school_year,
                u.first_name as adviser_first_name,
                u.last_name as adviser_last_name,
                r.name as room_name
            FROM sections s
            LEFT JOIN users u ON s.adviser_id = u.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE s.id = $1
        `;
    const sectionResult = await query(sectionQuery, [parseInt(sectionId)]);
    if (sectionResult.rows.length === 0) {
      return json({
        success: false,
        error: "Section not found"
      }, { status: 404 });
    }
    const sectionInfo = sectionResult.rows[0];
    const studentsQuery = `
            SELECT 
                u.id,
                u.account_number,
                u.first_name,
                u.last_name,
                u.full_name,
                u.email,
                u.grade_level,
                ss.enrolled_at,
                ss.status as enrollment_status
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            WHERE ss.section_id = $1 
                AND ss.status = 'active'
            ORDER BY u.last_name, u.first_name
        `;
    const studentsResult = await query(studentsQuery, [parseInt(sectionId)]);
    let subjectsQuery = `
            SELECT DISTINCT 
                sub.id,
                sub.name,
                sub.code
            FROM schedules sch
            JOIN subjects sub ON sch.subject_id = sub.id
            WHERE sch.section_id = $1
        `;
    const queryParams = [parseInt(sectionId)];
    if (teacherId) {
      subjectsQuery += " AND sch.teacher_id = $2";
      queryParams.push(parseInt(teacherId));
    }
    subjectsQuery += " ORDER BY sub.name";
    const subjectsResult = await query(subjectsQuery, queryParams);
    const studentsWithGrades = [];
    for (const student of studentsResult.rows) {
      const gradesQuery = `
                SELECT 
                    sg.score,
                    gi.name as item_name,
                    gc.code as category_code,
                    gi.total_score
                FROM student_grades sg
                JOIN grade_items gi ON sg.grade_item_id = gi.id
                JOIN grade_categories gc ON gi.category_id = gc.id
                WHERE sg.student_id = $1
                    AND gi.section_id = $2
                ORDER BY gc.code, gi.id
            `;
      const gradesResult = await query(gradesQuery, [student.id, parseInt(sectionId)]);
      const writtenWork = [];
      const performanceTasks = [];
      const quarterlyAssessment = [];
      gradesResult.rows.forEach((grade) => {
        if (grade.category_code === "WW") {
          writtenWork.push(grade.score || 0);
        } else if (grade.category_code === "PT") {
          performanceTasks.push(grade.score || 0);
        } else if (grade.category_code === "QA") {
          quarterlyAssessment.push(grade.score || 0);
        }
      });
      while (writtenWork.length < 3) writtenWork.push(0);
      while (performanceTasks.length < 2) performanceTasks.push(0);
      while (quarterlyAssessment.length < 1) quarterlyAssessment.push(0);
      studentsWithGrades.push({
        id: student.account_number || student.id.toString(),
        name: student.full_name,
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        enrollmentStatus: student.enrollment_status,
        enrolledAt: student.enrolled_at,
        writtenWork,
        performanceTasks,
        quarterlyAssessment
      });
    }
    return json({
      success: true,
      data: {
        section: {
          id: sectionInfo.id,
          name: sectionInfo.section_name,
          gradeLevel: sectionInfo.grade_level,
          schoolYear: sectionInfo.school_year,
          adviser: sectionInfo.adviser_first_name && sectionInfo.adviser_last_name ? `${sectionInfo.adviser_first_name} ${sectionInfo.adviser_last_name}` : null,
          room: sectionInfo.room_name
        },
        subjects: subjectsResult.rows,
        students: studentsWithGrades,
        totalStudents: studentsWithGrades.length
      }
    });
  } catch (error) {
    console.error("Error fetching class students:", error);
    return json({
      success: false,
      error: "Failed to fetch class students"
    }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-BmGQi5_f.js.map

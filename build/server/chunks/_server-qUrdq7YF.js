import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import 'pg';
import 'dotenv';

async function GET({ url }) {
  try {
    const teacherId = url.searchParams.get("teacherId");
    const schoolYear = url.searchParams.get("schoolYear") || "2024-2025";
    if (!teacherId) {
      return json({
        success: false,
        error: "Teacher ID is required"
      }, { status: 400 });
    }
    const sectionsQuery = `
            SELECT DISTINCT 
                s.id as section_id,
                s.name as section_name,
                s.grade_level,
                s.school_year,
                COUNT(DISTINCT ss.student_id) as student_count,
                COUNT(DISTINCT sch.subject_id) as subject_count,
                ARRAY_AGG(DISTINCT sub.name) FILTER (WHERE sub.name IS NOT NULL) as subjects
            FROM schedules sch
            JOIN sections s ON sch.section_id = s.id
            LEFT JOIN section_students ss ON s.id = ss.section_id AND ss.status = 'active'
            LEFT JOIN subjects sub ON sch.subject_id = sub.id
            WHERE sch.teacher_id = $1 
                AND s.school_year = $2
                AND s.status = 'active'
            GROUP BY s.id, s.name, s.grade_level, s.school_year
            ORDER BY s.grade_level, s.name
        `;
    const result = await query(sectionsQuery, [parseInt(teacherId), schoolYear]);
    const sectionsByGrade = {};
    let totalSections = 0;
    let totalStudents = 0;
    result.rows.forEach((row) => {
      const gradeLevel = row.grade_level;
      if (!sectionsByGrade[gradeLevel]) {
        sectionsByGrade[gradeLevel] = {
          yearLevel: gradeLevel,
          gradeName: `Grade ${gradeLevel}`,
          sections: []
        };
      }
      sectionsByGrade[gradeLevel].sections.push({
        id: row.section_id,
        name: row.section_name,
        students: parseInt(row.student_count) || 0,
        subjects: row.subjects || [],
        subjectCount: parseInt(row.subject_count) || 0
      });
      totalSections++;
      totalStudents += parseInt(row.student_count) || 0;
    });
    const classData = Object.values(sectionsByGrade);
    const yearLevels = Object.keys(sectionsByGrade).map((level) => parseInt(level));
    const stats = {
      yearLevels,
      totalSections,
      totalStudents,
      averagePerSection: totalSections > 0 ? Math.round(totalStudents / totalSections) : 0
    };
    return json({
      success: true,
      data: {
        classData,
        stats
      }
    });
  } catch (error) {
    console.error("Error fetching teacher sections:", error);
    return json({
      success: false,
      error: "Failed to fetch teacher sections"
    }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-qUrdq7YF.js.map

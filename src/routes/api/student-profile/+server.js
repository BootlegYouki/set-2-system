import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

// GET /api/student-profile - Get comprehensive student profile data
export async function GET({ url }) {
  try {
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student's section information
    const sectionQuery = `
      SELECT 
        ss.student_id,
        s.id as section_id,
        s.name as section_name,
        s.grade_level,
        u.full_name as adviser_name
      FROM section_students ss
      JOIN sections s ON ss.section_id = s.id
      LEFT JOIN users u ON s.adviser_id = u.id
      WHERE ss.student_id = $1 AND ss.status = 'active'
      LIMIT 1
    `;
    
    const sectionResult = await query(sectionQuery, [studentId]);
    const sectionInfo = sectionResult.rows[0] || null;

    // Get student's enrolled subjects with teacher information
    let subjects = [];
    if (sectionInfo) {
      const subjectsQuery = `
        SELECT DISTINCT
          s.id,
          s.name,
          s.code,
          s.grade_level,
          d.name as department_name,
          u.full_name as teacher_name
        FROM subjects s
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN schedules sch ON s.id = sch.subject_id AND sch.section_id = $2
        LEFT JOIN users u ON sch.teacher_id = u.id AND u.account_type = 'teacher'
        WHERE s.grade_level = $1
        ORDER BY s.name
      `;
      
      const subjectsResult = await query(subjectsQuery, [sectionInfo.grade_level, sectionInfo.section_id]);
      subjects = subjectsResult.rows.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        department: subject.department_name || 'General',
        teacher: subject.teacher_name || 'No teacher',
        color: getSubjectColor(subject.name) // Helper function for UI colors
      }));
    }

    // Calculate student's general average from final grades
    let generalAverage = null;
    let totalSubjectsWithGrades = 0;
    
    if (sectionInfo) {
      const gradesQuery = `
        SELECT 
          AVG(fg.final_grade) as average_grade,
          COUNT(fg.final_grade) as subjects_with_grades
        FROM final_grades fg
        JOIN subjects s ON fg.subject_id = s.id
        WHERE fg.student_id = $1 
        AND s.grade_level = $2
        AND fg.final_grade IS NOT NULL
        AND fg.verified = true
      `;
      
      const gradesResult = await query(gradesQuery, [studentId, sectionInfo.grade_level]);
      if (gradesResult.rows[0] && gradesResult.rows[0].average_grade) {
        generalAverage = Math.round(parseFloat(gradesResult.rows[0].average_grade) * 100) / 100;
        totalSubjectsWithGrades = parseInt(gradesResult.rows[0].subjects_with_grades);
      }
    }

    // Calculate class rank
    let classRank = null;
    let totalStudentsInSection = 0;
    
    if (sectionInfo && generalAverage !== null) {
      // Get all students in the same section with their averages
      const rankQuery = `
        WITH student_averages AS (
          SELECT 
            ss.student_id,
            AVG(fg.final_grade) as average_grade
          FROM section_students ss
          JOIN final_grades fg ON ss.student_id = fg.student_id
          JOIN subjects s ON fg.subject_id = s.id
          WHERE ss.section_id = $1 
          AND ss.status = 'active'
          AND s.grade_level = $2
          AND fg.final_grade IS NOT NULL
          AND fg.verified = true
          GROUP BY ss.student_id
          HAVING COUNT(fg.final_grade) > 0
        ),
        ranked_students AS (
          SELECT 
            student_id,
            average_grade,
            RANK() OVER (ORDER BY average_grade DESC) as rank
          FROM student_averages
        )
        SELECT 
          rank,
          (SELECT COUNT(*) FROM student_averages) as total_students
        FROM ranked_students 
        WHERE student_id = $3
      `;
      
      const rankResult = await query(rankQuery, [sectionInfo.section_id, sectionInfo.grade_level, studentId]);
      if (rankResult.rows[0]) {
        classRank = parseInt(rankResult.rows[0].rank);
        totalStudentsInSection = parseInt(rankResult.rows[0].total_students);
      }
    }

    // Get total students in section (including those without grades)
    if (sectionInfo && totalStudentsInSection === 0) {
      const totalStudentsQuery = `
        SELECT COUNT(*) as total
        FROM section_students ss
        WHERE ss.section_id = $1 AND ss.status = 'active'
      `;
      
      const totalResult = await query(totalStudentsQuery, [sectionInfo.section_id]);
      totalStudentsInSection = parseInt(totalResult.rows[0]?.total || 0);
    }

    // Format response
    const profileData = {
      section: sectionInfo ? {
        id: sectionInfo.section_id,
        name: sectionInfo.section_name,
        gradeLevel: sectionInfo.grade_level,
        adviser: sectionInfo.adviser_name || 'Not assigned'
      } : null,
      subjects: subjects,
      academicSummary: {
        generalAverage: generalAverage,
        classRank: classRank,
        totalStudentsInSection: totalStudentsInSection,
        totalSubjectsEnrolled: subjects.length,
        totalSubjectsWithGrades: totalSubjectsWithGrades
      }
    };

    return json({ 
      success: true, 
      data: profileData 
    });

  } catch (error) {
    console.error('Error fetching student profile data:', error);
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return json({ error: 'Database connection failed' }, { status: 503 });
    }
    
    return json({ error: 'Failed to fetch student profile data' }, { status: 500 });
  }
}

// Helper function to assign colors to subjects for UI
function getSubjectColor(subjectName) {
  const colors = {
    'Math': '#4F46E5',
    'Science': '#059669', 
    'English': '#DC2626',
    'Physical Education': '#EA580C',
    'Filipino': '#7C2D12',
    'History': '#B45309',
    'Computer': '#6366F1',
    'Arts': '#C026D3'
  };
  
  // Find matching color based on subject name
  for (const [key, color] of Object.entries(colors)) {
    if (subjectName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  
  // Default color if no match found
  return '#6B7280';
}
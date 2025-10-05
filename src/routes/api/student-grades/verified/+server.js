import { json } from '@sveltejs/kit';
import { query } from '../../../../database/db.js';
import { verifyAuth } from '../../helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const studentId = url.searchParams.get('student_id');
    const gradingPeriodId = url.searchParams.get('grading_period_id') || 1; // Default to 1st quarter

    if (!studentId) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student's section information
    const sectionQuery = `
      SELECT 
        s.id as section_id,
        s.name as section_name,
        s.grade_level,
        ss.status
      FROM sections s
      JOIN section_students ss ON s.id = ss.section_id
      WHERE ss.student_id = $1 
      AND ss.status = 'active'
      AND s.status = 'active'
      LIMIT 1
    `;
    
    const sectionResult = await query(sectionQuery, [studentId]);
    
    if (sectionResult.rows.length === 0) {
      return json({ error: 'Student section not found' }, { status: 404 });
    }

    const studentSection = sectionResult.rows[0];

    // Get all subjects for the student's grade level, with optional teacher assignments from schedules
    const subjectsQuery = `
      SELECT DISTINCT
        sub.id,
        sub.name as subject_name,
        sub.code as subject_code,
        COALESCE(u.full_name, 'No teacher') as teacher_name,
        fg.final_grade,
        fg.letter_grade,
        fg.verified,
        fg.computed_at
      FROM subjects sub
      LEFT JOIN schedules sch ON (
        sub.id = sch.subject_id 
        AND sch.section_id = $2
      )
      LEFT JOIN users u ON sch.teacher_id = u.id AND u.status = 'active'
      LEFT JOIN final_grades fg ON (
        fg.student_id = $1 
        AND fg.subject_id = sub.id 
        AND fg.section_id = $2
        AND fg.grading_period_id = $3
        AND fg.verified = true
      )
      WHERE sub.grade_level = $4
      ORDER BY sub.name
    `;

    const subjectsResult = await query(subjectsQuery, [studentId, studentSection.section_id, gradingPeriodId, studentSection.grade_level]);

    // Transform the data to match the frontend format
    const subjects = subjectsResult.rows.map(row => ({
      id: row.id,
      name: row.subject_name,
      teacher: row.teacher_name,
      credits: 3, // Default credits - could be added to subjects table
      numericGrade: row.final_grade ? parseFloat(row.final_grade) : 0,
      letterGrade: row.letter_grade || null,
      verified: row.verified || false,
      computedAt: row.computed_at
    }));

    // Calculate overall average from verified grades only
    const verifiedGrades = subjects.filter(subject => subject.verified && subject.numericGrade > 0);
    let overallAverage = 0;
    
    if (verifiedGrades.length > 0) {
      const totalPoints = verifiedGrades.reduce((sum, subject) => sum + subject.numericGrade, 0);
      overallAverage = totalPoints / verifiedGrades.length;
    }

    // Get grading period information
    const gradingPeriodQuery = `
      SELECT name, school_year, start_date, end_date
      FROM grading_periods
      WHERE id = $1
    `;
    
    const gradingPeriodResult = await query(gradingPeriodQuery, [gradingPeriodId]);
    const gradingPeriod = gradingPeriodResult.rows[0] || { name: '1st Quarter' };

    return json({
      success: true,
      data: {
        student: {
          id: studentId,
          section: studentSection.section_name,
          gradeLevel: studentSection.grade_level
        },
        gradingPeriod: gradingPeriod.name,
        subjects: subjects,
        totalSubjects: subjects.length,
        verifiedSubjects: verifiedGrades.length,
        overallAverage: overallAverage
      }
    });

  } catch (error) {
    console.error('Error in verified student-grades GET:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
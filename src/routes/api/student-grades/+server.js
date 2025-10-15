import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';

// Helper function to get current school year from admin settings
async function getCurrentSchoolYear(db) {
  try {
    const schoolYearSetting = await db.collection('admin_settings').findOne({
      setting_key: 'current_school_year'
    });
    return schoolYearSetting?.setting_value || '2025-2026';
  } catch (error) {
    console.error('Error fetching current school year:', error);
    return '2025-2026'; // Default fallback
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  try {
    const db = await connectToDatabase();
    
    // Get query parameters
    const student_id = url.searchParams.get('student_id');
    // Use current school year from admin settings if not provided
    const school_year = url.searchParams.get('school_year') || await getCurrentSchoolYear(db);
    const quarter = parseInt(url.searchParams.get('quarter')) || 1;

    if (!student_id) {
      return json({
        success: false,
        error: 'Student ID is required'
      }, { status: 400 });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(student_id)) {
      return json({
        success: false,
        error: 'Invalid student ID format'
      }, { status: 400 });
    }

    // First, get the student's section and grade level
    const studentEnrollment = await db.collection('section_students').findOne({
      student_id: new ObjectId(student_id),
      status: 'active'
    });

    if (!studentEnrollment) {
      return json({
        success: false,
        error: 'Student is not enrolled in any active section'
      }, { status: 404 });
    }

    // Get the section details to find grade level and school year
    const section = await db.collection('sections').findOne({
      _id: studentEnrollment.section_id,
      status: 'active'
    });

    if (!section) {
      return json({
        success: false,
        error: 'Student section not found or inactive'
      }, { status: 404 });
    }

    // Use section's school year for schedules (historical data)
    const sectionSchoolYear = section.school_year || '2025-2026';
    
    // Use current school year for grades
    const gradesSchoolYear = school_year;

    // Get all subjects for the student's grade level
    const allSubjects = await db.collection('subjects').find({
      grade_level: section.grade_level
    }).toArray();

    // Get all schedules for the student's section to find assigned teachers
    // Use section's school year since schedules are historical
    const schedules = await db.collection('schedules').find({
      section_id: section._id,
      schedule_type: 'subject',
      school_year: sectionSchoolYear
    }).toArray();

    // Create a map of subject_id to teacher_id from schedules
    const subjectTeacherMap = {};
    schedules.forEach(schedule => {
      if (schedule.subject_id && schedule.teacher_id) {
        subjectTeacherMap[schedule.subject_id.toString()] = schedule.teacher_id;
      }
    });

    // Get all grades for this student (both verified and unverified)
    // Use current school year for grades
    const existingGrades = await db.collection('grades').find({
      student_id: new ObjectId(student_id),
      school_year: gradesSchoolYear,
      quarter: quarter
    }).toArray();

    // Create a map of subject_id to grade data
    const gradeMap = {};
    existingGrades.forEach(grade => {
      gradeMap[grade.subject_id.toString()] = grade;
    });

    // Get teacher information for all assigned teachers
    const teacherIds = Object.values(subjectTeacherMap).filter(id => id);
    const teachers = await db.collection('users').find({
      _id: { $in: teacherIds }
    }).toArray();

    const teacherMap = {};
    teachers.forEach(teacher => {
      teacherMap[teacher._id.toString()] = teacher;
    });

    // Build the complete subject list with grades and teacher info
    const grades = allSubjects.map(subject => {
      const subjectId = subject._id.toString();
      const teacherId = subjectTeacherMap[subjectId];
      const teacher = teacherId ? teacherMap[teacherId.toString()] : null;
      const gradeData = gradeMap[subjectId];

      // Only show verified grades, or show N/A if not verified or no grade exists
      const isVerified = gradeData && (gradeData.verified === true || gradeData.verification?.verified === true);
      
      return {
        _id: gradeData?._id || new ObjectId(),
        subject_id: subject._id,
        subject_name: subject.name,
        subject_code: subject.code,
        teacher_name: teacher ? teacher.full_name : 'No teacher',
        final_grade: isVerified ? (gradeData.averages?.final_grade || 0) : 0,
        written_work_avg: isVerified ? (gradeData.averages?.written_work || 0) : 0,
        performance_tasks_avg: isVerified ? (gradeData.averages?.performance_tasks || 0) : 0,
        quarterly_assessment_avg: isVerified ? (gradeData.averages?.quarterly_assessment || 0) : 0,
        // Include individual score arrays for detailed breakdown (show even if not verified)
        written_work_scores: gradeData ? (gradeData.written_work || []) : [],
        performance_tasks_scores: gradeData ? (gradeData.performance_tasks || []) : [],
        quarterly_assessment_scores: gradeData ? (gradeData.quarterly_assessment || []) : [],
        verified: isVerified,
        verified_at: isVerified ? (gradeData.verification?.verified_at || gradeData.verified_at) : null,
        verified_by: isVerified ? (gradeData.verification?.verified_by || gradeData.verified_by) : null,
        has_teacher: !!teacher,
        has_grade: !!gradeData
      };
    }).sort((a, b) => a.subject_name.localeCompare(b.subject_name));

    // Calculate overall statistics
    const totalSubjects = grades.length; // Count all subjects
    // Calculate average from ALL subjects (including those with 0 or N/A grades)
    const overallAverage = totalSubjects > 0 
      ? Math.round((grades.reduce((sum, grade) => sum + (grade.final_grade || 0), 0) / totalSubjects) * 10) / 10
      : 0;

    // Format grades for frontend
    const formattedGrades = grades.map((grade, index) => ({
      id: grade._id.toString(),
      subject_id: grade.subject_id.toString(),
      name: grade.subject_name || 'Unknown Subject',
      code: grade.subject_code || '',
      teacher: grade.teacher_name || 'No teacher assigned',
      numericGrade: grade.final_grade || 0,
      writtenWork: grade.written_work_avg || 0,
      performanceTasks: grade.performance_tasks_avg || 0,
      quarterlyAssessment: grade.quarterly_assessment_avg || 0,
      // Include individual score arrays for breakdown
      writtenWorkScores: grade.written_work_scores || [],
      performanceTasksScores: grade.performance_tasks_scores || [],
      quarterlyAssessmentScores: grade.quarterly_assessment_scores || [],
      verified: grade.verified || false,
      verifiedAt: grade.verified_at,
      verifiedBy: grade.verified_by
    }));

    return json({
      success: true,
      data: {
        grades: formattedGrades,
        statistics: {
          totalSubjects,
          overallAverage,
          quarter,
          schoolYear: gradesSchoolYear // Use the grades school year
        }
      }
    });

  } catch (error) {
    console.error('Error fetching student grades:', error);
    return json({
      success: false,
      error: 'Failed to fetch grades'
    }, { status: 500 });
  }
}
import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const db = await connectToDatabase();
    
    // Get current school year from admin settings
    const schoolYearSetting = await db.collection('admin_settings').findOne({ 
      setting_key: 'current_school_year' 
    });
    const school_year = url.searchParams.get('school_year') || schoolYearSetting?.setting_value || '2025-2026';
    const quarter = parseInt(url.searchParams.get('quarter')) || 1;

    // Get all active students
    const activeStudents = await db.collection('users').find({
      account_type: 'student',
      status: 'active'
    }).toArray();

    if (activeStudents.length === 0) {
      return json({
        success: true,
        students: [],
        message: 'No active students found'
      });
    }

    // Get all active section enrollments for these students
    const studentIds = activeStudents.map(student => student._id);
    const sectionEnrollments = await db.collection('section_students').find({
      student_id: { $in: studentIds },
      status: 'active'
    }).toArray();

    // Create a map of student_id to section_id
    const studentSectionMap = {};
    sectionEnrollments.forEach(enrollment => {
      studentSectionMap[enrollment.student_id.toString()] = enrollment.section_id;
    });

    // Get all sections for enrolled students
    const sectionIds = [...new Set(Object.values(studentSectionMap))];
    const sections = await db.collection('sections').find({
      _id: { $in: sectionIds },
      status: 'active'
    }).toArray();

    // Create a map of section_id to section data
    const sectionMap = {};
    sections.forEach(section => {
      sectionMap[section._id.toString()] = section;
    });

    // Get all grades for these students in the specified school year and quarter
    const gradesData = await db.collection('grades').find({
      student_id: { $in: studentIds },
      school_year: school_year,
      quarter: quarter,
      $or: [
        { verified: true },
        { 'verification.verified': true }
      ]
    }).toArray();

    // Create a map of student_id to their grades
    const studentGradesMap = {};
    gradesData.forEach(grade => {
      const studentId = grade.student_id.toString();
      if (!studentGradesMap[studentId]) {
        studentGradesMap[studentId] = [];
      }
      studentGradesMap[studentId].push(grade);
    });

    // Calculate GWA for each student and format the response - INCLUDE ALL STUDENTS
    const studentsWithGrades = activeStudents
      .map(student => {
        const studentId = student._id.toString();
        const sectionId = studentSectionMap[studentId];
        const section = sectionId && sectionMap[sectionId.toString()];
        const studentGrades = studentGradesMap[studentId] || [];
        
        // Calculate GWA from verified final grades
        let gwa = 0;
        if (studentGrades.length > 0) {
          const validGrades = studentGrades.filter(grade => 
            grade.averages && grade.averages.final_grade && grade.averages.final_grade > 0
          );
          
          if (validGrades.length > 0) {
            const totalGrades = validGrades.reduce((sum, grade) => 
              sum + grade.averages.final_grade, 0
            );
            gwa = totalGrades / validGrades.length;
          }
        }

        // Format GWA - remove .0 for whole numbers
        const formattedGwa = Math.round(gwa * 10) / 10;
        const gwaDisplay = formattedGwa === Math.floor(formattedGwa) ? Math.floor(formattedGwa) : Number(formattedGwa.toFixed(1));

        return {
          id: student.account_number,
          _id: student._id.toString(),
          name: student.full_name,
          email: student.email,
          gradeLevel: section ? section.grade_level.toString() : student.grade_level?.toString() || 'N/A',
          section: section ? section.name : 'No Section',
          gwa: gwaDisplay,
          totalSubjects: studentGrades.length,
          verifiedGrades: studentGrades.filter(grade => 
            (grade.verified === true || grade.verification?.verified === true)
          ).length
        };
      })
      .sort((a, b) => {
        // Sort by account number (ID) - extract numeric part for proper ordering
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
        quarter: quarter,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching students bulk data:', error);
    return json({
      success: false,
      error: 'Failed to fetch students data',
      students: []
    }, { status: 500 });
  }
}
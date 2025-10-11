import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';
import { ObjectId } from 'mongodb';

// GET /api/student-profile - Get comprehensive student profile data
export async function GET({ url }) {
  try {
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }

    const db = await connectToDatabase();

    // Get student's section information
    const sectionStudents = db.collection('section_students');
    const sections = db.collection('sections');
    const users = db.collection('users');

    // Find active section enrollment for the student
    const sectionEnrollment = await sectionStudents.findOne({
      student_id: new ObjectId(studentId),
      status: 'active'
    });

    let sectionInfo = null;
    if (sectionEnrollment) {
      // Get section details with adviser information
      const sectionData = await sections.findOne({
        _id: sectionEnrollment.section_id
      });

      if (sectionData) {
        let adviserName = 'Not assigned';
        if (sectionData.adviser_id) {
          const adviser = await users.findOne({
            _id: sectionData.adviser_id
          });
          if (adviser) {
            adviserName = adviser.full_name;
          }
        }

        sectionInfo = {
          section_id: sectionData._id,
          section_name: sectionData.name,
          grade_level: sectionData.grade_level,
          adviser_name: adviserName
        };
      }
    }

    // Get student's enrolled subjects with teacher information
    let subjects = [];
    if (sectionInfo) {
      const subjectsCollection = db.collection('subjects');
      const schedulesCollection = db.collection('schedules');
      const departmentsCollection = db.collection('departments');

      // Get all subjects for the student's grade level
      const subjectsList = await subjectsCollection.find({
        grade_level: sectionInfo.grade_level
      }).sort({ name: 1 }).toArray();

      // For each subject, try to find teacher and department info
      for (const subject of subjectsList) {
        let teacherName = 'No teacher';
        let departmentName = 'General';

        // Find schedule for this subject and section to get teacher
        const schedule = await schedulesCollection.findOne({
          subject_id: subject._id,
          section_id: sectionInfo.section_id
        });

        if (schedule && schedule.teacher_id) {
          const teacher = await users.findOne({
            _id: schedule.teacher_id,
            account_type: 'teacher'
          });
          if (teacher) {
            teacherName = teacher.full_name;
          }
        }

        // Get department name
        if (subject.department_id) {
          const department = await departmentsCollection.findOne({
            _id: subject.department_id
          });
          if (department) {
            departmentName = department.name;
          }
        }

        subjects.push({
          id: subject._id.toString(),
          name: subject.name,
          code: subject.code,
          department: departmentName,
          teacher: teacherName,
          color: getSubjectColor(subject.name)
        });
      }
    }

    // Calculate student's general average from grades
    let generalAverage = null;
    let totalSubjectsWithGrades = 0;
    
    if (sectionInfo) {
      const gradesCollection = db.collection('grades');
      
      // Get all verified grades for the student in current section
      const studentGrades = await gradesCollection.find({
        student_id: new ObjectId(studentId),
        section_id: sectionInfo.section_id,
        'averages.final_grade': { $exists: true, $ne: null },
        verified: true
      }).toArray();

      if (studentGrades.length > 0) {
        const totalGrades = studentGrades.reduce((sum, grade) => {
          return sum + (grade.averages?.final_grade || 0);
        }, 0);
        
        generalAverage = Math.round((totalGrades / studentGrades.length) * 100) / 100;
        totalSubjectsWithGrades = studentGrades.length;
      }
    }

    // Calculate class rank
    let classRank = null;
    let totalStudentsInSection = 0;
    
    if (sectionInfo && generalAverage !== null) {
      const gradesCollection = db.collection('grades');
      
      // Get all students in the same section with their averages
      const allStudentsInSection = await sectionStudents.find({
        section_id: sectionInfo.section_id,
        status: 'active'
      }).toArray();

      const studentAverages = [];
      
      for (const student of allStudentsInSection) {
        const studentGrades = await gradesCollection.find({
          student_id: student.student_id,
          section_id: sectionInfo.section_id,
          'averages.final_grade': { $exists: true, $ne: null },
          verified: true
        }).toArray();

        if (studentGrades.length > 0) {
          const totalGrades = studentGrades.reduce((sum, grade) => {
            return sum + (grade.averages?.final_grade || 0);
          }, 0);
          
          const average = totalGrades / studentGrades.length;
          studentAverages.push({
            student_id: student.student_id.toString(),
            average_grade: average
          });
        }
      }

      // Sort by average grade (descending) and find rank
      studentAverages.sort((a, b) => b.average_grade - a.average_grade);
      
      const studentRankIndex = studentAverages.findIndex(s => s.student_id === studentId);
      if (studentRankIndex !== -1) {
        classRank = studentRankIndex + 1;
        totalStudentsInSection = studentAverages.length;
      }
    }

    // Get total students in section (including those without grades)
    if (sectionInfo && totalStudentsInSection === 0) {
      totalStudentsInSection = await sectionStudents.countDocuments({
        section_id: sectionInfo.section_id,
        status: 'active'
      });
    }

    // Format response
    const profileData = {
      section: sectionInfo ? {
        id: sectionInfo.section_id.toString(),
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
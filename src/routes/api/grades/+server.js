import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';
import { createGradeVerificationNotification, formatTeacherName } from '../helper/notification-helper.js';

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
    
    // Get current school year from database
    const currentSchoolYear = await getCurrentSchoolYear(db);
    
    // Get query parameters
    const student_id = url.searchParams.get('student_id');
    const teacher_id = url.searchParams.get('teacher_id');
    const section_id = url.searchParams.get('section_id');
    const subject_id = url.searchParams.get('subject_id');
    const school_year = url.searchParams.get('school_year') || currentSchoolYear;
    const quarter = parseInt(url.searchParams.get('quarter')) || 1;
    const action = url.searchParams.get('action');

    // Get grades for a specific student
    if (action === 'student_grades' && student_id) {
      const grades = await db.collection('grades').findOne({
        student_id: new ObjectId(student_id),
        section_id: new ObjectId(section_id),
        subject_id: new ObjectId(subject_id),
        school_year,
        quarter
      });

      return json({
        success: true,
        grades: grades || {
          written_work: [],
          performance_tasks: [],
          quarterly_assessment: [],
          averages: {
            written_work: 0,
            performance_tasks: 0,
            quarterly_assessment: 0,
            final_grade: 0
          },
          verified: false
        }
      });
    }

    // Get all students' grades for a section and subject
    if (action === 'section_grades' && section_id && subject_id && teacher_id) {
      const pipeline = [
        {
          $match: {
            section_id: new ObjectId(section_id),
            subject_id: new ObjectId(subject_id),
            school_year,
            quarter
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'student_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $unwind: '$student'
        },
        {
          $project: {
            student_id: 1,
            student_name: '$student.full_name',
            student_number: '$student.account_number',
            written_work: 1,
            performance_tasks: 1,
            quarterly_assessment: 1,
            averages: 1,
            verified: 1,
            verified_at: 1,
            updated_at: 1
          }
        },
        {
          $sort: { student_name: 1 }
        }
      ];

      const grades = await db.collection('grades').aggregate(pipeline).toArray();

      return json({
        success: true,
        grades
      });
    }

    // Get advisory class grades (all subjects for students in a section)
    if (action === 'advisory_grades' && section_id && teacher_id) {
      const pipeline = [
        {
          $match: {
            section_id: new ObjectId(section_id),
            school_year,
            quarter
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'student_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subject_id',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $unwind: '$student'
        },
        {
          $unwind: '$subject'
        },
        {
          $group: {
            _id: '$student_id',
            student_name: { $first: '$student.full_name' },
            student_number: { $first: '$student.account_number' },
            subjects: {
              $push: {
                subject_id: '$subject_id',
                subject_name: '$subject.name',
                subject_code: '$subject.code',
                averages: '$averages',
                verified: '$verified',
                verified_at: '$verified_at'
              }
            }
          }
        },
        {
          $addFields: {
            overall_average: {
              $avg: '$subjects.averages.final_grade'
            }
          }
        },
        {
          $sort: { student_name: 1 }
        }
      ];

      const students = await db.collection('grades').aggregate(pipeline).toArray();

      return json({
        success: true,
        students
      });
    }

    return json({ error: 'Invalid action or missing parameters' }, { status: 400 });

  } catch (error) {
    console.error('Error in grades GET:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    console.log('POST handler called - attempting database connection...');
    const db = await connectToDatabase();
    console.log('Database connection result:', db);
    
    if (!db) {
      console.error('Database connection is null/undefined');
      return json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get current school year from database
    const currentSchoolYear = await getCurrentSchoolYear(db);
    
    const body = await request.json();
    const { action } = body;

    // Add a new grade item
    if (action === 'add_grade_item') {
      const {
        student_id,
        teacher_id,
        section_id,
        subject_id,
        school_year = currentSchoolYear,
        quarter = 1,
        category,
        name,
        score,
        total_score,
        date_given
      } = body;

      // Validate required fields
      if (!student_id || !teacher_id || !section_id || !subject_id || !category || !name) {
        return json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Validate category
      if (!['written_work', 'performance_tasks', 'quarterly_assessment'].includes(category)) {
        return json({ error: 'Invalid category' }, { status: 400 });
      }

      const gradeItem = {
        name,
        score: score || 0,
        total_score: total_score || 100,
        date_given: date_given ? new Date(date_given) : new Date(),
        created_at: new Date()
      };

      // Find existing grade document or create new one
      const filter = {
        student_id: new ObjectId(student_id),
        section_id: new ObjectId(section_id),
        subject_id: new ObjectId(subject_id),
        school_year,
        quarter
      };

      const update = {
        $push: {
          [category]: gradeItem
        },
        $setOnInsert: {
          teacher_id: new ObjectId(teacher_id),
          written_work: [],
          performance_tasks: [],
          quarterly_assessment: [],
          averages: {
            written_work: 0,
            performance_tasks: 0,
            quarterly_assessment: 0,
            final_grade: 0
          },
          verified: false,
          created_at: new Date()
        },
        $set: {
          updated_at: new Date()
        }
      };

      const result = await db.collection('grades').updateOne(filter, update, { upsert: true });

      // Recalculate averages
      await recalculateAverages(db, filter);

      return json({
        success: true,
        message: 'Grade item added successfully',
        result
      });
    }

    // Update a grade score
    if (action === 'update_grade') {
      const {
        student_id,
        section_id,
        subject_id,
        school_year = currentSchoolYear,
        quarter = 1,
        category,
        grade_index,
        score
      } = body;

      const filter = {
        student_id: new ObjectId(student_id),
        section_id: new ObjectId(section_id),
        subject_id: new ObjectId(subject_id),
        school_year,
        quarter
      };

      // Check if grades are already verified
      const existingGrade = await db.collection('grades').findOne(filter);
      if (existingGrade && existingGrade.verification && existingGrade.verification.verified) {
        return json({
          success: false,
          error: 'Cannot update grades that have been verified by the adviser'
        }, { status: 403 });
      }

      const update = {
        $set: {
          [`${category}.${grade_index}.score`]: score,
          updated_at: new Date()
        }
      };

      await db.collection('grades').updateOne(filter, update);

      // Recalculate averages
      await recalculateAverages(db, filter);

      return json({
        success: true,
        message: 'Grade updated successfully'
      });
    }

    // Verify grades
    if (action === 'verify_grades') {
      const {
        student_id,
        section_id,
        subject_id,
        school_year = currentSchoolYear,
        quarter = 1,
        teacher_id,
        verified = true
      } = body;

      const filter = {
        student_id: new ObjectId(student_id),
        section_id: new ObjectId(section_id),
        subject_id: new ObjectId(subject_id),
        school_year,
        quarter
      };

      // Get teacher and subject information for notification
      const teacher = await db.collection('users').findOne({
        _id: new ObjectId(teacher_id)
      }, { projection: { full_name: 1, gender: 1 } });

      const subject = await db.collection('subjects').findOne({
        _id: new ObjectId(subject_id)
      }, { projection: { name: 1 } });

      const teacherName = teacher ? formatTeacherName(teacher.full_name, teacher.gender) : 'Your teacher';
      const subjectName = subject ? subject.name : 'Subject';

      const update = {
        $set: {
          verified,
          verified_at: verified ? new Date() : null,
          verified_by: verified ? new ObjectId(teacher_id) : null,
          updated_at: new Date()
        }
      };

      const result = await db.collection('grades').updateOne(filter, update);

      // Create notification only when verifying (not unverifying) and if a record was updated
      if (verified && result.modifiedCount > 0) {
        await createGradeVerificationNotification(
          db,
          student_id,
          teacherName,
          subjectName
        );
      }

      return json({
        success: true,
        message: verified ? 'Grades verified successfully' : 'Grades unverified successfully'
      });
    }

    // Submit final grades to adviser
    if (action === 'submit_final_grades') {
      const {
        section_id,
        subject_id,
        grading_period_id = 1,
        final_grades,
        teacher_id
      } = body;

      console.log('Submit final grades request:', {
        section_id,
        subject_id,
        grading_period_id,
        teacher_id,
        final_grades_count: final_grades?.length
      });

      if (!section_id || !subject_id || !final_grades || !Array.isArray(final_grades)) {
        return json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Authenticate teacher
      if (!teacher_id) {
        return json({ error: 'Teacher authentication required' }, { status: 401 });
      }

      const processedStudents = [];
      const errors = [];

      for (const gradeData of final_grades) {
        try {
          const { student_id, written_work_average, performance_tasks_average, quarterly_assessment_average, final_grade, written_work_items, performance_tasks_items, quarterly_assessment_items } = gradeData;

          console.log('Processing student:', { student_id, final_grade });

          if (!student_id) {
            errors.push('Missing student_id for one or more students');
            continue;
          }

          // Find student by account number
          const student = await db.collection('users').findOne({ 
            account_number: student_id,
            account_type: 'student'
          });

          console.log('Found student:', student ? { id: student._id, name: student.full_name } : 'Not found');

          if (!student) {
            errors.push(`Student not found: ${student_id}`);
            continue;
          }

          // Prepare grade document
          const gradeDoc = {
            student_id: student._id,
            section_id: new ObjectId(section_id),
            subject_id: new ObjectId(subject_id),
            teacher_id: new ObjectId(teacher_id),
            school_year: currentSchoolYear,
            quarter: grading_period_id,
            written_work: written_work_items || [],
            performance_tasks: performance_tasks_items || [],
            quarterly_assessment: quarterly_assessment_items || [],
            averages: {
              written_work: written_work_average || 0,
              performance_tasks: performance_tasks_average || 0,
              quarterly_assessment: quarterly_assessment_average || 0,
              final_grade: final_grade || 0
            },
            verified: false,
            submitted_to_adviser: true,
            submitted_at: new Date(),
            submitted_by: new ObjectId(teacher_id),
            created_at: new Date(),
            updated_at: new Date()
          };

          console.log('Saving grade document:', {
            student_id: student._id,
            submitted_to_adviser: gradeDoc.submitted_to_adviser,
            final_grade: gradeDoc.averages.final_grade
          });

          // Upsert the grade document
          const filter = {
            student_id: student._id,
            section_id: new ObjectId(section_id),
            subject_id: new ObjectId(subject_id),
            school_year: currentSchoolYear,
            quarter: grading_period_id
          };

          const result = await db.collection('grades').updateOne(
            filter,
            { $set: gradeDoc },
            { upsert: true }
          );

          console.log('Database update result:', result);

          processedStudents.push({
            student_id: student_id,
            student_name: student.full_name || `${student.first_name} ${student.last_name}`,
            final_grade: final_grade
          });

        } catch (error) {
          console.error(`Error processing student ${gradeData.student_id}:`, error);
          errors.push(`Error processing student ${gradeData.student_id}: ${error.message}`);
        }
      }

      return json({
        success: true,
        message: `Final grades submitted to adviser for ${processedStudents.length} students`,
        processed_students: processedStudents,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    return json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in grades POST:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to recalculate averages
async function recalculateAverages(db, filter) {
  const gradeDoc = await db.collection('grades').findOne(filter);
  
  if (!gradeDoc) return;

  // Calculate averages for each category
  const calculateCategoryAverage = (items) => {
    if (!items || items.length === 0) return 0;
    
    const validItems = items.filter(item => item.score !== null && item.score !== undefined);
    if (validItems.length === 0) return 0;
    
    const totalScore = validItems.reduce((sum, item) => sum + item.score, 0);
    const totalPossible = validItems.reduce((sum, item) => sum + item.total_score, 0);
    
    return totalPossible > 0 ? Math.round((totalScore / totalPossible * 100) * 100) / 100 : 0;
  };

  const writtenWorkAvg = calculateCategoryAverage(gradeDoc.written_work);
  const performanceTasksAvg = calculateCategoryAverage(gradeDoc.performance_tasks);
  const quarterlyAssessmentAvg = calculateCategoryAverage(gradeDoc.quarterly_assessment);

  // Calculate final grade with weights
  const finalGrade = Math.round((
    (writtenWorkAvg * 0.30) +
    (performanceTasksAvg * 0.50) +
    (quarterlyAssessmentAvg * 0.20)
  ) * 100) / 100;

  // Update averages
  await db.collection('grades').updateOne(filter, {
    $set: {
      'averages.written_work': writtenWorkAvg,
      'averages.performance_tasks': performanceTasksAvg,
      'averages.quarterly_assessment': quarterlyAssessmentAvg,
      'averages.final_grade': finalGrade,
      updated_at: new Date()
    }
  });
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
  try {
    const db = await connectToDatabase();
    
    // Get current school year from database
    const currentSchoolYear = await getCurrentSchoolYear(db);
    
    const body = await request.json();
    
    const {
      student_id,
      section_id,
      subject_id,
      school_year = currentSchoolYear,
      quarter = 1,
      category,
      grade_index
    } = body;

    const filter = {
      student_id: new ObjectId(student_id),
      section_id: new ObjectId(section_id),
      subject_id: new ObjectId(subject_id),
      school_year,
      quarter
    };

    // Remove the grade item at the specified index
    const gradeDoc = await db.collection('grades').findOne(filter);
    
    if (!gradeDoc || !gradeDoc[category] || !gradeDoc[category][grade_index]) {
      return json({ error: 'Grade item not found' }, { status: 404 });
    }

    // Remove the item from the array
    const update = {
      $unset: {
        [`${category}.${grade_index}`]: 1
      }
    };

    await db.collection('grades').updateOne(filter, update);

    // Clean up null values in the array
    await db.collection('grades').updateOne(filter, {
      $pull: {
        [category]: null
      },
      $set: {
        updated_at: new Date()
      }
    });

    // Recalculate averages
    await recalculateAverages(db, filter);

    return json({
      success: true,
      message: 'Grade item deleted successfully'
    });

  } catch (error) {
    console.error('Error in grades DELETE:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
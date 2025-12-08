import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';
import { verifyAuth } from '../../helper/auth-helper.js';

// GET /api/dashboard/students-per-grade - Fetch students count per grade level
export async function GET({ request }) {
  try {
    // Verify authentication - admins, teachers, and advisers can view students per grade data
    const authResult = await verifyAuth(request, ['admin', 'teacher', 'adviser']);
    if (!authResult.success) {
      return json({ error: authResult.error || 'Authentication required' }, { status: 401 });
    }

    // Connect to MongoDB
    const db = await connectToDatabase();

    // Get current school year setting
    const currentYearSetting = await db.collection('admin_settings').findOne({ setting_key: 'current_school_year' });
    const currentSchoolYear = currentYearSetting?.setting_value || '2025-2026'; // Fallback

    const url = new URL(request.url);
    const requestedSchoolYear = url.searchParams.get('school_year');

    let studentsPerGrade;

    // Check if we need historical data
    // Check if we need historical data
    if (requestedSchoolYear && requestedSchoolYear !== currentSchoolYear) {
      // HISTORICAL QUERY VIA BACKUPS
      // 1. Find the backup metadata for this school year
      const backupMetadata = await db.collection('system_backups').findOne({
        type: 'pre_rollover_metadata',
        original_school_year: requestedSchoolYear,
        status: 'completed'
      });

      if (backupMetadata) {
        // 2. Fetch the student data from this backup
        const backupData = await db.collection('system_backups').findOne({
          backup_id: backupMetadata._id,
          collection: 'users',
          type: 'pre_rollover_data'
        });

        if (backupData && backupData.data && Array.isArray(backupData.data)) {
          // 3. Process the data array manually (since it's inside a document)
          // We need to count students per grade_level

          const counts = {};
          backupData.data.forEach(student => {
            // Exclude archived students
            if (student.status === 'archived') return;

            // grade_level might be string or number in backup, normalize to string
            // Also handle cases where grade_level is missing
            if (student.grade_level) {
              const grade = String(student.grade_level);
              counts[grade] = (counts[grade] || 0) + 1;
            }
          });

          // Convert to array format expected by frontend
          studentsPerGrade = Object.keys(counts).map(grade => ({
            grade_level: grade,
            count: counts[grade]
          }));

          // Sort by grade level numeric
          studentsPerGrade.sort((a, b) => {
            return Number(a.grade_level) - Number(b.grade_level);
          });

        } else {
          studentsPerGrade = [];
        }
      } else {
        // No backup found for this year
        studentsPerGrade = [];
      }

    } else {
      // CURRENT/LIVE QUERY (Default)
      // Aggregate students by grade level
      studentsPerGrade = await db.collection('users').aggregate([
        {
          $match: {
            account_type: 'student',
            $or: [
              { status: { $exists: false } },
              { status: 'active' },
              { status: 'unenrolled' }
            ]
          }
        },
        {
          $group: {
            _id: '$grade_level',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            grade_level: '$_id',
            count: 1
          }
        },
        {
          $sort: { grade_level: 1 }
        }
      ]).toArray();
    }

    return json({
      success: true,
      data: studentsPerGrade
    });

  } catch (error) {
    console.error('Error fetching students per grade level:', error);
    return json({
      success: false,
      error: 'Failed to fetch students per grade level'
    }, { status: 500 });
  }
}

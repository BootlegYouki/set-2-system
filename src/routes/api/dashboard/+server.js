import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';

// GET /api/dashboard - Fetch dashboard statistics
export async function GET({ request }) {
  try {
    // Verify authentication - admins, teachers, and advisers can view dashboard statistics
    const authResult = await verifyAuth(request, ['admin', 'teacher', 'adviser']);
    if (!authResult.success) {
      return json({ error: authResult.error || 'Authentication required' }, { status: 401 });
    }

    // Connect to MongoDB
    const db = await connectToDatabase();

    // Get current school year setting
    const currentYearSetting = await db.collection('admin_settings').findOne({ setting_key: 'current_school_year' });
    const currentSchoolYear = currentYearSetting?.setting_value || '2025-2026';

    const url = new URL(request.url);
    const requestedSchoolYear = url.searchParams.get('school_year');

    let studentsCount, teachersCount, sectionsCount, roomsCount;

    if (requestedSchoolYear && requestedSchoolYear !== currentSchoolYear) {
      // HISTORICAL COUNTS VIA BACKUPS

      const backupMetadata = await db.collection('system_backups').findOne({
        type: 'pre_rollover_metadata',
        original_school_year: requestedSchoolYear,
        status: 'completed'
      });

      if (backupMetadata) {
        // 1. Students Count (from users backup)
        // This ensures we get ALL students, including unassigned ones, but exclude archived
        const usersBackup = await db.collection('system_backups').findOne({
          backup_id: backupMetadata._id,
          collection: 'users',
          type: 'pre_rollover_data'
        });
        studentsCount = usersBackup?.data ? usersBackup.data.filter(s => s.status !== 'archived').length : 0;

        // 2. Sections Count (from sections backup)
        // Filter by school year and active status to get the count AT THAT TIME
        const sectionsBackup = await db.collection('system_backups').findOne({
          backup_id: backupMetadata._id,
          collection: 'sections',
          type: 'pre_rollover_data'
        });

        if (sectionsBackup?.data) {
          sectionsCount = sectionsBackup.data.filter(section =>
            section.school_year === requestedSchoolYear &&
            section.status === 'active'
          ).length;
        } else {
          sectionsCount = 0;
        }

        // 3. Teachers Count
        // Since we don't backup teachers, we count current teachers who existed at the time of backup.
        teachersCount = await db.collection('users').countDocuments({
          account_type: 'teacher',
          $or: [
            { status: { $exists: false } },
            { status: 'active' }
          ],
          created_at: { $lte: backupMetadata.timestamp }
        });

      } else {
        studentsCount = 0;
        sectionsCount = 0;
        teachersCount = 0;
      }

      // Rooms: All rooms are "available" regardless of year
      roomsCount = await db.collection('rooms').countDocuments({});

    } else {
      // CURRENT LIVE COUNTS
      studentsCount = await db.collection('users').countDocuments({
        account_type: 'student',
        $or: [
          { status: { $exists: false } }, // Legacy support
          { status: 'active' },
          { status: 'unenrolled' }
        ]
      });

      teachersCount = await db.collection('users').countDocuments({
        account_type: 'teacher',
        $or: [
          { status: { $exists: false } },
          { status: 'active' }
        ]
      });

      // Filter sections by CURRENT SCHOOL YEAR
      sectionsCount = await db.collection('sections').countDocuments({
        status: 'active',
        school_year: currentSchoolYear
      });

      roomsCount = await db.collection('rooms').countDocuments({});
    }

    const statistics = {
      students: studentsCount,
      teachers: teachersCount,
      sections: sectionsCount,
      rooms: roomsCount
    };

    return json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
}
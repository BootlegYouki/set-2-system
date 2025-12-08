import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../../helper/auth-helper.js';
import { ObjectId } from 'mongodb';

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  const user = getUserFromRequest(event.request);

  if (!user || user.account_type !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let client;

  try {
    client = await connectToDatabase();
    const db = client; // connectToDatabase returns the db instance directly, not client?? 
    // Wait, checking db.js: "return client.db(dbName);" 
    // So `client` variable here is actually the db instance.

    const adminSettings = db.collection('admin_settings');
    const users = db.collection('users');
    const grades = db.collection('grades');
    const sections = db.collection('sections');
    const sectionStudents = db.collection('section_students');
    const schedules = db.collection('schedules');
    const backups = db.collection('system_backups');

    // 1. Get Current School Year
    const schoolYearSetting = await adminSettings.findOne({ setting_key: 'current_school_year' });
    const currentSchoolYear = schoolYearSetting?.setting_value || '2024-2025';

    // Calculate Next School Year
    const [startYear, endYear] = currentSchoolYear.split('-').map(Number);
    const nextSchoolYear = `${startYear + 1}-${endYear + 1}`;

    // 2. BACKUP PROCESS
    const backupId = new ObjectId();
    const timestamp = new Date();

    // Helper to backup a collection
    const backupCollection = async (collectionName, query = {}) => {
      const data = await db.collection(collectionName).find(query).toArray();
      if (data.length > 0) {
        // Store in batches to avoid document size limits if necessary, 
        // but for now we store as one document per collection for simplicity unless huge.
        // Better safety: store simply "type: 'backup_data', backup_id: ..., collection: ..., data: [...]"
        await backups.insertOne({
          backup_id: backupId,
          type: 'pre_rollover_data',
          collection: collectionName,
          data: data,
          timestamp: timestamp
        });
      }
    };

    await backupCollection('users', { account_type: 'student' });
    await backupCollection('grades');
    await backupCollection('sections');
    await backupCollection('schedules');
    await backupCollection('section_students');

    // Create the main backup record
    await backups.insertOne({
      _id: backupId,
      type: 'pre_rollover_metadata',
      original_school_year: currentSchoolYear,
      timestamp: timestamp,
      status: 'completed',
      created_by: user.id
    });

    // 3. ROLLOVER LOGIC

    // Get active students
    const activeStudents = await users.find({ account_type: 'student', status: 'active' }).toArray();
    let promotedCount = 0;
    let retainedCount = 0;

    // Store details for reporting
    const rolloverDetails = {
      timestamp: new Date(),
      previous_year: currentSchoolYear,
      new_year: nextSchoolYear,
      promoted: [],
      retained: []
    };

    for (const student of activeStudents) {
      // Calculate GWA
      // Logic similar to students-bulk
      const studentGrades = await grades.find({
        student_id: student._id,
        school_year: currentSchoolYear,
        'averages.final_grade': { $ne: null }
      }).toArray();

      let gwa = 0;
      if (studentGrades.length > 0) {
        // Calculate overall average
        // Group by quarter
        const quarterAverages = {};
        studentGrades.forEach(grade => {
          const q = grade.quarter;
          // Assuming 'averages.final_grade' exists and is verified
          if (grade.averages?.final_grade) {
            if (!quarterAverages[q]) quarterAverages[q] = [];
            quarterAverages[q].push(grade.averages.final_grade);
          }
        });

        const quarterGWAs = [];
        for (const q in quarterAverages) {
          const qGrades = quarterAverages[q];
          const qAvg = qGrades.reduce((a, b) => a + b, 0) / qGrades.length;
          quarterGWAs.push(qAvg);
        }

        if (quarterGWAs.length > 0) {
          gwa = quarterGWAs.reduce((a, b) => a + b, 0) / quarterGWAs.length;
        }
      }

      // Determine promotion
      const currentGradeLevelParam = parseInt(student.grade_level); // "7"
      let newGradeLevel = currentGradeLevelParam;
      let status = 'retained';

      // Logic: If NO grades, retain? Or promote? 
      // Usually if no grades, we cannot evaluate. Retain.
      // Assumption: passing is 75.
      if (gwa >= 75) {
        newGradeLevel = currentGradeLevelParam + 1;
        status = 'promoted';
        promotedCount++;

        // Add to details list
        rolloverDetails.promoted.push({
          id: student.account_number,
          name: student.full_name,
          old_grade: currentGradeLevelParam,
          new_grade: newGradeLevel,
          gwa: gwa.toFixed(2)
        });
      } else {
        retainedCount++;

        // Add to details list
        rolloverDetails.retained.push({
          id: student.account_number,
          name: student.full_name,
          old_grade: currentGradeLevelParam,
          new_grade: currentGradeLevelParam,
          gwa: gwa.toFixed(2)
        });
      }

      // Update user
      let newStatus = 'active'; // Default for promoted/retained students waiting for next year (Changed from unenrolled)

      // Special case: Grade 10 students who are promoted are considered graduates/completers
      // Archive them immediately
      if (currentGradeLevelParam === 10 && status === 'promoted') {
        newStatus = 'archived';
        newGradeLevel = 'Completed'; // Or '10' depending on preference, but 'Completed' is clearer for archives
      }

      await users.updateOne(
        { _id: student._id },
        {
          $set: {
            grade_level: newGradeLevel.toString(),
            status: newStatus,
            updated_at: new Date()
          }
        }
      );
    }

    // Archive Section Enrollments
    await sectionStudents.updateMany(
      { status: 'active' },
      { $set: { status: 'completed', updated_at: new Date() } }
    );

    // 4. CLONE SECTIONS FOR NEW YEAR
    // Clone all active sections (without students) for the next school year
    const activeSections = await sections.find({
      school_year: currentSchoolYear,
      status: 'active'
    }).toArray();

    if (activeSections.length > 0) {
      const newSections = activeSections.map(section => ({
        name: section.name,
        grade_level: section.grade_level,
        school_year: nextSchoolYear,
        status: 'active',
        adviser_id: section.adviser_id, // Keep same adviser? Usually yes, until changed.
        room_id: section.room_id,      // Keep same room
        created_at: new Date(),
        updated_at: new Date()
      }));

      await sections.insertMany(newSections);
    }

    // Update School Year Setting
    await adminSettings.updateOne(
      { setting_key: 'current_school_year' },
      { $set: { setting_value: nextSchoolYear, updated_at: new Date() } },
      { upsert: true }
    );

    // Save detailed rollover statistics
    await adminSettings.updateOne(
      { setting_key: 'last_rollover_details' },
      {
        $set: {
          setting_value: JSON.stringify(rolloverDetails),
          setting_type: 'json',
          updated_at: new Date()
        }
      },
      { upsert: true }
    );

    // Log activity
    await logActivityWithUser(
      'end_school_year',
      JSON.stringify({
        previous_year: currentSchoolYear,
        new_year: nextSchoolYear,
        promoted: promotedCount,
        retained: retainedCount,
        backup_id: backupId
      }),
      user,
      event.getClientAddress()
    );

    return json({
      success: true,
      message: `School Year ended successfully. ${promotedCount} promoted, ${retainedCount} retained.`,
      backupId: backupId
    });

  } catch (error) {
    console.error('Error ending school year:', error);
    return json({ error: 'Failed to end school year: ' + error.message }, { status: 500 });
  }
}

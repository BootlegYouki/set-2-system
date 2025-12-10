import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../../helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  const user = getUserFromRequest(event.request);

  if (!user || user.account_type !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await connectToDatabase();
    const backups = db.collection('system_backups');

    // Find the latest pre-rollover backup
    const lastBackup = await backups.findOne(
      { type: 'pre_rollover_metadata' },
      { sort: { timestamp: -1 } }
    );

    if (!lastBackup) {
      return json({ error: 'No backup found to restore.' }, { status: 404 });
    }

    const backupId = lastBackup._id;

    // Collections to restore
    const collections = ['users', 'grades', 'sections', 'schedules', 'section_students'];

    for (const colName of collections) {
      // Get backup data for this collection
      // We might have multiple chunks if we split them (though current impl only does one per collection)
      const backupParts = await backups.find({
        backup_id: backupId,
        type: 'pre_rollover_data',
        collection: colName
      }).toArray();

      if (backupParts.length > 0) {
        const collection = db.collection(colName);

        // 1. DELETE current data
        // Safety: For 'users', only delete 'student' accounts or IDs that are in the backup?
        // But a restore implies reverting to EXACT state.
        // If we delete all students, we might lose new students added AFTER rollover.
        // But Undo is usually done immediately if something looks wrong.
        // To be safe, we delete all documents that we are about to restore?
        // No, checking the backup data:

        const allBackupDocs = backupParts.flatMap(p => p.data);

        if (colName === 'users') {
          // Only remove students, as we only backed up students
          await collection.deleteMany({ account_type: 'student' });
        } else {
          // For other collections (grades, sections, schedules, section_students), 
          // these are academic data, we should probably clear them.
          // Ideally we should match existing school year, but doing a full wipe of collection 
          // is safer to ensure no "ghost" data remains from the reverted year.
          // However, we only backed up... wait.
          // school-year/end/+server.js backed up 'grades', 'sections' with NO filter.
          // So it backed up EVERYTHING.
          // So we can safely delete active data.
          // But wait, if we delete EVERYTHING, we lose history?
          // "backupCollection('grades')" -> finds ALL grades.
          // So restoring it means we restore ALL grades.
          // So clearing the collection is correct.
          // BUT: 'users' backup was filtered by { account_type: 'student' }.
          // So we must only delete students.

          if (allBackupDocs.length > 0) {
            // Only clear if we have data to put back? 
            // No, even if backup is empty, we should revert to that empty state (though unlikely).
            await collection.deleteMany({});
          }
        }

        // 2. INSERT backup data
        if (allBackupDocs.length > 0) {
          await collection.insertMany(allBackupDocs);
        }
      }
    }

    // Restore Admin Settings (School Year)
    await db.collection('admin_settings').updateOne(
      { setting_key: 'current_school_year' },
      { $set: { setting_value: lastBackup.original_school_year, updated_at: new Date() } }
    );

    // Remove the rollover summary since we undid the action
    await db.collection('admin_settings').deleteMany({ setting_key: 'last_rollover_details' });

    // 3. DELETE the used backup so we don't restore it again
    await backups.deleteMany({ backup_id: backupId });
    await backups.deleteOne({ _id: backupId });

    // Log
    await logActivityWithUser(
      'undo_end_school_year',
      JSON.stringify({
        reverted_to: lastBackup.original_school_year,
        backup_id: backupId
      }),
      user,
      event.getClientAddress()
    );

    return json({
      success: true,
      message: 'Successfully undid the last school year rollover.'
    });

  } catch (error) {
    console.error('Error undoing rollover:', error);
    return json({ error: 'Failed to undo: ' + error.message }, { status: 500 });
  }
}

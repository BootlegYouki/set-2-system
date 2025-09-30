import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';

// GET - Fetch schedules with optional filtering
export async function GET({ url }) {
    try {
        const action = url.searchParams.get('action');
        const sectionId = url.searchParams.get('sectionId');
        const schoolYear = url.searchParams.get('schoolYear') || '2024-2025';
        const dayOfWeek = url.searchParams.get('dayOfWeek');
        const scheduleId = url.searchParams.get('scheduleId');

        switch (action) {
            case 'schedule-details':
                const scheduleDetailsResult = await query(
                    'SELECT * FROM get_schedule_details($1, $2, $3)', 
                    [sectionId ? parseInt(sectionId) : null, schoolYear, dayOfWeek]
                );
                return json({ success: true, data: scheduleDetailsResult.rows });

            case 'single-schedule':
                if (!scheduleId) {
                    return json({ success: false, error: 'Schedule ID is required' }, { status: 400 });
                }
                const singleScheduleResult = await query(`
                    SELECT 
                        sch.id,
                        sch.section_id,
                        sec.name as section_name,
                        sec.grade_level,
                        sch.day_of_week,
                        sch.start_time,
                        sch.end_time,
                        sch.schedule_type,
                        sch.subject_id,
                        sub.name as subject_name,
                        sub.code as subject_code,
                        sch.activity_type_id,
                        act.name as activity_type_name,
                        act.icon as activity_type_icon,
                        sch.teacher_id,
                        u.full_name as teacher_name,
                        u.account_number as teacher_account_number,
                        sch.school_year,
                        sch.created_at,
                        sch.updated_at
                    FROM schedules sch
                    JOIN sections sec ON sch.section_id = sec.id
                    LEFT JOIN subjects sub ON sch.subject_id = sub.id
                    LEFT JOIN activity_types act ON sch.activity_type_id = act.id
                    LEFT JOIN users u ON sch.teacher_id = u.id
                    WHERE sch.id = $1
                `, [parseInt(scheduleId)]);
                
                if (singleScheduleResult.rows.length === 0) {
                    return json({ success: false, error: 'Schedule not found' }, { status: 404 });
                }
                
                return json({ success: true, data: singleScheduleResult.rows[0] });

            case 'section-schedules':
                if (!sectionId) {
                    return json({ success: false, error: 'Section ID is required' }, { status: 400 });
                }
                const sectionSchedulesResult = await query(
                    'SELECT * FROM get_schedule_details($1, $2, NULL)', 
                    [parseInt(sectionId), schoolYear]
                );
                return json({ success: true, data: sectionSchedulesResult.rows });

            case 'teacher-schedules':
                const teacherId = url.searchParams.get('teacherId');
                if (!teacherId) {
                    return json({ success: false, error: 'Teacher ID is required' }, { status: 400 });
                }
                const teacherSchedulesResult = await query(`
                    SELECT 
                        sch.id,
                        sch.section_id,
                        sec.name as section_name,
                        sec.grade_level,
                        sch.day_of_week,
                        sch.start_time,
                        sch.end_time,
                        sch.schedule_type,
                        sch.subject_id,
                        sub.name as subject_name,
                        sub.code as subject_code,
                        sch.activity_type_id,
                        act.name as activity_type_name,
                        sch.school_year
                    FROM schedules sch
                    JOIN sections sec ON sch.section_id = sec.id
                    LEFT JOIN subjects sub ON sch.subject_id = sub.id
                    LEFT JOIN activity_types act ON sch.activity_type_id = act.id
                    WHERE sch.teacher_id = $1 AND sch.school_year = $2
                    ORDER BY sch.day_of_week, sch.start_time
                `, [parseInt(teacherId), schoolYear]);
                return json({ success: true, data: teacherSchedulesResult.rows });

            default:
                // Default: Get all schedules with optional filtering
                const allSchedulesResult = await query(
                    'SELECT * FROM get_schedule_details($1, $2, $3)', 
                    [sectionId ? parseInt(sectionId) : null, schoolYear, dayOfWeek]
                );
                return json({ success: true, data: allSchedulesResult.rows });
        }
    } catch (error) {
        console.error('Error fetching schedules data:', error);
        return json({ success: false, error: 'Failed to fetch schedules data' }, { status: 500 });
    }
}

// POST - Create new schedule
export async function POST({ request, getClientAddress }) {
    try {
        const data = await request.json();
        console.log('Received schedule data:', data);
        
        const { 
            sectionId, 
            dayOfWeek, 
            startTime, 
            endTime, 
            scheduleType, 
            subjectId, 
            activityTypeId, 
            teacherId, 
            schoolYear 
        } = data;

        console.log('Received schedule data:', {
            sectionId,
            dayOfWeek,
            startTime,
            endTime,
            scheduleType,
            subjectId,
            activityTypeId,
            teacherId,
            schoolYear
        });

        const clientIP = getClientAddress();
        const userAgent = request.headers.get('user-agent');

        // Validate required fields
        if (!sectionId || !dayOfWeek || !startTime || !endTime || !scheduleType || !schoolYear) {
            return json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Validate schedule type and corresponding reference
        if (scheduleType === 'subject' && !subjectId) {
            return json({ success: false, error: 'Subject ID is required for subject schedules' }, { status: 400 });
        }
        if (scheduleType === 'activity' && !activityTypeId) {
            return json({ success: false, error: 'Activity Type ID is required for activity schedules' }, { status: 400 });
        }

        // Check for time conflicts
        const conflictResult = await query(`
            SELECT id, start_time, end_time 
            FROM schedules 
            WHERE section_id = $1 
                AND day_of_week = $2 
                AND school_year = $3 
                AND (
                    ($4::time >= start_time AND $4::time < end_time) OR
                    ($5::time > start_time AND $5::time <= end_time) OR
                    ($4::time <= start_time AND $5::time >= end_time)
                )
        `, [parseInt(sectionId), dayOfWeek, schoolYear, startTime, endTime]);

        if (conflictResult.rows.length > 0) {
            return json({ 
                success: false, 
                error: 'Time conflict detected with existing schedule',
                conflictingSchedule: conflictResult.rows[0]
            }, { status: 409 });
        }

        // Start transaction
        await query('BEGIN');

        try {
            // Create schedule
            console.log('About to execute INSERT query with values:', [
                parseInt(sectionId), 
                dayOfWeek, 
                startTime, 
                endTime, 
                scheduleType, 
                subjectId ? parseInt(subjectId) : null, 
                activityTypeId ? parseInt(activityTypeId) : null, 
                teacherId ? parseInt(teacherId) : null, 
                schoolYear
            ]);

            const scheduleResult = await query(`
                INSERT INTO schedules (
                    section_id, 
                    day_of_week, 
                    start_time, 
                    end_time, 
                    schedule_type, 
                    subject_id, 
                    activity_type_id, 
                    teacher_id, 
                    school_year
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, section_id, day_of_week, start_time, end_time, schedule_type, 
                         subject_id, activity_type_id, teacher_id, school_year, created_at
            `, [
                parseInt(sectionId), 
                dayOfWeek, 
                startTime, 
                endTime, 
                scheduleType, 
                subjectId ? parseInt(subjectId) : null, 
                activityTypeId ? parseInt(activityTypeId) : null, 
                teacherId ? parseInt(teacherId) : null, 
                schoolYear
            ]);

            const newSchedule = scheduleResult.rows[0];

            // Log activity
            try {
                const user = await getUserFromRequest(request);
                
                // Only log activity if user is authenticated
                if (user && user.id) {
                    await logActivityWithUser(
                        'schedule_created',
                        user,
                        {
                            schedule_id: newSchedule.id,
                            section_id: newSchedule.section_id,
                            day_of_week: newSchedule.day_of_week,
                            start_time: newSchedule.start_time,
                            end_time: newSchedule.end_time,
                            schedule_type: newSchedule.schedule_type,
                            school_year: newSchedule.school_year
                        },
                        clientIP,
                        userAgent
                    );
                }
            } catch (logError) {
                console.error('Error logging activity:', logError);
                // Don't fail the request if logging fails
            }

            await query('COMMIT');

            return json({
                success: true,
                message: 'Schedule created successfully',
                data: newSchedule
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error creating schedule:', error);
        console.error('Error stack:', error.stack);
        return json({ success: false, error: 'Failed to create schedule', details: error.message }, { status: 500 });
    }
}

// DELETE - Remove schedule
export async function DELETE({ url, request, getClientAddress }) {
    try {
        const scheduleId = url.searchParams.get('id');
        const clientIP = getClientAddress();
        const userAgent = request.headers.get('user-agent');

        if (!scheduleId) {
            return json({ success: false, error: 'Schedule ID is required' }, { status: 400 });
        }

        // Check if schedule exists
        const existingSchedule = await query('SELECT * FROM schedules WHERE id = $1', [parseInt(scheduleId)]);
        if (existingSchedule.rows.length === 0) {
            return json({ success: false, error: 'Schedule not found' }, { status: 404 });
        }

        const scheduleToDelete = existingSchedule.rows[0];

        // Start transaction
        await query('BEGIN');

        try {
            // Delete the schedule
            await query('DELETE FROM schedules WHERE id = $1', [parseInt(scheduleId)]);

            // Log activity
            try {
                const user = await getUserFromRequest(request);
                
                await logActivityWithUser(
                    'schedule_deleted',
                    user,
                    {
                        schedule_id: parseInt(scheduleId),
                        section_id: scheduleToDelete.section_id,
                        day_of_week: scheduleToDelete.day_of_week,
                        start_time: scheduleToDelete.start_time,
                        end_time: scheduleToDelete.end_time,
                        schedule_type: scheduleToDelete.schedule_type
                    },
                    clientIP,
                    userAgent
                );
            } catch (logError) {
                console.error('Error logging activity:', logError);
                // Don't fail the request if logging fails
            }

            await query('COMMIT');

            return json({
                success: true,
                message: 'Schedule deleted successfully'
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error deleting schedule:', error);
        return json({ success: false, error: 'Failed to delete schedule' }, { status: 500 });
    }
}
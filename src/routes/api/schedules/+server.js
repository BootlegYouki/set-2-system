import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
    try {
        const action = url.searchParams.get('action');
        const sectionId = url.searchParams.get('sectionId');
        const teacherId = url.searchParams.get('teacherId');
        const schoolYear = url.searchParams.get('schoolYear');
        const dayOfWeek = url.searchParams.get('dayOfWeek');

        switch (action) {
            case 'get-schedules':
                return await getSchedules(sectionId, teacherId, schoolYear, dayOfWeek);
            
            case 'get-time-periods':
                return await getTimePeriods();
            
            case 'get-available-teachers':
                return await getAvailableTeachers(schoolYear);
            
            case 'get-available-rooms':
                return await getAvailableRooms();
            
            case 'check-conflicts':
                const conflictParams = {
                    teacherId: url.searchParams.get('teacherId'),
                    roomId: url.searchParams.get('roomId'),
                    sectionId: url.searchParams.get('sectionId'),
                    timePeriodId: url.searchParams.get('timePeriodId'),
                    dayOfWeek: url.searchParams.get('dayOfWeek'),
                    schoolYear: url.searchParams.get('schoolYear'),
                    excludeScheduleId: url.searchParams.get('excludeScheduleId')
                };
                return await checkScheduleConflicts(conflictParams);
            
            default:
                return await getSchedules(sectionId, teacherId, schoolYear, dayOfWeek);
        }
    } catch (error) {
        console.error('Error in GET /api/schedules:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'create-schedule':
                return await createSchedule(body);
            
            case 'create-time-period':
                return await createTimePeriod(body);
            
            default:
                // If no action is specified, assume it's a direct schedule creation
                return await createSchedule(body);
        }
    } catch (error) {
        console.error('Error in POST /api/schedules:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'update-schedule':
                return await updateSchedule(body);
            
            case 'update-time-period':
                return await updateTimePeriod(body);
            
            default:
                return json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error in PUT /api/schedules:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
    try {
        const scheduleId = url.searchParams.get('scheduleId');
        const timePeriodId = url.searchParams.get('timePeriodId');

        if (scheduleId) {
            return await deleteSchedule(scheduleId);
        } else if (timePeriodId) {
            return await deleteTimePeriod(timePeriodId);
        } else {
            return json({ error: 'Missing required parameter' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error in DELETE /api/schedules:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper functions
async function getSchedules(sectionId, teacherId, schoolYear, dayOfWeek) {
    // Since the function has issues, let's use a direct query for now
    const result = await query(`
        SELECT 
            sch.id,
            sch.section_id,
            sec.name as section_name,
            sec.grade_level as section_grade_level,
            sch.subject_id,
            sub.name as subject_name,
            sub.code as subject_code,
            sch.teacher_id,
            u.full_name as teacher_name,
            u.account_number as teacher_account_number,
            sch.room_id,
            COALESCE(r.name, '') as room_name,
            COALESCE(r.building, '') as room_building,
            COALESCE(r.floor, '') as room_floor,
            sch.time_period_id,
            tp.name as time_period_name,
            tp.start_time,
            tp.end_time,
            tp.duration_minutes,
            sch.day_of_week,
            CASE sch.day_of_week
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
            END as day_name,
            sch.school_year,
            sch.status,
            sch.created_at,
            sch.updated_at
        FROM schedules sch
        JOIN sections sec ON sch.section_id = sec.id
        JOIN subjects sub ON sch.subject_id = sub.id
        JOIN users u ON sch.teacher_id = u.id
        LEFT JOIN rooms r ON sch.room_id = r.id
        JOIN time_periods tp ON sch.time_period_id = tp.id
        WHERE ($1::integer IS NULL OR sch.section_id = $1::integer)
            AND ($2::integer IS NULL OR sch.teacher_id = $2::integer)
            AND ($3::text IS NULL OR sch.school_year = $3::text)
            AND ($4::integer IS NULL OR sch.day_of_week = $4::integer)
            AND sch.status = 'active'
            AND sec.status = 'active'
            AND u.status = 'active'
            AND tp.is_active = true
        ORDER BY sch.day_of_week, tp.start_time, sec.grade_level, sec.name
    `, [
        sectionId ? parseInt(sectionId) : null,
        teacherId ? parseInt(teacherId) : null,
        schoolYear,
        dayOfWeek ? parseInt(dayOfWeek) : null
    ]);
    
    return json({ schedules: result.rows });
}

async function getTimePeriods() {
    const result = await query(
        'SELECT * FROM time_periods WHERE is_active = true ORDER BY start_time'
    );
    
    return json({ timePeriods: result.rows });
}

async function getAvailableTeachers(schoolYear) {
    const result = await query(`
        SELECT DISTINCT u.id, u.full_name, u.account_number, s.name as subject_name, s.code as subject_code
        FROM users u
        JOIN subjects s ON u.subject_id = s.id
        WHERE u.account_type = 'teacher' 
            AND u.status = 'active'
            AND s.status = 'active'
        ORDER BY u.full_name
    `);
    
    return json({ teachers: result.rows });
}

async function getAvailableRooms() {
    const result = await query(`
        SELECT id, name, building, floor, capacity, status
        FROM rooms 
        WHERE status = 'available'
        ORDER BY building, floor, name
    `);
    
    return json({ rooms: result.rows });
}

async function checkScheduleConflicts({ teacherId, roomId, sectionId, timePeriodId, dayOfWeek, schoolYear, excludeScheduleId }) {
    const result = await query(
        'SELECT * FROM check_schedule_conflicts($1, $2, $3, $4, $5, $6, $7)',
        [
            teacherId ? parseInt(teacherId) : null,
            roomId ? parseInt(roomId) : null,
            sectionId ? parseInt(sectionId) : null,
            timePeriodId ? parseInt(timePeriodId) : null,
            dayOfWeek ? parseInt(dayOfWeek) : null,
            schoolYear,
            excludeScheduleId ? parseInt(excludeScheduleId) : null
        ]
    );
    
    return json({ conflicts: result.rows });
}

async function createSchedule({ sectionId, subjectId, teacherId, roomId, timePeriodId, dayOfWeek, schoolYear }) {
    // First check for conflicts
    const conflictResult = await query(
        'SELECT * FROM check_schedule_conflicts($1, $2, $3, $4, $5, $6, NULL)',
        [teacherId, roomId, sectionId, timePeriodId, dayOfWeek, schoolYear]
    );
    
    if (conflictResult.rows.length > 0) {
        return json({ 
            error: 'Schedule conflict detected', 
            conflicts: conflictResult.rows 
        }, { status: 409 });
    }

    // Create the schedule
    const result = await query(`
        INSERT INTO schedules (section_id, subject_id, teacher_id, room_id, time_period_id, day_of_week, school_year)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [sectionId, subjectId, teacherId, roomId, timePeriodId, dayOfWeek, schoolYear]);

    // Log the activity
    await query(`
        INSERT INTO activity_logs (user_id, action, details, timestamp)
        VALUES ($1, 'schedule_created', $2, NOW())
    `, [
        teacherId, // Using teacher_id as the user who got the schedule
        JSON.stringify({
            schedule_id: result.rows[0].id,
            section_id: sectionId,
            subject_id: subjectId,
            teacher_id: teacherId,
            room_id: roomId,
            time_period_id: timePeriodId,
            day_of_week: dayOfWeek,
            school_year: schoolYear
        })
    ]);

    return json({ 
        message: 'Schedule created successfully', 
        schedule: result.rows[0] 
    });
}

async function updateSchedule({ scheduleId, sectionId, subjectId, teacherId, roomId, timePeriodId, dayOfWeek, schoolYear }) {
    // First check for conflicts (excluding current schedule)
    const conflictResult = await query(
        'SELECT * FROM check_schedule_conflicts($1, $2, $3, $4, $5, $6, $7)',
        [teacherId, roomId, sectionId, timePeriodId, dayOfWeek, schoolYear, scheduleId]
    );
    
    if (conflictResult.rows.length > 0) {
        return json({ 
            error: 'Schedule conflict detected', 
            conflicts: conflictResult.rows 
        }, { status: 409 });
    }

    // Update the schedule
    const result = await query(`
        UPDATE schedules 
        SET section_id = $1, subject_id = $2, teacher_id = $3, room_id = $4, 
            time_period_id = $5, day_of_week = $6, school_year = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
    `, [sectionId, subjectId, teacherId, roomId, timePeriodId, dayOfWeek, schoolYear, scheduleId]);

    if (result.rows.length === 0) {
        return json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Log the activity
    await query(`
        INSERT INTO activity_logs (user_id, action, details, timestamp)
        VALUES ($1, 'schedule_updated', $2, NOW())
    `, [
        teacherId,
        JSON.stringify({
            schedule_id: scheduleId,
            section_id: sectionId,
            subject_id: subjectId,
            teacher_id: teacherId,
            room_id: roomId,
            time_period_id: timePeriodId,
            day_of_week: dayOfWeek,
            school_year: schoolYear
        })
    ]);

    return json({ 
        message: 'Schedule updated successfully', 
        schedule: result.rows[0] 
    });
}

async function deleteSchedule(scheduleId) {
    const result = await query(`
        UPDATE schedules 
        SET status = 'inactive', updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `, [scheduleId]);

    if (result.rows.length === 0) {
        return json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Log the activity
    await query(`
        INSERT INTO activity_logs (user_id, action, details, timestamp)
        VALUES ($1, 'schedule_deleted', $2, NOW())
    `, [
        result.rows[0].teacher_id,
        JSON.stringify({
            schedule_id: scheduleId,
            section_id: result.rows[0].section_id,
            teacher_id: result.rows[0].teacher_id
        })
    ]);

    return json({ message: 'Schedule deleted successfully' });
}

async function createTimePeriod({ name, startTime, endTime }) {
    // Check if time period already exists
    const existingResult = await query(
        'SELECT id FROM time_periods WHERE name = $1 AND start_time = $2 AND end_time = $3',
        [name, startTime, endTime]
    );

    if (existingResult.rows.length > 0) {
        return json({ error: 'Time period already exists' }, { status: 409 });
    }

    const result = await query(`
        INSERT INTO time_periods (name, start_time, end_time)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [name, startTime, endTime]);

    return json({ 
        message: 'Time period created successfully', 
        timePeriod: result.rows[0] 
    });
}

async function updateTimePeriod({ timePeriodId, name, startTime, endTime, isActive }) {
    const result = await query(`
        UPDATE time_periods 
        SET name = $1, start_time = $2, end_time = $3, is_active = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
    `, [name, startTime, endTime, isActive, timePeriodId]);

    if (result.rows.length === 0) {
        return json({ error: 'Time period not found' }, { status: 404 });
    }

    return json({ 
        message: 'Time period updated successfully', 
        timePeriod: result.rows[0] 
    });
}

async function deleteTimePeriod(timePeriodId) {
    // Check if time period is being used in any active schedules
    const usageResult = await query(
        'SELECT COUNT(*) as count FROM schedules WHERE time_period_id = $1 AND status = $2',
        [timePeriodId, 'active']
    );

    if (parseInt(usageResult.rows[0].count) > 0) {
        return json({ 
            error: 'Cannot delete time period that is being used in active schedules' 
        }, { status: 409 });
    }

    const result = await query(`
        UPDATE time_periods 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `, [timePeriodId]);

    if (result.rows.length === 0) {
        return json({ error: 'Time period not found' }, { status: 404 });
    }

    return json({ message: 'Time period deleted successfully' });
}
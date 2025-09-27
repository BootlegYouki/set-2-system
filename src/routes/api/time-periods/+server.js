import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    try {
        const includeInactive = url.searchParams.get('includeInactive') === 'true';
        
        let sql = 'SELECT * FROM time_periods';
        let params = [];
        
        if (!includeInactive) {
            sql += ' WHERE is_active = true';
        }
        
        sql += ' ORDER BY start_time';
        
        const result = await query(sql, params);
        
        return json({ timePeriods: result.rows });
    } catch (error) {
        console.error('Error in GET /api/time-periods:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { name, startTime, endTime } = await request.json();
        
        // Validate required fields
        if (!name || !startTime || !endTime) {
            return json({ error: 'Name, start time, and end time are required' }, { status: 400 });
        }
        
        // Validate time format and order
        if (startTime >= endTime) {
            return json({ error: 'Start time must be before end time' }, { status: 400 });
        }
        
        // Check if time period already exists
        const existingResult = await query(
            'SELECT id FROM time_periods WHERE name = $1 AND start_time = $2 AND end_time = $3',
            [name, startTime, endTime]
        );

        if (existingResult.rows.length > 0) {
            return json({ error: 'Time period already exists' }, { status: 409 });
        }

        // Check for overlapping time periods
        const overlapResult = await query(`
            SELECT id, name FROM time_periods 
            WHERE is_active = true 
                AND (
                    (start_time <= $1 AND end_time > $1) OR
                    (start_time < $2 AND end_time >= $2) OR
                    (start_time >= $1 AND end_time <= $2)
                )
        `, [startTime, endTime]);

        if (overlapResult.rows.length > 0) {
            return json({ 
                error: 'Time period overlaps with existing period', 
                conflictingPeriod: overlapResult.rows[0] 
            }, { status: 409 });
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
    } catch (error) {
        console.error('Error in POST /api/time-periods:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
    try {
        const { id, name, startTime, endTime, isActive } = await request.json();
        
        // Validate required fields
        if (!id || !name || !startTime || !endTime) {
            return json({ error: 'ID, name, start time, and end time are required' }, { status: 400 });
        }
        
        // Validate time format and order
        if (startTime >= endTime) {
            return json({ error: 'Start time must be before end time' }, { status: 400 });
        }
        
        // Check for overlapping time periods (excluding current one)
        const overlapResult = await query(`
            SELECT id, name FROM time_periods 
            WHERE is_active = true 
                AND id != $1
                AND (
                    (start_time <= $2 AND end_time > $2) OR
                    (start_time < $3 AND end_time >= $3) OR
                    (start_time >= $2 AND end_time <= $3)
                )
        `, [id, startTime, endTime]);

        if (overlapResult.rows.length > 0) {
            return json({ 
                error: 'Time period overlaps with existing period', 
                conflictingPeriod: overlapResult.rows[0] 
            }, { status: 409 });
        }

        const result = await query(`
            UPDATE time_periods 
            SET name = $1, start_time = $2, end_time = $3, is_active = $4, updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `, [name, startTime, endTime, isActive !== undefined ? isActive : true, id]);

        if (result.rows.length === 0) {
            return json({ error: 'Time period not found' }, { status: 404 });
        }

        return json({ 
            message: 'Time period updated successfully', 
            timePeriod: result.rows[0] 
        });
    } catch (error) {
        console.error('Error in PUT /api/time-periods:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
    try {
        const id = url.searchParams.get('id');
        
        if (!id) {
            return json({ error: 'Time period ID is required' }, { status: 400 });
        }
        
        // Check if time period is being used in any active schedules
        const usageResult = await query(
            'SELECT COUNT(*) as count FROM schedules WHERE time_period_id = $1 AND status = $2',
            [id, 'active']
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
        `, [id]);

        if (result.rows.length === 0) {
            return json({ error: 'Time period not found' }, { status: 404 });
        }

        return json({ message: 'Time period deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/time-periods:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
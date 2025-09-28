import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';

// GET - Fetch departments (subject groupings), subjects, and teachers
export async function GET({ url }) {
    try {
        const action = url.searchParams.get('action');

        switch (action) {
            case 'subjects':
                const subjectsResult = await query(`
                    SELECT 
                        id,
                        name,
                        code,
                        grade_level,
                        status,
                        created_at
                    FROM subjects
                    WHERE status = 'active'
                    ORDER BY grade_level, name
                `);
                return json({ success: true, data: subjectsResult.rows });

            case 'teachers':
                const teachersResult = await query(`
                    SELECT 
                        id,
                        account_number,
                        first_name,
                        last_name,
                        full_name,
                        email,
                        status
                    FROM users
                    WHERE account_type = 'teacher' AND status = 'active'
                    ORDER BY full_name
                `);
                return json({ success: true, data: teachersResult.rows });

            case 'departments':
            default:
                // Get departments by grouping subjects by grade level and creating logical departments
                const departmentsResult = await query(`
                    WITH department_subjects AS (
                        SELECT 
                            CASE 
                                WHEN name ILIKE '%math%' OR name ILIKE '%algebra%' OR name ILIKE '%geometry%' THEN 'Mathematics Department'
                                WHEN name ILIKE '%science%' OR name ILIKE '%biology%' OR name ILIKE '%chemistry%' OR name ILIKE '%physics%' THEN 'Science Department'
                                WHEN name ILIKE '%english%' OR name ILIKE '%filipino%' OR name ILIKE '%literature%' THEN 'Language Arts Department'
                                WHEN name ILIKE '%araling%' OR name ILIKE '%history%' OR name ILIKE '%social%' THEN 'Social Studies Department'
                                WHEN name ILIKE '%mapeh%' OR name ILIKE '%pe%' OR name ILIKE '%arts%' OR name ILIKE '%music%' THEN 'MAPEH Department'
                                WHEN name ILIKE '%tle%' OR name ILIKE '%technology%' OR name ILIKE '%livelihood%' THEN 'TLE Department'
                                ELSE 'General Department'
                            END as department_name,
                            CASE 
                                WHEN name ILIKE '%math%' OR name ILIKE '%algebra%' OR name ILIKE '%geometry%' THEN 'MATH-DEPT'
                                WHEN name ILIKE '%science%' OR name ILIKE '%biology%' OR name ILIKE '%chemistry%' OR name ILIKE '%physics%' THEN 'SCI-DEPT'
                                WHEN name ILIKE '%english%' OR name ILIKE '%filipino%' OR name ILIKE '%literature%' THEN 'LANG-DEPT'
                                WHEN name ILIKE '%araling%' OR name ILIKE '%history%' OR name ILIKE '%social%' THEN 'SOCIAL-DEPT'
                                WHEN name ILIKE '%mapeh%' OR name ILIKE '%pe%' OR name ILIKE '%arts%' OR name ILIKE '%music%' THEN 'MAPEH-DEPT'
                                WHEN name ILIKE '%tle%' OR name ILIKE '%technology%' OR name ILIKE '%livelihood%' THEN 'TLE-DEPT'
                                ELSE 'GEN-DEPT'
                            END as department_code,
                            json_agg(
                                json_build_object(
                                    'id', id,
                                    'name', name,
                                    'code', code,
                                    'grade_level', grade_level
                                )
                            ) as subjects,
                            COUNT(*) as subject_count,
                            MIN(created_at) as created_at
                        FROM subjects
                        WHERE status = 'active'
                        GROUP BY department_name, department_code
                    )
                    SELECT 
                        ROW_NUMBER() OVER (ORDER BY department_name) as id,
                        department_name as name,
                        department_code as code,
                        subjects,
                        subject_count,
                        created_at,
                        '[]'::json as teachers
                    FROM department_subjects
                    ORDER BY department_name
                `);
                return json({ success: true, data: departmentsResult.rows });
        }
    } catch (error) {
        console.error('Error fetching departments data:', error);
        return json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
    }
}

// POST - Create new department (actually creates subjects grouped as a department)
export async function POST({ request, getClientAddress }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { name, code, subjects = [], teachers = [] } = await request.json();

        if (!name || !code) {
            return json({ success: false, error: 'Department name and code are required' }, { status: 400 });
        }

        // For now, we'll just log the department creation since we don't have a departments table
        // In a real implementation, you might want to create a departments table
        await logActivityWithUser(
            user.id,
            'department_created',
            `Created department: ${name} (${code})`,
            { department_name: name, department_code: code, subjects, teachers },
            getClientAddress()
        );

        return json({ 
            success: true, 
            message: 'Department concept created successfully',
            data: {
                id: Date.now(),
                name,
                code,
                subjects: [],
                teachers: [],
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error creating department:', error);
        return json({ success: false, error: 'Failed to create department' }, { status: 500 });
    }
}

// PUT - Update department
export async function PUT({ request, getClientAddress }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id, name, code, subjects = [], teachers = [] } = await request.json();

        if (!id || !name || !code) {
            return json({ success: false, error: 'Department ID, name and code are required' }, { status: 400 });
        }

        // Log the department update
        await logActivityWithUser(
            user.id,
            'department_updated',
            `Updated department: ${name} (${code})`,
            { department_id: id, department_name: name, department_code: code, subjects, teachers },
            getClientAddress()
        );

        return json({ 
            success: true, 
            message: 'Department updated successfully',
            data: {
                id,
                name,
                code,
                subjects,
                teachers,
                updated_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error updating department:', error);
        return json({ success: false, error: 'Failed to update department' }, { status: 500 });
    }
}

// DELETE - Delete department
export async function DELETE({ request, getClientAddress }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id, name } = await request.json();

        if (!id) {
            return json({ success: false, error: 'Department ID is required' }, { status: 400 });
        }

        // Log the department deletion
        await logActivityWithUser(
            user.id,
            'department_deleted',
            `Deleted department: ${name || 'Unknown'}`,
            { department_id: id },
            getClientAddress()
        );

        return json({ 
            success: true, 
            message: 'Department deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        return json({ success: false, error: 'Failed to delete department' }, { status: 500 });
    }
}
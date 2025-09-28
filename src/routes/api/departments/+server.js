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
                        s.id,
                        s.name,
                        s.code,
                        s.grade_level,
                        s.created_at,
                        s.department_id,
                        d.name as department_name,
                        d.code as department_code
                    FROM subjects s
                    LEFT JOIN departments d ON s.department_id = d.id
                    ORDER BY s.grade_level, s.name
                `);
                return json({ success: true, data: subjectsResult.rows });

            case 'teachers':
                const teachersResult = await query(`
                    SELECT 
                        u.id,
                        u.account_number,
                        u.first_name,
                        u.last_name,
                        u.full_name,
                        u.email,
                        u.status,
                        COALESCE(
                            json_agg(
                                CASE WHEN d.id IS NOT NULL THEN
                                    json_build_object(
                                        'id', d.id,
                                        'name', d.name,
                                        'code', d.code
                                    )
                                END
                            ) FILTER (WHERE d.id IS NOT NULL), 
                            '[]'::json
                        ) as departments
                    FROM users u
                    LEFT JOIN teacher_departments td ON u.id = td.teacher_id
                    LEFT JOIN departments d ON td.department_id = d.id
                    WHERE u.account_type = 'teacher' AND u.status = 'active'
                    GROUP BY u.id, u.account_number, u.first_name, u.last_name, u.full_name, u.email, u.status
                    ORDER BY u.full_name
                `);
                return json({ success: true, data: teachersResult.rows });

            case 'departments':
            default:
                // Get departments from the real departments table with their subjects and teachers
                const departmentsResult = await query(`
                    SELECT 
                        d.id,
                        d.name,
                        d.code,
                        d.status,
                        d.created_at,
                        COALESCE(
                            json_agg(
                                CASE WHEN s.id IS NOT NULL THEN
                                    json_build_object(
                                        'id', s.id,
                                        'name', s.name,
                                        'code', s.code,
                                        'grade_level', s.grade_level
                                    )
                                END
                            ) FILTER (WHERE s.id IS NOT NULL), 
                            '[]'::json
                        ) as subjects,
                        (
                            SELECT COUNT(DISTINCT s2.id) 
                            FROM subjects s2 
                            WHERE s2.department_id = d.id
                        ) as subject_count,
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', u.id,
                                        'full_name', u.full_name,
                                        'account_number', u.account_number
                                    )
                                )
                                FROM teacher_departments td
                                JOIN users u ON td.teacher_id = u.id
                                WHERE td.department_id = d.id AND u.status = 'active'
                            ),
                            '[]'::json
                        ) as teachers,
                        (
                            SELECT COUNT(DISTINCT td2.teacher_id) 
                            FROM teacher_departments td2
                            JOIN users u2 ON td2.teacher_id = u2.id
                            WHERE td2.department_id = d.id AND u2.status = 'active'
                        ) as teacher_count
                    FROM departments d
                    LEFT JOIN subjects s ON d.id = s.department_id
                    WHERE d.status = 'active'
                    GROUP BY d.id, d.name, d.code, d.status, d.created_at
                    ORDER BY d.name
                `);
                return json({ success: true, data: departmentsResult.rows });
        }
    } catch (error) {
        console.error('Error fetching departments data:', error);
        return json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
    }
}

// POST - Create new department
export async function POST({ request, getClientAddress }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { name, code, teachers = [] } = await request.json();

        if (!name || !code) {
            return json({ success: false, error: 'Department name and code are required' }, { status: 400 });
        }

        // Create the department in the database
        const departmentResult = await query(`
            INSERT INTO departments (name, code, status)
            VALUES ($1, $2, 'active')
            RETURNING id, name, code, status, created_at
        `, [name, code]);

        const newDepartment = departmentResult.rows[0];

        // Assign teachers to the department if provided
        if (teachers.length > 0) {
            const assignedTeachers = [];
            for (const teacherId of teachers) {
                await query(`
                    INSERT INTO teacher_departments (teacher_id, department_id)
                    VALUES ($1, $2)
                    ON CONFLICT (teacher_id, department_id) DO NOTHING
                `, [teacherId, newDepartment.id]);
                
                // Get teacher info for logging
                const teacherInfo = await query(`
                    SELECT id, full_name, account_number FROM users WHERE id = $1
                `, [teacherId]);
                if (teacherInfo.rows.length > 0) {
                    assignedTeachers.push(teacherInfo.rows[0]);
                }
            }

            // Log teacher assignments if any were made
            if (assignedTeachers.length > 0) {
                try {
                    await logActivityWithUser(
                        'department_teacher_assigned',
                        user,
                        { 
                            department_id: newDepartment.id, 
                            department_name: name, 
                            department_code: code,
                            teachers: assignedTeachers
                        },
                        getClientAddress(),
                        request.headers.get('user-agent')
                    );
                } catch (logError) {
                    console.error('Error logging teacher assignment activity:', logError);
                }
            }
        }

        // Log the department creation
        try {
            await logActivityWithUser(
                'department_created',
                user,
                { department_id: newDepartment.id, department_name: name, department_code: code, teachers },
                getClientAddress(),
                request.headers.get('user-agent')
            );
        } catch (logError) {
            console.error('Error logging department creation activity:', logError);
        }

        return json({ 
            success: true, 
            message: 'Department created successfully',
            data: {
                ...newDepartment,
                subjects: [],
                teachers: [],
                subject_count: 0
            }
        });
    } catch (error) {
        console.error('Error creating department:', error);
        if (error.code === '23505') { // Unique constraint violation
            // Check which constraint was violated by examining the error detail
            if (error.detail && error.detail.includes('name')) {
                return json({ success: false, error: 'Department name already exists' }, { status: 400 });
            } else if (error.detail && error.detail.includes('code')) {
                return json({ success: false, error: 'Department code already exists' }, { status: 400 });
            } else {
                return json({ success: false, error: 'Department name or code already exists' }, { status: 400 });
            }
        }
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

        const requestBody = await request.json();
        
        const { id, name, code, teachers = [], subjects = [] } = requestBody;

        if (!id || !name || !code) {
            return json({ success: false, error: 'Department ID, name and code are required' }, { status: 400 });
        }

        // Validate department code length (database limit is 20 characters)
        if (code.length > 20) {
            return json({ success: false, error: 'Department code cannot exceed 20 characters' }, { status: 400 });
        }

        // Validate department name length (database limit is 100 characters)
        if (name.length > 100) {
            return json({ success: false, error: 'Department name cannot exceed 100 characters' }, { status: 400 });
        }

        // Get current department info to check if name or code changed
        const currentDeptResult = await query(`
            SELECT name, code FROM departments WHERE id = $1 AND status = 'active'
        `, [id]);

        if (currentDeptResult.rows.length === 0) {
            return json({ success: false, error: 'Department not found' }, { status: 404 });
        }

        const currentDept = currentDeptResult.rows[0];
        const nameChanged = currentDept.name !== name;
        const codeChanged = currentDept.code !== code;
        const basicInfoChanged = nameChanged || codeChanged;

        // Update the department in the database
        const departmentResult = await query(`
            UPDATE departments 
            SET name = $1, code = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND status = 'active'
            RETURNING id, name, code, status, created_at, updated_at
        `, [name, code, id]);

        const updatedDepartment = departmentResult.rows[0];

        // Update teacher assignments
        // First, get current teacher assignments for logging
        const currentTeachersResult = await query(`
            SELECT u.id, u.full_name, u.account_number
            FROM teacher_departments td
            JOIN users u ON td.teacher_id = u.id
            WHERE td.department_id = $1
        `, [id]);
        const currentTeachers = currentTeachersResult.rows;

        // Remove all existing teacher assignments for this department
        await query(`
            DELETE FROM teacher_departments 
            WHERE department_id = $1
        `, [id]);

        // Log teacher removals if any existed
        if (currentTeachers.length > 0) {
            try {
                await logActivityWithUser(
                    'department_teacher_removed',
                    user,
                    { 
                        department_id: id, 
                        department_name: name, 
                        department_code: code,
                        teachers: currentTeachers
                    },
                    getClientAddress(),
                    request.headers.get('user-agent')
                );
            } catch (logError) {
                console.error('Error logging teacher removal activity:', logError);
            }
        }

        // Then add the new teacher assignments
        if (teachers.length > 0) {
            const newTeachers = [];
            for (const teacherId of teachers) {
                await query(`
                    INSERT INTO teacher_departments (teacher_id, department_id)
                    VALUES ($1, $2)
                `, [teacherId, id]);
                
                // Get teacher info for logging
                const teacherInfo = await query(`
                    SELECT id, full_name, account_number FROM users WHERE id = $1
                `, [teacherId]);
                if (teacherInfo.rows.length > 0) {
                    newTeachers.push(teacherInfo.rows[0]);
                }
            }

            // Log teacher assignments
            try {
                await logActivityWithUser(
                    'department_teacher_assigned',
                    user,
                    { 
                        department_id: id, 
                        department_name: name, 
                        department_code: code,
                        teachers: newTeachers
                    },
                    getClientAddress(),
                    request.headers.get('user-agent')
                );
            } catch (logError) {
                console.error('Error logging teacher assignment activity:', logError);
            }
        }

        // Update subject assignments
        // First, get current subject assignments for logging
        const currentSubjectsResult = await query(`
            SELECT id, name, code FROM subjects WHERE department_id = $1
        `, [id]);
        const currentSubjects = currentSubjectsResult.rows;

        // Update all subjects that were previously assigned to this department to have no department
        await query(`
            UPDATE subjects 
            SET department_id = NULL 
            WHERE department_id = $1
        `, [id]);

        // Log subject removals if any existed
        if (currentSubjects.length > 0) {
            try {
                await logActivityWithUser(
                    'department_subject_removed',
                    user,
                    { 
                        department_id: id, 
                        department_name: name, 
                        department_code: code,
                        subjects: currentSubjects
                    },
                    getClientAddress(),
                    request.headers.get('user-agent')
                );
            } catch (logError) {
                console.error('Error logging subject removal activity:', logError);
            }
        }

        // Then assign the selected subjects to this department
        if (subjects.length > 0) {
            const newSubjects = [];
            for (const subjectId of subjects) {
                await query(`
                    UPDATE subjects 
                    SET department_id = $1 
                    WHERE id = $2
                `, [id, subjectId]);
                
                // Get subject info for logging
                const subjectInfo = await query(`
                    SELECT id, name, code FROM subjects WHERE id = $1
                `, [subjectId]);
                if (subjectInfo.rows.length > 0) {
                    newSubjects.push(subjectInfo.rows[0]);
                }
            }

            // Log subject assignments
            try {
                await logActivityWithUser(
                    'department_subject_assigned',
                    user,
                    { 
                        department_id: id, 
                        department_name: name, 
                        department_code: code,
                        subjects: newSubjects
                    },
                    getClientAddress(),
                    request.headers.get('user-agent')
                );
            } catch (logError) {
                console.error('Error logging subject assignment activity:', logError);
            }
        }

        // Log the department update only if basic info (name or code) changed
        if (basicInfoChanged) {
            try {
                await logActivityWithUser(
                    'department_updated',
                    user,
                    { department_id: id, department_name: name, department_code: code },
                    getClientAddress(),
                    request.headers.get('user-agent')
                );
            } catch (logError) {
                console.error('Error logging department update activity:', logError);
            }
        }

        return json({ 
            success: true, 
            message: 'Department updated successfully',
            data: updatedDepartment
        });
    } catch (error) {
        console.error('Error updating department:', error);
        if (error.code === '23505') { // Unique constraint violation
            // Check which constraint was violated by examining the error detail
            if (error.detail && error.detail.includes('name')) {
                return json({ success: false, error: 'Department name already exists' }, { status: 400 });
            } else if (error.detail && error.detail.includes('code')) {
                return json({ success: false, error: 'Department code already exists' }, { status: 400 });
            } else {
                return json({ success: false, error: 'Department name or code already exists' }, { status: 400 });
            }
        }
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

        const { id } = await request.json();

        if (!id) {
            return json({ success: false, error: 'Department ID is required' }, { status: 400 });
        }

        // Get department info before deletion for logging
        const departmentInfo = await query(`
            SELECT name, code FROM departments WHERE id = $1
        `, [id]);

        if (departmentInfo.rows.length === 0) {
            return json({ success: false, error: 'Department not found' }, { status: 404 });
        }

        const department = departmentInfo.rows[0];

        // Check if department has subjects assigned
        const subjectsCount = await query(`
            SELECT COUNT(*) as count FROM subjects WHERE department_id = $1
        `, [id]);

        // If department has subjects, set their department_id to NULL instead of blocking deletion
        if (parseInt(subjectsCount.rows[0].count) > 0) {
            await query(`
                UPDATE subjects SET department_id = NULL WHERE department_id = $1
            `, [id]);
        }

        // Delete teacher assignments first (due to foreign key constraints)
        await query(`
            DELETE FROM teacher_departments WHERE department_id = $1
        `, [id]);

        // Hard delete the department from the database
        await query(`
            DELETE FROM departments WHERE id = $1
        `, [id]);

        // Log the department deletion
        try {
            await logActivityWithUser(
                'department_deleted',
                user,
                { department_id: id, department_name: department.name, department_code: department.code },
                getClientAddress(),
                request.headers.get('user-agent')
            );
        } catch (logError) {
            console.error('Error logging department deletion activity:', logError);
        }

        return json({ 
            success: true, 
            message: 'Department deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        return json({ success: false, error: 'Failed to delete department' }, { status: 500 });
    }
}
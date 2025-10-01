import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';

// GET - Fetch sections, available teachers, and available students
export async function GET({ url }) {
    try {
        const action = url.searchParams.get('action');
        const gradeLevel = url.searchParams.get('gradeLevel');
        const schoolYear = url.searchParams.get('schoolYear') || '2024-2025';
        const sectionId = url.searchParams.get('sectionId');

        switch (action) {
            case 'available-sections':
                const sectionsResult = await query(`
                    SELECT 
                        id,
                        name,
                        grade_level,
                        school_year,
                        status,
                        room_id
                    FROM sections
                    WHERE status = 'active'
                    ORDER BY grade_level, name
                `);
                return json({ success: true, data: sectionsResult.rows });

            case 'available-rooms':
                const roomsResult = await query(`
                    SELECT 
                        r.id,
                        r.name,
                        r.building,
                        r.floor,
                        r.status,
                        CASE 
                            WHEN COUNT(s.id) > 0 THEN false
                            ELSE true
                        END as available
                    FROM rooms r
                    LEFT JOIN sections s ON r.id = s.room_id AND s.status = 'active'
                    GROUP BY r.id, r.name, r.building, r.floor, r.status
                    ORDER BY r.building, r.floor, r.name
                `);
                return json({ success: true, data: roomsResult.rows });

            case 'available-teachers':
                const teacherGradeLevel = url.searchParams.get('teacherGradeLevel');
                const teachersResult = await query('SELECT * FROM get_available_teachers($1, $2)', [teacherGradeLevel ? parseInt(teacherGradeLevel) : null, schoolYear]);
                return json({ success: true, data: teachersResult.rows });

            case 'available-students':
                if (!gradeLevel) {
                    return json({ success: false, error: 'Grade level is required' }, { status: 400 });
                }
                const studentsResult = await query('SELECT * FROM get_available_students($1, $2)', [parseInt(gradeLevel), schoolYear]);
                return json({ success: true, data: studentsResult.rows });

            case 'section-details':
                const sectionDetailsResult = await query('SELECT * FROM get_section_details($1, $2)', [sectionId ? parseInt(sectionId) : null, schoolYear]);
                return json({ success: true, data: sectionDetailsResult.rows });

            case 'section-students':
                if (!sectionId) {
                    return json({ success: false, error: 'Section ID is required' }, { status: 400 });
                }
                const sectionStudentsResult = await query(`
                    SELECT 
                        u.id,
                        u.account_number,
                        u.first_name,
                        u.last_name,
                        u.full_name,
                        u.email,
                        u.grade_level,
                        u.age,
                        u.guardian,
                        ss.enrolled_at,
                        ss.status as enrollment_status
                    FROM section_students ss
                    JOIN users u ON ss.student_id = u.id
                    WHERE ss.section_id = $1 AND ss.status = 'active'
                    ORDER BY u.full_name
                `, [parseInt(sectionId)]);
                return json({ success: true, data: sectionStudentsResult.rows });

            default:
                // Default: Get all sections
                const allSectionsResult = await query('SELECT * FROM get_section_details(NULL, $1)', [schoolYear]);
                return json({ success: true, data: allSectionsResult.rows });
        }
    } catch (error) {
        console.error('Error fetching sections data:', error);
        return json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
    }
}

// POST - Create new section
export async function POST({ request, getClientAddress }) {
    try {
        const { sectionName, gradeLevel, schoolYear, adviserId, studentIds, roomId } = await request.json();
        const clientIP = getClientAddress();
        const userAgent = request.headers.get('user-agent');

        // Validate required fields
        if (!sectionName || !gradeLevel || !schoolYear) {
            return json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Start transaction
        await query('BEGIN');

        try {
            // Create section
            const sectionResult = await query(`
                INSERT INTO sections (name, grade_level, school_year, adviser_id, room_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, name, grade_level, school_year, adviser_id, room_id, created_at
            `, [sectionName, parseInt(gradeLevel), schoolYear, adviserId ? parseInt(adviserId) : null, roomId ? parseInt(roomId) : null]);

            const newSection = sectionResult.rows[0];

            // Add students to section (only if studentIds is provided and not empty)
            if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
                for (const studentId of studentIds) {
                    await query(`
                        INSERT INTO section_students (section_id, student_id)
                        VALUES ($1, $2)
                    `, [newSection.id, parseInt(studentId)]);
                }
            }

            // Update room status if assigned
            if (roomId) {
                await query(`
                    UPDATE rooms 
                    SET status = 'assigned', assigned_to = $1
                    WHERE id = $2
                `, [`${sectionName} (Grade ${gradeLevel})`, parseInt(roomId)]);
            }

            // Log activity
            try {
                // Get user info from request headers
                const user = await getUserFromRequest(request);
                
                await logActivityWithUser(
                    'section_created',
                    user,
                    {
                        section_id: newSection.id,
                        section_name: sectionName,
                        grade_level: parseInt(gradeLevel),
                        school_year: schoolYear,
                        adviser_id: parseInt(adviserId),
                        student_count: studentIds.length,
                        room_id: roomId ? parseInt(roomId) : null
                    },
                    clientIP,
                    userAgent
                );

                // Log individual student enrollments
                for (const studentId of studentIds) {
                    // Get student details for logging
                    const studentResult = await query('SELECT id, full_name, account_number, grade_level FROM users WHERE id = $1', [parseInt(studentId)]);
                    const student = studentResult.rows[0];
                    
                    await logActivityWithUser(
                        'student_enrolled_to_section',
                        user,
                        {
                            section_id: newSection.id,
                            section_name: sectionName,
                            grade_level: parseInt(gradeLevel),
                            school_year: schoolYear,
                            student: {
                                id: student?.id,
                                name: student?.full_name,
                                account_number: student?.account_number,
                                grade_level: student?.grade_level
                            },
                            action: 'enrolled'
                        },
                        clientIP,
                        userAgent
                    );
                }
            } catch (logError) {
                console.error('Error logging section creation activity:', logError);
                // Don't fail the section creation if logging fails
            }

            await query('COMMIT');

            // Get complete section details
            const sectionDetailsResult = await query('SELECT * FROM get_section_details($1, $2)', [newSection.id, schoolYear]);
            
            return json({ 
                success: true, 
                data: sectionDetailsResult.rows[0],
                message: `Section ${sectionName} created successfully with ${studentIds.length} students`
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error creating section:', error);
        return json({ success: false, error: 'Failed to create section' }, { status: 500 });
    }
}

// PUT - Update section
export async function PUT({ request, getClientAddress }) {
    try {
        const { sectionId, sectionName, adviserId, studentIds, roomId } = await request.json();
        const clientIP = getClientAddress();
        const userAgent = request.headers.get('user-agent');

        console.log('=== PUT REQUEST DEBUG ===');
        console.log('Received adviserId:', adviserId);
        console.log('typeof adviserId:', typeof adviserId);
        console.log('adviserId parsed as int:', parseInt(adviserId));
        console.log('Full request data:', { sectionId, sectionName, adviserId, studentIds, roomId });

        if (!sectionId) {
            return json({ success: false, error: 'Section ID is required' }, { status: 400 });
        }

        // Start transaction
        await query('BEGIN');

        try {
            // Get current section data for logging
            const currentSectionResult = await query('SELECT * FROM get_section_details($1, NULL)', [parseInt(sectionId)]);
            const currentSection = currentSectionResult.rows[0];

            if (!currentSection) {
                await query('ROLLBACK');
                return json({ success: false, error: 'Section not found' }, { status: 404 });
            }

            // Update section basic info
            if (sectionName || adviserId || roomId !== undefined) {
                console.log('=== SECTION UPDATE DEBUG ===');
                console.log('Received adviserId:', adviserId);
                console.log('Type of adviserId:', typeof adviserId);
                console.log('Parsed adviserId:', adviserId ? parseInt(adviserId) : null);
                console.log('sectionName:', sectionName);
                console.log('roomId:', roomId);
                console.log('sectionId:', sectionId);
                
                // Build dynamic update query based on what fields are provided
                let updateFields = [];
                let updateValues = [];
                let paramIndex = 1;
                
                if (sectionName) {
                    updateFields.push(`name = $${paramIndex}`);
                    updateValues.push(sectionName);
                    paramIndex++;
                }
                
                if (adviserId !== undefined) {
                    console.log('Adding adviser_id to update fields');
                    updateFields.push(`adviser_id = $${paramIndex}`);
                    updateValues.push(adviserId ? parseInt(adviserId) : null);
                    paramIndex++;
                }
                
                if (roomId !== undefined) {
                    updateFields.push(`room_id = $${paramIndex}`);
                    updateValues.push(roomId ? parseInt(roomId) : null);
                    paramIndex++;
                }
                
                if (updateFields.length > 0) {
                    updateValues.push(parseInt(sectionId)); // Add sectionId as the last parameter
                    
                    const updateQuery = `
                        UPDATE sections 
                        SET ${updateFields.join(', ')}
                        WHERE id = $${paramIndex}
                        RETURNING id, name, adviser_id, room_id
                    `;
                    
                    console.log('Final update query:', updateQuery);
                    console.log('Final update values:', updateValues);
                    
                    const updateResult = await query(updateQuery, updateValues);
                    console.log('Raw update result:', updateResult.rows[0]);
                    
                    // Verify the update actually happened
                    const verifyResult = await query('SELECT id, name, adviser_id, room_id FROM sections WHERE id = $1', [parseInt(sectionId)]);
                    console.log('Verification query result:', verifyResult.rows[0]);
                }
            }

            // Handle student changes if provided
            if (studentIds) {
                // Get current students
                const currentStudentsResult = await query(`
                    SELECT student_id FROM section_students 
                    WHERE section_id = $1 AND status = 'active'
                `, [parseInt(sectionId)]);
                
                const currentStudentIds = currentStudentsResult.rows.map(row => row.student_id);
                const newStudentIds = studentIds.map(id => parseInt(id));

                // Students to remove
                const studentsToRemove = currentStudentIds.filter(id => !newStudentIds.includes(id));
                // Students to add
                const studentsToAdd = newStudentIds.filter(id => !currentStudentIds.includes(id));

                // Remove students
                for (const studentId of studentsToRemove) {
                    await query(`
                        DELETE FROM section_students 
                        WHERE section_id = $1 AND student_id = $2
                    `, [parseInt(sectionId), studentId]);

                    // Log student removal
                    try {
                        const user = await getUserFromRequest(request);
                        
                        // Get student details for logging
                        const studentResult = await query('SELECT id, full_name, account_number, grade_level FROM users WHERE id = $1', [studentId]);
                        const student = studentResult.rows[0];
                        
                        await logActivityWithUser(
                            'student_removed_from_section',
                            user,
                            {
                                section_id: parseInt(sectionId),
                                section_name: currentSection.name,
                                grade_level: currentSection.grade_level,
                                school_year: currentSection.school_year,
                                student: {
                                    id: student?.id,
                                    name: student?.full_name,
                                    account_number: student?.account_number,
                                    grade_level: student?.grade_level
                                },
                                action: 'removed'
                            },
                            clientIP,
                            userAgent
                        );
                    } catch (logError) {
                        console.error('Error logging student removal:', logError);
                    }
                }

                // Add new students
                for (const studentId of studentsToAdd) {
                    await query(`
                        INSERT INTO section_students (section_id, student_id)
                        VALUES ($1, $2)
                        ON CONFLICT (section_id, student_id) 
                        DO UPDATE SET status = 'active', enrolled_at = CURRENT_TIMESTAMP
                    `, [parseInt(sectionId), studentId]);

                    // Log student addition
                    try {
                        const user = await getUserFromRequest(request);
                        
                        // Get student details for logging
                        const studentResult = await query('SELECT id, full_name, account_number, grade_level FROM users WHERE id = $1', [studentId]);
                        const student = studentResult.rows[0];
                        
                        await logActivityWithUser(
                            'student_added_to_section',
                            user,
                            {
                                section_id: parseInt(sectionId),
                                section_name: sectionName || currentSection.name,
                                grade_level: currentSection.grade_level,
                                school_year: currentSection.school_year,
                                student: {
                                    id: student?.id,
                                    name: student?.full_name,
                                    account_number: student?.account_number,
                                    grade_level: student?.grade_level
                                },
                                action: 'added'
                            },
                            clientIP,
                            userAgent
                        );
                    } catch (logError) {
                        console.error('Error logging student addition:', logError);
                    }
                }
            }

            // Update room assignments
            if (roomId !== undefined) {
                // Free up old room if it exists
                if (currentSection.room_id) {
                    await query(`
                        UPDATE rooms 
                        SET status = 'available', assigned_to = NULL
                        WHERE id = $1
                    `, [currentSection.room_id]);
                }

                // Assign new room if provided
                if (roomId) {
                    await query(`
                        UPDATE rooms 
                        SET status = 'assigned', assigned_to = $1
                        WHERE id = $2
                    `, [`${sectionName || currentSection.name} (Grade ${currentSection.grade_level})`, parseInt(roomId)]);
                }
            }

            // Log specific adviser change if it occurred
            if (adviserId && parseInt(adviserId) !== currentSection.adviser_id) {
                try {
                    const user = await getUserFromRequest(request);
                    
                    // Get old and new adviser details
                    const oldAdviserResult = currentSection.adviser_id ? 
                        await query('SELECT id, full_name, account_number FROM users WHERE id = $1', [currentSection.adviser_id]) : 
                        { rows: [] };
                    const newAdviserResult = await query('SELECT id, full_name, account_number FROM users WHERE id = $1', [parseInt(adviserId)]);
                    
                    const oldAdviser = oldAdviserResult.rows[0] || null;
                    const newAdviser = newAdviserResult.rows[0] || null;
                    
                    await logActivityWithUser(
                        'section_adviser_changed',
                        user,
                        {
                            section_id: parseInt(sectionId),
                            section_name: sectionName || currentSection.name,
                            grade_level: currentSection.grade_level,
                            school_year: currentSection.school_year,
                            old_adviser: oldAdviser ? {
                                id: oldAdviser.id,
                                name: oldAdviser.full_name,
                                account_number: oldAdviser.account_number
                            } : null,
                            new_adviser: newAdviser ? {
                                id: newAdviser.id,
                                name: newAdviser.full_name,
                                account_number: newAdviser.account_number
                            } : null
                        },
                        clientIP,
                        userAgent
                    );
                } catch (logError) {
                    console.error('Error logging adviser change:', logError);
                }
            }

            // Log general section update only if there are non-adviser changes
            const hasNameChange = sectionName && sectionName !== currentSection.name;
            const hasRoomChange = roomId !== undefined && parseInt(roomId || 0) !== (currentSection.room_id || 0);
            const hasAdviserChange = adviserId && parseInt(adviserId) !== currentSection.adviser_id;
            
            // Only log general section update if there are name or room changes (adviser changes are logged separately)
            if (hasNameChange || hasRoomChange) {
                try {
                    const user = await getUserFromRequest(request);
                    await logActivityWithUser(
                        'section_updated',
                        user,
                        {
                            section_id: parseInt(sectionId),
                            section_name: sectionName || currentSection.name,
                            grade_level: currentSection.grade_level,
                            school_year: currentSection.school_year,
                            changes: {
                                name_changed: hasNameChange,
                                room_changed: hasRoomChange
                            }
                        },
                        clientIP,
                        userAgent
                    );
                } catch (logError) {
                    console.error('Error logging section update:', logError);
                }
            }

            await query('COMMIT');

            // Get updated section details
            const updatedSectionResult = await query('SELECT * FROM get_section_details($1, NULL)', [parseInt(sectionId)]);
            
            return json({ 
                success: true, 
                data: updatedSectionResult.rows[0],
                message: 'Section updated successfully'
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error updating section:', error);
        return json({ success: false, error: 'Failed to update section' }, { status: 500 });
    }
}

// DELETE - Remove section
export async function DELETE({ url, request, getClientAddress }) {
    try {
        const sectionId = url.searchParams.get('sectionId');
        const clientIP = getClientAddress();
        const userAgent = request.headers.get('user-agent');

        if (!sectionId) {
            return json({ success: false, error: 'Section ID is required' }, { status: 400 });
        }

        // Start transaction
        await query('BEGIN');

        try {
            // Get section details for logging
            const sectionResult = await query('SELECT * FROM get_section_details($1, NULL)', [parseInt(sectionId)]);
            const section = sectionResult.rows[0];

            if (!section) {
                await query('ROLLBACK');
                return json({ success: false, error: 'Section not found' }, { status: 404 });
            }

            // Get students for logging
            const studentsResult = await query(`
                SELECT student_id FROM section_students 
                WHERE section_id = $1 AND status = 'active'
            `, [parseInt(sectionId)]);

            // Free up room if assigned
            if (section.room_id) {
                await query(`
                    UPDATE rooms 
                    SET status = 'available', assigned_to = NULL
                    WHERE id = $1
                `, [section.room_id]);
            }

            // Completely delete section_students records first (CASCADE will handle this, but being explicit)
            await query(`
                DELETE FROM section_students 
                WHERE section_id = $1
            `, [parseInt(sectionId)]);

            // Completely delete the section
            await query(`
                DELETE FROM sections 
                WHERE id = $1
            `, [parseInt(sectionId)]);

            // Log section deletion with proper user attribution
            try {
                // Get user info from request headers
                const user = await getUserFromRequest(request);
                
                await logActivityWithUser(
                    'section_deleted',
                    user,
                    {
                        section_id: parseInt(sectionId),
                        section_name: section.name,
                        grade_level: section.grade_level,
                        school_year: section.school_year,
                        student_count: section.student_count,
                        room_freed: section.room_id ? true : false
                    },
                    clientIP,
                    userAgent
                );

                // Note: Student removal logs are not generated when deleting entire sections
                // as this would create unnecessary noise in the activity log.
                // The section deletion log already indicates that all students were removed.
            } catch (logError) {
                console.error('Error logging section deletion activity:', logError);
                // Don't fail the deletion if logging fails
            }

            await query('COMMIT');

            return json({ 
                success: true, 
                message: `Section ${section.name} has been deleted successfully`
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error deleting section:', error);
        return json({ success: false, error: 'Failed to delete section' }, { status: 500 });
    }
}
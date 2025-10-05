import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

export async function GET({ url }) {
    try {
        const sectionId = url.searchParams.get('sectionId');
        const subjectId = url.searchParams.get('subjectId');
        const teacherId = url.searchParams.get('teacherId');
        const schoolYear = url.searchParams.get('schoolYear') || '2024-2025';
        const verificationOnly = url.searchParams.get('verificationOnly') === 'true';

        if (!sectionId) {
            return json({ 
                success: false, 
                error: 'Section ID is required' 
            }, { status: 400 });
        }

        // First, verify that the teacher has access to this section
        if (teacherId) {
            const accessCheck = await query(`
                SELECT COUNT(*) as count
                FROM schedules sch
                JOIN sections s ON sch.section_id = s.id
                WHERE sch.teacher_id = $1 
                    AND s.id = $2 
                    AND s.school_year = $3
                    AND s.status = 'active'
            `, [parseInt(teacherId), parseInt(sectionId), schoolYear]);

            if (accessCheck.rows[0].count === '0') {
                return json({ 
                    success: false, 
                    error: 'Access denied to this section' 
                }, { status: 403 });
            }
        }

        // If verificationOnly is true, return only student IDs and verification status
        if (verificationOnly && subjectId) {
            const studentsQuery = `
                SELECT 
                    u.id,
                    u.account_number,
                    u.full_name
                FROM section_students ss
                JOIN users u ON ss.student_id = u.id
                WHERE ss.section_id = $1 
                    AND ss.status = 'active'
                ORDER BY u.last_name, u.first_name
            `;

            const studentsResult = await query(studentsQuery, [parseInt(sectionId)]);
            
            const studentsWithVerification = [];
            
            for (const student of studentsResult.rows) {
                // Check if grades are verified by adviser for this student and subject
                const verificationQuery = `
                    SELECT verified
                    FROM final_grades
                    WHERE student_id = $1 
                        AND section_id = $2 
                        AND subject_id = $3
                        AND grading_period_id = 1
                `;
                const verificationResult = await query(verificationQuery, [student.id, parseInt(sectionId), parseInt(subjectId)]);
                const isVerified = verificationResult.rows.length > 0 && verificationResult.rows[0].verified;
                
                studentsWithVerification.push({
                    id: student.account_number || student.id.toString(),
                    name: student.full_name,
                    isVerified: isVerified
                });
            }

            return json({
                success: true,
                data: {
                    students: studentsWithVerification
                }
            });
        }

        // Get section details
        const sectionQuery = `
            SELECT 
                s.id,
                s.name as section_name,
                s.grade_level,
                s.school_year,
                u.first_name as adviser_first_name,
                u.last_name as adviser_last_name,
                r.name as room_name
            FROM sections s
            LEFT JOIN users u ON s.adviser_id = u.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE s.id = $1
        `;

        const sectionResult = await query(sectionQuery, [parseInt(sectionId)]);
        
        if (sectionResult.rows.length === 0) {
            return json({ 
                success: false, 
                error: 'Section not found' 
            }, { status: 404 });
        }

        const sectionInfo = sectionResult.rows[0];

        // Get students in the section with their basic info
        const studentsQuery = `
            SELECT 
                u.id,
                u.account_number,
                u.first_name,
                u.last_name,
                u.full_name,
                u.email,
                u.grade_level,
                ss.enrolled_at,
                ss.status as enrollment_status
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            WHERE ss.section_id = $1 
                AND ss.status = 'active'
            ORDER BY u.last_name, u.first_name
        `;

        const studentsResult = await query(studentsQuery, [parseInt(sectionId)]);

        // Get subjects taught in this section by the teacher (if teacherId provided)
        let subjectsQuery = `
            SELECT DISTINCT 
                sub.id,
                sub.name,
                sub.code
            FROM schedules sch
            JOIN subjects sub ON sch.subject_id = sub.id
            WHERE sch.section_id = $1
        `;
        
        const queryParams = [parseInt(sectionId)];
        
        if (teacherId) {
            subjectsQuery += ' AND sch.teacher_id = $2';
            queryParams.push(parseInt(teacherId));
        }
        
        subjectsQuery += ' ORDER BY sub.name';

        const subjectsResult = await query(subjectsQuery, queryParams);

        // Get actual grades for students
        const studentsWithGrades = [];
        
        // First, get the grade items configuration to determine array lengths
        let gradeItemsConfig = {
            writtenWork: { count: 0 },
            performanceTasks: { count: 0 },
            quarterlyAssessment: { count: 1 } // Default to 1 for QA
        };
        
        if (subjectId) {
            const gradeItemsQuery = `
                SELECT 
                    gc.code as category_code,
                    COUNT(*) as item_count
                FROM grade_items gi
                JOIN grade_categories gc ON gi.category_id = gc.id
                WHERE gi.section_id = $1
                    AND gi.subject_id = $2
                    AND gi.grading_period_id = 1
                    AND gi.status = 'active'
                GROUP BY gc.code
            `;
            
            const gradeItemsResult = await query(gradeItemsQuery, [parseInt(sectionId), parseInt(subjectId)]);
            
            for (const item of gradeItemsResult.rows) {
                const count = parseInt(item.item_count);
                switch (item.category_code) {
                    case 'WW':
                        gradeItemsConfig.writtenWork.count = count;
                        break;
                    case 'PT':
                        gradeItemsConfig.performanceTasks.count = count;
                        break;
                    case 'QA':
                        gradeItemsConfig.quarterlyAssessment.count = count;
                        break;
                }
            }
        }
        
        for (const student of studentsResult.rows) {
            let writtenWork = [];
            let performanceTasks = [];
            let quarterlyAssessment = [];
            let isVerified = false;

            // First, check if final grades exist for this student and subject
            let finalGradesExist = false;
            if (subjectId) {
                const finalGradesQuery = `
                    SELECT 
                        written_work_average,
                        performance_tasks_average,
                        quarterly_assessment_average,
                        final_grade,
                        letter_grade,
                        written_work_items,
                        performance_tasks_items,
                        quarterly_assessment_items,
                        verified
                    FROM final_grades
                    WHERE student_id = $1 
                        AND section_id = $2 
                        AND subject_id = $3
                        AND grading_period_id = 1
                `;
                const finalGradesResult = await query(finalGradesQuery, [student.id, parseInt(sectionId), parseInt(subjectId)]);
                
                if (finalGradesResult.rows.length > 0) {
                    finalGradesExist = true;
                    const finalGrade = finalGradesResult.rows[0];
                    isVerified = finalGrade.verified || false;
                    
                    // Use the stored individual grade items if available
                    if (finalGrade.written_work_items) {
                        try {
                            const wwItems = typeof finalGrade.written_work_items === 'string' 
                                ? JSON.parse(finalGrade.written_work_items) 
                                : finalGrade.written_work_items;
                            writtenWork = Array.isArray(wwItems) ? wwItems.map(item => parseFloat(item) || 0) : [];
                        } catch (e) {
                            console.error('Error parsing written_work_items:', e);
                            writtenWork = [];
                        }
                    }
                    
                    if (finalGrade.performance_tasks_items) {
                        try {
                            const ptItems = typeof finalGrade.performance_tasks_items === 'string' 
                                ? JSON.parse(finalGrade.performance_tasks_items) 
                                : finalGrade.performance_tasks_items;
                            performanceTasks = Array.isArray(ptItems) ? ptItems.map(item => parseFloat(item) || 0) : [];
                        } catch (e) {
                            console.error('Error parsing performance_tasks_items:', e);
                            performanceTasks = [];
                        }
                    }
                    
                    if (finalGrade.quarterly_assessment_items) {
                        try {
                            const qaItems = typeof finalGrade.quarterly_assessment_items === 'string' 
                                ? JSON.parse(finalGrade.quarterly_assessment_items) 
                                : finalGrade.quarterly_assessment_items;
                            quarterlyAssessment = Array.isArray(qaItems) ? qaItems.map(item => parseFloat(item) || 0) : [];
                        } catch (e) {
                            console.error('Error parsing quarterly_assessment_items:', e);
                            quarterlyAssessment = [];
                        }
                    }
                    
                    // If individual items are empty, fall back to computed averages for display compatibility
                    if (writtenWork.length === 0) {
                        const wwAvg = parseFloat(finalGrade.written_work_average) || 0;
                        writtenWork = Array(gradeItemsConfig.writtenWork.count || 1).fill(wwAvg);
                    }
                    
                    if (performanceTasks.length === 0) {
                        const ptAvg = parseFloat(finalGrade.performance_tasks_average) || 0;
                        performanceTasks = Array(gradeItemsConfig.performanceTasks.count || 1).fill(ptAvg);
                    }
                    
                    if (quarterlyAssessment.length === 0) {
                        const qaAvg = parseFloat(finalGrade.quarterly_assessment_average) || 0;
                        quarterlyAssessment = Array(gradeItemsConfig.quarterlyAssessment.count || 1).fill(qaAvg);
                    }
                }
            }

            // If no final grades exist, fall back to calculating from individual student_grades
            if (!finalGradesExist) {
                const gradesQuery = `
                    SELECT 
                        sg.score,
                        gi.name as item_name,
                        gc.code as category_code,
                        gi.total_score
                    FROM student_grades sg
                    JOIN grade_items gi ON sg.grade_item_id = gi.id
                    JOIN grade_categories gc ON gi.category_id = gc.id
                    WHERE sg.student_id = $1
                        AND gi.section_id = $2
                        ${subjectId ? 'AND gi.subject_id = $3' : ''}
                    ORDER BY gc.code, gi.id
                `;
                
                const queryParams = [student.id, parseInt(sectionId)];
                if (subjectId) {
                    queryParams.push(parseInt(subjectId));
                }
                
                const gradesResult = await query(gradesQuery, queryParams);
                
                // Organize grades by category
                gradesResult.rows.forEach(grade => {
                    if (grade.category_code === 'WW') {
                        writtenWork.push(grade.score || 0);
                    } else if (grade.category_code === 'PT') {
                        performanceTasks.push(grade.score || 0);
                    } else if (grade.category_code === 'QA') {
                        quarterlyAssessment.push(grade.score || 0);
                    }
                });
                
                // Ensure arrays have the correct length based on actual grade items configuration
                while (writtenWork.length < (gradeItemsConfig.writtenWork.count || 1)) writtenWork.push(0);
                while (performanceTasks.length < (gradeItemsConfig.performanceTasks.count || 1)) performanceTasks.push(0);
                while (quarterlyAssessment.length < (gradeItemsConfig.quarterlyAssessment.count || 1)) quarterlyAssessment.push(0);
            }
            
            studentsWithGrades.push({
                id: student.account_number || student.id.toString(),
                name: student.full_name,
                firstName: student.first_name,
                lastName: student.last_name,
                email: student.email,
                enrollmentStatus: student.enrollment_status,
                enrolledAt: student.enrolled_at,
                writtenWork: writtenWork,
                performanceTasks: performanceTasks,
                quarterlyAssessment: quarterlyAssessment,
                isVerified: isVerified // Add verification status
            });
        }

        return json({
            success: true,
            data: {
                section: {
                    id: sectionInfo.id,
                    name: sectionInfo.section_name,
                    gradeLevel: sectionInfo.grade_level,
                    schoolYear: sectionInfo.school_year,
                    adviser: sectionInfo.adviser_first_name && sectionInfo.adviser_last_name 
                        ? `${sectionInfo.adviser_first_name} ${sectionInfo.adviser_last_name}`
                        : null,
                    room: sectionInfo.room_name
                },
                subjects: subjectsResult.rows,
                students: studentsWithGrades,
                totalStudents: studentsWithGrades.length
            }
        });

    } catch (error) {
        console.error('Error fetching class students:', error);
        return json({ 
            success: false, 
            error: 'Failed to fetch class students' 
        }, { status: 500 });
    }
}
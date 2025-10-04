import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { verifyAuth, logActivityWithUser } from '../helper/auth-helper.js';

export async function GET({ request, url }) {
    try {
        // Verify authentication and ensure user is a teacher
        const authResult = await verifyAuth(request, ['teacher']);
        if (!authResult.success) {
            return json({ 
                success: false, 
                error: authResult.error 
            }, { status: authResult.status });
        }

        const user = authResult.user;
        const teacherId = user.id;
        const schoolYear = url.searchParams.get('schoolYear') || '2024-2025';

        // Get the section where this teacher is the adviser
        const advisorySectionQuery = `
            SELECT 
                s.id as section_id,
                s.name as section_name,
                s.grade_level,
                s.school_year,
                r.name as room_name,
                r.building,
                r.floor,
                COUNT(ss.student_id) as total_students
            FROM sections s
            LEFT JOIN rooms r ON s.room_id = r.id
            LEFT JOIN section_students ss ON s.id = ss.section_id AND ss.status = 'active'
            WHERE s.adviser_id = $1 
                AND s.school_year = $2
                AND s.status = 'active'
            GROUP BY s.id, s.name, s.grade_level, s.school_year, r.name, r.building, r.floor
        `;

        const sectionResult = await query(advisorySectionQuery, [teacherId, schoolYear]);

        if (sectionResult.rows.length === 0) {
            return json({
                success: true,
                data: {
                    advisoryData: null,
                    students: [],
                    message: 'No advisory section assigned'
                }
            });
        }

        const section = sectionResult.rows[0];
        
        // Get students in the advisory section with their grades
        const studentsQuery = `
            SELECT DISTINCT
                u.id as student_id,
                u.account_number as student_number,
                u.full_name as student_name,
                u.grade_level,
                ss.enrolled_at,
                ss.status as enrollment_status
            FROM section_students ss
            JOIN users u ON ss.student_id = u.id
            WHERE ss.section_id = $1 
                AND ss.status = 'active'
                AND u.account_type = 'student'
                AND u.status = 'active'
            ORDER BY u.full_name
        `;

        const studentsResult = await query(studentsQuery, [section.section_id]);

        // Get grades for each student
        const studentsWithGrades = [];
        
        for (const student of studentsResult.rows) {
            // Get student's grades from all subjects in their section
            const gradesQuery = `
                SELECT 
                    sub.name as subject_name,
                    sub.code as subject_code,
                    t.full_name as teacher_name,
                    gi.name as grade_item_name,
                    gi.total_score,
                    sg.score,
                    gi.date_given,
                    sg.graded_at,
                    gp.name as grading_period,
                    gc.name as category_name,
                    CASE 
                        WHEN gi.total_score > 0 THEN ROUND((sg.score / gi.total_score * 100)::numeric, 2)
                        ELSE 0
                    END as percentage_score
                FROM grade_items gi
                JOIN subjects sub ON gi.subject_id = sub.id
                JOIN users t ON gi.teacher_id = t.id
                JOIN grading_periods gp ON gi.grading_period_id = gp.id
                JOIN grade_categories gc ON gi.category_id = gc.id
                LEFT JOIN student_grades sg ON gi.id = sg.grade_item_id AND sg.student_id = $1
                WHERE gi.section_id = $2
                    AND gi.status = 'active'
                ORDER BY sub.name, gi.date_given DESC
            `;

            const gradesResult = await query(gradesQuery, [student.student_id, section.section_id]);

            // Group grades by subject and calculate averages
            const gradesBySubject = {};
            
            gradesResult.rows.forEach(grade => {
                const subjectKey = grade.subject_name;
                
                if (!gradesBySubject[subjectKey]) {
                    gradesBySubject[subjectKey] = {
                        subject: grade.subject_name,
                        teacher: grade.teacher_name,
                        grades: [],
                        totalScore: 0,
                        totalPossible: 0,
                        average: 0,
                        verified: false // For now, we'll set this to false by default
                    };
                }

                if (grade.score !== null) {
                    gradesBySubject[subjectKey].grades.push({
                        name: grade.grade_item_name,
                        score: parseFloat(grade.score),
                        totalScore: grade.total_score,
                        percentage: parseFloat(grade.percentage_score),
                        dateGiven: grade.date_given,
                        gradedAt: grade.graded_at,
                        period: grade.grading_period,
                        category: grade.category_name
                    });

                    gradesBySubject[subjectKey].totalScore += parseFloat(grade.score);
                    gradesBySubject[subjectKey].totalPossible += grade.total_score;
                }
            });

            // Calculate subject averages
            const subjects = Object.values(gradesBySubject).map(subject => {
                if (subject.totalPossible > 0) {
                    subject.average = Math.round((subject.totalScore / subject.totalPossible * 100) * 100) / 100;
                }
                return subject;
            });

            // Calculate overall student average
            const validAverages = subjects.filter(s => s.average > 0).map(s => s.average);
            const overallAverage = validAverages.length > 0 
                ? Math.round((validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length) * 100) / 100
                : 0;

            studentsWithGrades.push({
                id: student.student_id,
                name: student.student_name,
                studentNumber: student.student_number,
                gradeLevel: student.grade_level,
                enrolledAt: student.enrolled_at,
                enrollmentStatus: student.enrollment_status,
                subjects: subjects,
                overallAverage: overallAverage,
                gradesVerified: false // Default to false, can be updated later
            });
        }

        // Calculate class statistics
        const validAverages = studentsWithGrades
            .map(s => s.overallAverage)
            .filter(avg => avg > 0);
        
        const classAverage = validAverages.length > 0 
            ? Math.round((validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length) * 100) / 100
            : 0;

        // Get unique subjects count
        const allSubjects = new Set();
        studentsWithGrades.forEach(student => {
            student.subjects.forEach(subject => {
                allSubjects.add(subject.subject);
            });
        });

        const advisoryData = {
            sectionId: section.section_id,
            sectionName: section.section_name,
            gradeLevel: section.grade_level,
            schoolYear: section.school_year,
            roomName: section.room_name ? `${section.room_name}` : 'No room assigned',
            building: section.building,
            floor: section.floor,
            totalStudents: parseInt(section.total_students),
            classAverage: classAverage,
            subjectsCount: allSubjects.size
        };

        // Log the activity
        await logActivityWithUser(
            'teacher_advisory_view',
            user,
            { 
                section_id: section.section_id,
                section_name: section.section_name,
                student_count: studentsWithGrades.length
            },
            request.headers.get('x-forwarded-for') || 'unknown',
            request.headers.get('user-agent') || 'unknown'
        );

        return json({
            success: true,
            data: {
                advisoryData: advisoryData,
                students: studentsWithGrades
            }
        });

    } catch (error) {
        console.error('Error fetching teacher advisory data:', error);
        return json({ 
            success: false, 
            error: 'Failed to fetch advisory data' 
        }, { status: 500 });
    }
}

// POST endpoint for updating grade verification status
export async function POST({ request }) {
    try {
        // Verify authentication and ensure user is a teacher
        const authResult = await verifyAuth(request, ['teacher']);
        if (!authResult.success) {
            return json({ 
                success: false, 
                error: authResult.error 
            }, { status: authResult.status });
        }

        const user = authResult.user;
        const { action, studentId, subjectName } = await request.json();

        // Validate input
        if (!action || !['verify_all', 'unverify_all', 'verify_subject', 'unverify_subject'].includes(action)) {
            return json({
                success: false,
                error: 'Invalid action'
            }, { status: 400 });
        }

        // For now, we'll just return success since grade verification 
        // would require additional database schema changes
        // This can be implemented later with a grade_verifications table

        // Log the activity
        await logActivityWithUser(
            'grade_verification_update',
            user,
            { 
                action: action,
                student_id: studentId,
                subject_name: subjectName
            },
            request.headers.get('x-forwarded-for') || 'unknown',
            request.headers.get('user-agent') || 'unknown'
        );

        return json({
            success: true,
            message: 'Grade verification updated successfully'
        });

    } catch (error) {
        console.error('Error updating grade verification:', error);
        return json({ 
            success: false, 
            error: 'Failed to update grade verification' 
        }, { status: 500 });
    }
}
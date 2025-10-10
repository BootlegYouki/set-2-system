import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';

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

        const db = await connectToDatabase();

        // Get actual section data from database
        const section = await db.collection('sections').findOne({
            _id: new ObjectId(sectionId),
            status: 'active'
        });

        if (!section) {
            return json({ 
                success: false, 
                error: 'Section not found or inactive' 
            }, { status: 404 });
        }

        // Get adviser information
        let adviserInfo = { first_name: '', last_name: '' };
        if (section.adviser_id) {
            const adviser = await db.collection('users').findOne({
                _id: new ObjectId(section.adviser_id)
            });
            if (adviser) {
                adviserInfo = {
                    first_name: adviser.first_name,
                    last_name: adviser.last_name
                };
            }
        }

        const sectionInfo = {
            id: section._id.toString(),
            section_name: section.name,
            grade_level: section.grade_level,
            school_year: section.school_year,
            adviser_first_name: adviserInfo.first_name,
            adviser_last_name: adviserInfo.last_name,
            room_name: 'Room 101' // TODO: Add room information when available
        };

        // Get actual students enrolled in this section
        const enrollments = await db.collection('section_students').find({
            section_id: new ObjectId(sectionId),
            status: 'active'
        }).toArray();

        const studentIds = enrollments.map(enrollment => enrollment.student_id);
        
        const students = await db.collection('users').find({
            _id: { $in: studentIds },
            account_type: 'student',
            status: 'active'
        }).toArray();

        const actualStudents = students.map(student => ({
            id: student._id.toString(),
            account_number: student.account_number,
            first_name: student.first_name,
            last_name: student.last_name,
            full_name: student.full_name,
            email: student.email,
            grade_level: student.grade_level,
            enrolled_at: student.created_at,
            enrollment_status: 'active'
        }));

        // If verificationOnly is true, return only student IDs and verification status
        if (verificationOnly && subjectId) {
            const studentsWithVerification = [];
            
            for (const student of actualStudents) {
                // Check verification status from grades collection
                const gradeRecord = await db.collection('grades').findOne({
                    student_id: student.id,
                    section_id: sectionId,
                    subject_id: subjectId,
                    school_year: schoolYear,
                    quarter: 1
                });
                
                const isVerified = gradeRecord ? gradeRecord.verification.verified : false;
                
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

        // Get subjects taught by this teacher in this section
        let actualSubjects = [];
        
        if (teacherId) {
            const scheduleQuery = {
                section_id: new ObjectId(sectionId),
                schedule_type: 'subject',
                school_year: schoolYear
            };
            
            if (teacherId) {
                scheduleQuery.teacher_id = new ObjectId(teacherId);
            }

            const schedules = await db.collection('schedules').find(scheduleQuery).toArray();

            const subjectIds = [...new Set(schedules.map(s => s.subject_id))];
            
            if (subjectIds.length > 0) {
                const subjects = await db.collection('subjects').find({
                    _id: { $in: subjectIds }
                }).toArray();

                actualSubjects = subjects.map(subject => ({
                    id: subject._id.toString(),
                    name: subject.name,
                    code: subject.code
                }));
            }
        }

        // Get grades for students if subjectId is provided
        let studentsWithGrades = [];
        
        if (subjectId) {
            for (const student of actualStudents) {
                // Get grades from MongoDB grades collection
                const gradeRecord = await db.collection('grades').findOne({
                    student_id: new ObjectId(student.id),
                    section_id: new ObjectId(sectionId),
                    subject_id: new ObjectId(subjectId),
                    school_year: schoolYear,
                    quarter: 1
                });

                const studentData = {
                    ...student,
                    grades: gradeRecord ? {
                        written_work: gradeRecord.written_work || [],
                        performance_tasks: gradeRecord.performance_tasks || [],
                        quarterly_assessment: gradeRecord.quarterly_assessment || [],
                        averages: gradeRecord.averages || {
                            written_work: 0,
                            performance_tasks: 0,
                            quarterly_assessment: 0,
                            final_grade: 0
                        },
                        verification: gradeRecord.verification || {
                            verified: false,
                            verified_by: null,
                            verified_at: null
                        }
                    } : {
                        written_work: [],
                        performance_tasks: [],
                        quarterly_assessment: [],
                        averages: {
                            written_work: 0,
                            performance_tasks: 0,
                            quarterly_assessment: 0,
                            final_grade: 0
                        },
                        verification: {
                            verified: false,
                            verified_by: null,
                            verified_at: null
                        }
                    }
                };

                studentsWithGrades.push(studentData);
            }
        }

        return json({
            success: true,
            data: {
                section: sectionInfo,
                students: subjectId ? studentsWithGrades : actualStudents,
                subjects: actualSubjects
            }
        });

    } catch (error) {
        console.error('Error in class-students API:', error);
        return json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const { action, ...data } = await request.json();
        const db = await connectToDatabase();

        switch (action) {
            case 'update_grade':
                const { student_id, section_id, subject_id, school_year, quarter, category, index, score } = data;
                
                const filter = {
                    student_id,
                    section_id,
                    subject_id,
                    school_year,
                    quarter
                };

                // Check if grades are already verified
                const existingGrade = await db.collection('grades').findOne(filter);
                if (existingGrade && existingGrade.verification && existingGrade.verification.verified) {
                    return json({
                        success: false,
                        error: 'Cannot update grades that have been verified by the adviser'
                    }, { status: 403 });
                }
                
                // Update or create grade record
                const updateResult = await db.collection('grades').updateOne(
                    filter,
                    {
                        $set: {
                            [`${category}.${index}.score`]: score,
                            updated_at: new Date()
                        }
                    },
                    { upsert: true }
                );

                // Recalculate averages
                const gradeRecord = await db.collection('grades').findOne({
                    student_id,
                    section_id,
                    subject_id,
                    school_year,
                    quarter
                });

                if (gradeRecord) {
                    const weights = { written_work: 0.3, performance_tasks: 0.5, quarterly_assessment: 0.2 };
                    
                    const calculateAverage = (items) => {
                        if (!items || items.length === 0) return 0;
                        const validScores = items.filter(item => item.score !== null && item.score !== undefined);
                        if (validScores.length === 0) return 0;
                        return validScores.reduce((sum, item) => sum + item.score, 0) / validScores.length;
                    };

                    const averages = {
                        written_work: calculateAverage(gradeRecord.written_work),
                        performance_tasks: calculateAverage(gradeRecord.performance_tasks),
                        quarterly_assessment: calculateAverage(gradeRecord.quarterly_assessment)
                    };

                    averages.final_grade = (
                        averages.written_work * weights.written_work +
                        averages.performance_tasks * weights.performance_tasks +
                        averages.quarterly_assessment * weights.quarterly_assessment
                    );

                    await db.collection('grades').updateOne(
                        { _id: gradeRecord._id },
                        { $set: { averages, updated_at: new Date() } }
                    );
                }

                return json({ success: true });

            default:
                return json({ 
                    success: false, 
                    error: 'Invalid action' 
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Error in class-students POST:', error);
        return json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}
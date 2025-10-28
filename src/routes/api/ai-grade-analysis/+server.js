import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';

dotenv.config();

export async function POST({ request }) {
    try {
        const { studentId, quarter, schoolYear, forceRefresh = false } = await request.json();

        if (!studentId) {
            return json({ error: 'Missing student ID' }, { status: 400 });
        }

        // Connect to MongoDB
        const db = await connectToDatabase();

        // Fetch student data
        const student = await db.collection('users').findOne({ _id: new ObjectId(studentId) });
        if (!student) {
            return json({ error: 'Student not found' }, { status: 404 });
        }

        // Check for cached analysis (skip if forceRefresh is true)
        const cacheKey = {
            student_id: new ObjectId(studentId),
            quarter: quarter,
            school_year: schoolYear
        };

        if (!forceRefresh) {
            const cachedAnalysis = await db.collection('ai_grade_analysis_cache').findOne(cacheKey);

            // Check if cache is valid (less than 7 days old)
            const CACHE_DURATION_DAYS = 7;
            const now = new Date();
            const cacheValid = cachedAnalysis && 
                ((now - new Date(cachedAnalysis.created_at)) / (1000 * 60 * 60 * 24)) < CACHE_DURATION_DAYS;

            if (cacheValid && cachedAnalysis.analysis) {
                console.log('Serving cached AI analysis');
                // Stream the cached analysis to maintain consistent UX
                return streamCachedAnalysis(cachedAnalysis.analysis);
            }
        } else {
            console.log('Force refresh requested - bypassing cache');
        }

        // Fetch all grades for the student (only verified ones)
        const gradesQuery = { 
            student_id: new ObjectId(studentId),
            verified: true // Only fetch verified grades
        };
        if (quarter) gradesQuery.quarter = quarter;
        if (schoolYear) gradesQuery.school_year = schoolYear;

        const studentGrades = await db.collection('grades').find(gradesQuery).toArray();

        if (studentGrades.length === 0) {
            return json({ error: 'No grades found for this student' }, { status: 404 });
        }

        // Fetch grade configurations and subject/teacher details
        const gradeAnalysisData = await prepareGradeDataFromDB(db, student, studentGrades);

        // Create the prompt for AI analysis
        const prompt = createAnalysisPrompt(gradeAnalysisData);

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_AI_KEY}`,
                'HTTP-Referer': '',
                'X-Title': '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 2000,
                temperature: 0.7,
                stream: true, // Enable streaming
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        // Create a streaming response and save to cache
        let fullAnalysis = '';
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            // Save complete analysis to cache
                            await saveAnalysisToCache(db, cacheKey, fullAnalysis);
                            controller.close();
                            break;
                        }

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                
                                if (data === '[DONE]') {
                                    continue;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices[0]?.delta?.content;
                                    
                                    if (content) {
                                        fullAnalysis += content;
                                        controller.enqueue(new TextEncoder().encode(content));
                                    }
                                } catch (e) {
                                    // Skip malformed JSON
                                }
                            }
                        }
                    }
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error) {
        console.error('AI Grade Analysis Error:', error);
        return json({
            error: 'Failed to generate AI analysis',
            details: error.message
        }, { status: 500 });
    }
}

// Helper function to save analysis to cache
async function saveAnalysisToCache(db, cacheKey, analysis) {
    try {
        await db.collection('ai_grade_analysis_cache').updateOne(
            cacheKey,
            {
                $set: {
                    ...cacheKey,
                    analysis: analysis,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            },
            { upsert: true }
        );
        console.log('Analysis saved to cache');
    } catch (error) {
        console.error('Error saving analysis to cache:', error);
    }
}

// Helper function to stream cached analysis
function streamCachedAnalysis(analysis) {
    const stream = new ReadableStream({
        start(controller) {
            // Stream cached content in chunks to simulate real streaming
            const chunkSize = 20;
            let position = 0;

            const interval = setInterval(() => {
                if (position >= analysis.length) {
                    clearInterval(interval);
                    controller.close();
                    return;
                }

                const chunk = analysis.slice(position, position + chunkSize);
                controller.enqueue(new TextEncoder().encode(chunk));
                position += chunkSize;
            }, 10); // Small delay between chunks for smooth streaming effect
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Cache-Status': 'HIT'
        }
    });
}

async function prepareGradeDataFromDB(db, student, studentGrades) {
    // Get section info
    const section = student.section_id 
        ? await db.collection('sections').findOne({ _id: new ObjectId(student.section_id) })
        : null;

    // Calculate overall average
    const totalGrades = studentGrades.reduce((sum, grade) => sum + (grade.averages?.final_grade || 0), 0);
    const overallAverage = studentGrades.length > 0 ? totalGrades / studentGrades.length : 0;

    // Get class rank if possible
    const sectionStudents = section 
        ? await db.collection('section_students').find({ section_id: new ObjectId(student.section_id) }).toArray()
        : [];

    // Prepare subject breakdown with detailed score analysis
    const subjectBreakdown = [];

    for (const grade of studentGrades) {
        const subject = await db.collection('subjects').findOne({ _id: new ObjectId(grade.subject_id) });
        const teacher = await db.collection('users').findOne({ _id: new ObjectId(grade.teacher_id) });
        
        // Get grade configuration for detailed item names and total scores
        const gradeConfig = await db.collection('grade_configurations').findOne({
            section_id: new ObjectId(grade.section_id),
            subject_id: new ObjectId(grade.subject_id),
            grading_period_id: grade.quarter
        });

        // Build detailed score breakdown
        const writtenWorkDetails = buildScoreDetails(
            grade.written_work || [],
            gradeConfig?.grade_items?.writtenWork || [],
            'Written Work'
        );

        const performanceTasksDetails = buildScoreDetails(
            grade.performance_tasks || [],
            gradeConfig?.grade_items?.performanceTasks || [],
            'Performance Tasks'
        );

        const quarterlyAssessmentDetails = buildScoreDetails(
            grade.quarterly_assessment || [],
            gradeConfig?.grade_items?.quarterlyAssessment || [],
            'Quarterly Assessment'
        );

        subjectBreakdown.push({
            name: subject?.name || 'Unknown Subject',
            teacher: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher',
            overallGrade: grade.averages?.final_grade || 0,
            writtenWorkAverage: grade.averages?.written_work || 0,
            performanceTasksAverage: grade.averages?.performance_tasks || 0,
            quarterlyAssessmentAverage: grade.averages?.quarterly_assessment || 0,
            writtenWorkDetails,
            performanceTasksDetails,
            quarterlyAssessmentDetails,
            verified: grade.verified || false,
            quarter: grade.quarter,
            schoolYear: grade.school_year
        });
    }

    return {
        studentInfo: {
            name: `${student.first_name} ${student.last_name}`,
            gradeLevel: student.grade_level || 'N/A',
            section: section?.name || 'N/A',
            studentId: student.student_id || 'N/A'
        },
        academicPerformance: {
            overallAverage: Math.round(overallAverage * 100) / 100,
            totalSubjects: studentGrades.length,
            totalStudentsInSection: sectionStudents.length || 'N/A'
        },
        subjects: subjectBreakdown
    };
}

function buildScoreDetails(scores, gradeItems, category) {
    if (!scores || scores.length === 0) {
        return { items: [], average: 0, count: 0 };
    }

    const items = scores.map((score, index) => {
        const item = gradeItems[index];
        const itemName = item?.name || `${category} ${index + 1}`;
        const totalScore = item?.totalScore || 100;
        const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100 * 100) / 100 : 0;

        return {
            name: itemName,
            score,
            totalScore,
            percentage
        };
    });

    const average = items.reduce((sum, item) => sum + item.percentage, 0) / items.length;

    return {
        items,
        average: Math.round(average * 100) / 100,
        count: items.length
    };
}

function createAnalysisPrompt(gradeData) {
    const { studentInfo, academicPerformance, subjects } = gradeData;

    let prompt = `As an educational AI assistant, analyze the academic performance of ${studentInfo.name} (Student ID: ${studentInfo.studentId}), a Grade ${studentInfo.gradeLevel}.

ACADEMIC OVERVIEW:
- Overall Average: ${academicPerformance.overallAverage}
- Total Subjects: ${academicPerformance.totalSubjects}
- Section Size: ${academicPerformance.totalStudentsInSection} students

DETAILED SUBJECT BREAKDOWN:
`;

    subjects.forEach(subject => {
        prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 ${subject.name} (Teacher: ${subject.teacher})
Quarter: ${subject.quarter} | School Year: ${subject.schoolYear}
Verified: ${subject.verified ? 'Yes ✓' : 'No ✗'}

Overall Grade: ${subject.overallGrade}

Component Averages:
- Written Work: ${subject.writtenWorkAverage}% (${subject.writtenWorkDetails.count} items)
- Performance Tasks: ${subject.performanceTasksAverage}% (${subject.performanceTasksDetails.count} items)  
- Quarterly Assessment: ${subject.quarterlyAssessmentAverage}% (${subject.quarterlyAssessmentDetails.count} items)
`;

        // Add detailed Written Work scores
        if (subject.writtenWorkDetails.items.length > 0) {
            prompt += `\n📝 Written Work Details:\n`;
            subject.writtenWorkDetails.items.forEach((item, idx) => {
                prompt += `   ${idx + 1}. ${item.name}: ${item.score}/${item.totalScore} (${item.percentage}%)\n`;
            });
        }

        // Add detailed Performance Tasks scores
        if (subject.performanceTasksDetails.items.length > 0) {
            prompt += `\n🎯 Performance Tasks Details:\n`;
            subject.performanceTasksDetails.items.forEach((item, idx) => {
                prompt += `   ${idx + 1}. ${item.name}: ${item.score}/${item.totalScore} (${item.percentage}%)\n`;
            });
        }

        // Add detailed Quarterly Assessment scores
        if (subject.quarterlyAssessmentDetails.items.length > 0) {
            prompt += `\n📊 Quarterly Assessment Details:\n`;
            subject.quarterlyAssessmentDetails.items.forEach((item, idx) => {
                prompt += `   ${idx + 1}. ${item.name}: ${item.score}/${item.totalScore} (${item.percentage}%)\n`;
            });
        }
    });

    prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze the grade data above and provide a concise, data-driven response in this exact format:

**STRENGTHS:**
- List your top-performing subjects with specific scores (e.g., "Mathematics WW: 48.5/50")
- Identify which assessment types (WW/PT/QA) you excel in
- Note any consistently high performance patterns

**AREAS FOR IMPROVEMENT:**
- Pinpoint subjects and specific assessment types needing attention with actual scores
- Highlight individual low scores and inconsistent performance
- Identify patterns of weakness across subjects

**ACTIONABLE RECOMMENDATIONS:**
- Provide 4-6 specific, prioritized action steps you should take immediately
- Suggest which assessment types to focus on per subject
- Recommend concrete study strategies and time allocation based on score gaps

**PERFORMANCE INSIGHTS:**
- Compare your performance across WW, PT, and QA assessment types
- Note any trends (improving/declining) and score distribution patterns
- Identify if certain assessment types consistently challenge you

CRITICAL REQUIREMENTS:
• Use second-person perspective ("You" not "This student")
• Reference actual numeric scores (e.g., "38.2/50"), never percentages
• Round all decimals to nearest tenth
• Be constructive yet honest about weaknesses
• Base all observations on the specific data provided
`;
    
    return prompt;
}
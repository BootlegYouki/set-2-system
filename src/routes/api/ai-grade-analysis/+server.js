import { json } from '@sveltejs/kit';
import { OPENROUTER_AI_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        const { studentData, grades } = await request.json();

        if (!studentData || !grades) {
            return json({ error: 'Missing required data' }, { status: 400 });
        }

        // Prepare the grade data for AI analysis
        const gradeAnalysisData = prepareGradeData(studentData, grades);

        // Create the prompt for AI analysis
        const prompt = createAnalysisPrompt(gradeAnalysisData);

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_AI_KEY}`,
                'HTTP-Referer': '',
                'X-Title': '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: true, // Enable streaming
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        // Create a streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
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

function prepareGradeData(studentData, grades) {
    const overallAverage = grades.overallAverage || 0;
    const totalSubjects = grades.subjects?.length || 0;
    const classRank = grades.classRank || 'N/A';
    const totalStudentsInSection = grades.totalStudentsInSection || 'N/A';

    const subjectBreakdown = grades.subjects?.map(subject => ({
        name: subject.name,
        teacher: subject.teacher,
        overallGrade: subject.numericGrade,
        writtenWork: subject.writtenWork,
        performanceTasks: subject.performanceTasks,
        quarterlyAssessment: subject.quarterlyAssessment,
        writtenWorkScores: subject.writtenWorkScores || [],
        performanceTasksScores: subject.performanceTasksScores || [],
        quarterlyAssessmentScores: subject.quarterlyAssessmentScores || [],
        verified: subject.verified
    })) || [];

    return {
        studentInfo: {
            name: studentData.name || 'Student',
            gradeLevel: studentData.gradeLevel || 'N/A',
            section: studentData.section || 'N/A'
        },
        academicPerformance: {
            overallAverage,
            totalSubjects,
            classRank,
            totalStudentsInSection
        },
        subjects: subjectBreakdown
    };
}

function createAnalysisPrompt(gradeData) {
    const { studentInfo, academicPerformance, subjects } = gradeData;

    let prompt = `As an educational AI assistant, analyze the academic performance of ${studentInfo.name}, a Grade ${studentInfo.gradeLevel} student in section ${studentInfo.section}.

ACADEMIC OVERVIEW:
- Overall Average: ${academicPerformance.overallAverage}
- Total Subjects: ${academicPerformance.totalSubjects}
- Class Rank: ${academicPerformance.classRank} out of ${academicPerformance.totalStudentsInSection} students

SUBJECT BREAKDOWN:
`;

    subjects.forEach(subject => {
        prompt += `
${subject.name} (Teacher: ${subject.teacher}):
- Overall Grade: ${subject.overallGrade}
- Written Work: ${subject.writtenWork}
- Performance Tasks: ${subject.performanceTasks}
- Quarterly Assessment: ${subject.quarterlyAssessment}
- Verified: ${subject.verified ? 'Yes' : 'No'}`;

        if (subject.writtenWorkScores.length > 0) {
            prompt += `
- Written Work Scores: [${subject.writtenWorkScores.join(', ')}]`;
        }
        if (subject.performanceTasksScores.length > 0) {
            prompt += `
- Performance Task Scores: [${subject.performanceTasksScores.join(', ')}]`;
        }
        if (subject.quarterlyAssessmentScores.length > 0) {
            prompt += `
- Quarterly Assessment Scores: [${subject.quarterlyAssessmentScores.join(', ')}]`;
        }
    });

    prompt += `

Please provide a comprehensive analysis in the following format:

**STRENGTHS:**
- Identify the student's strongest subjects and areas of excellence
- Highlight consistent performance patterns

**AREAS FOR IMPROVEMENT:**
- Point out subjects or assessment types that need attention
- Identify specific weaknesses in Written Work, Performance Tasks, or Quarterly Assessments

**RECOMMENDATIONS:**
- Provide specific, actionable advice for improvement
- Suggest study strategies or focus areas
- Recommend which subjects to prioritize

**CONSISTENCY ANALYSIS:**
- Comment on the consistency of performance across subjects
- Note any significant variations in different assessment types

Keep the analysis concise, constructive, and focused on actionable insights. Use a supportive and encouraging tone while being honest about areas needing improvement.`;
    return prompt;
}
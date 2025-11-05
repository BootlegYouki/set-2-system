import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Constants
const GEMINI_MODEL = "gemini-2.5-flash";

// Extend timeout for AI generation (60 seconds)
export const config = {
    runtime: 'nodejs18',
    maxDuration: 60
};

export async function POST({ request }) {
    console.log('=== AI Grade Analysis Request Started ===');
    
    // Declare variables at top scope for fallback access in catch block
    let db;
    let cacheKey;
    
    try {
        const { studentId, quarter, schoolYear, forceRefresh = false } = await request.json();
        console.log('Request params:', { studentId, quarter, schoolYear, forceRefresh });

        if (!studentId) {
            return json({ error: 'Missing student ID' }, { status: 400 });
        }

        // Connect to MongoDB
        db = await connectToDatabase();

        // Fetch student data
        const student = await db.collection('users').findOne({ _id: new ObjectId(studentId) });
        if (!student) {
            return json({ error: 'Student not found' }, { status: 404 });
        }

        // Check for cached analysis (skip if forceRefresh is true)
        cacheKey = {
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
                // Check if cached analysis is valid JSON (not old text format)
                const isValidJSON = typeof cachedAnalysis.analysis === 'object' && cachedAnalysis.analysis.overallInsight;
                
                if (isValidJSON) {
                    console.log('Serving cached AI analysis (JSON format)');
                    return streamCachedAnalysis(cachedAnalysis.analysis);
                } else {
                    console.log('Cached analysis is in old format, regenerating...');
                    // Don't use old cache, regenerate with new prompt
                }
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

        // Initialize Google Gemini AI
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        // Use Gemini 2.5 Flash for fast, efficient JSON responses
        const model = genAI.getGenerativeModel({ 
            model: GEMINI_MODEL,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 5000,
                responseMimeType: "application/json", // Force JSON response
            }
        });
        
        console.log('Using Google Gemini model:', GEMINI_MODEL);
        console.log('Making request to Gemini API...');
        
        // Generate content using the official SDK
        let fullAnalysis;
        try {
            const result = await model.generateContent(prompt);
            console.log('Gemini API response received');
            const response = result.response;
            fullAnalysis = response.text();
            console.log('Response text extracted, length:', fullAnalysis.length);
        } catch (geminiError) {
            console.error('Gemini API call failed:', geminiError);
            console.error('Error details:', {
                message: geminiError.message,
                name: geminiError.name,
                stack: geminiError.stack
            });
            throw new Error(`Gemini API error: ${geminiError.message}`);
        }

        // Parse the AI response as JSON
        let parsedAnalysis;
        try {
            // Clean up the response - remove any markdown code blocks, extra text, etc.
            let cleanedAnalysis = fullAnalysis.trim();
            
            // Remove markdown code blocks
            if (cleanedAnalysis.startsWith('```json')) {
                cleanedAnalysis = cleanedAnalysis.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanedAnalysis.startsWith('```')) {
                cleanedAnalysis = cleanedAnalysis.replace(/```\n?/g, '');
            }
            
            // Find the first { and last } to extract just the JSON object
            const firstBrace = cleanedAnalysis.indexOf('{');
            const lastBrace = cleanedAnalysis.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error('No JSON object found in response');
            }
            
            cleanedAnalysis = cleanedAnalysis.substring(firstBrace, lastBrace + 1);
            
            // Parse the JSON
            parsedAnalysis = JSON.parse(cleanedAnalysis);
            
            // Validate the structure
            if (!parsedAnalysis.overallInsight || !parsedAnalysis.performanceLevel) {
                throw new Error('Invalid JSON structure - missing required fields');
            }
            
        } catch (error) {
            console.error('Failed to parse AI response as JSON:', error);
            console.error('Gemini Model used:', GEMINI_MODEL);
            console.error('Raw response (first 500 chars):', fullAnalysis.substring(0, 500));
            
            // Provide helpful error message
            throw new Error('Gemini returned invalid JSON format. Please try again.');
        }

        // Save to cache
        await saveAnalysisToCache(db, cacheKey, parsedAnalysis);

        // Stream the JSON response character by character for smooth UI
        const jsonString = JSON.stringify(parsedAnalysis);
        const stream = new ReadableStream({
            start(controller) {
                const chunkSize = 50;
                let position = 0;

                const interval = setInterval(() => {
                    if (position >= jsonString.length) {
                        clearInterval(interval);
                        controller.close();
                        return;
                    }

                    const chunk = jsonString.slice(position, position + chunkSize);
                    controller.enqueue(new TextEncoder().encode(chunk));
                    position += chunkSize;
                }, 15);
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error) {
        console.error('AI Grade Analysis Error:', error);
        console.error('Error stack:', error.stack);
        
        // FALLBACK: Try to return cached analysis (even if expired) if generation failed
        if (db && cacheKey) {
            try {
                console.log('⚠️ AI generation failed - attempting to retrieve cached analysis as fallback...');
                const cachedAnalysis = await db.collection('ai_grade_analysis_cache').findOne(cacheKey);
                
                if (cachedAnalysis && cachedAnalysis.analysis) {
                    // Check if it's valid JSON format
                    const isValidJSON = typeof cachedAnalysis.analysis === 'object' && cachedAnalysis.analysis.overallInsight;
                    
                    if (isValidJSON) {
                        const cacheAge = Math.floor((new Date() - new Date(cachedAnalysis.created_at)) / (1000 * 60 * 60 * 24));
                        console.log(`✅ Serving cached analysis as fallback (${cacheAge} days old)`);
                        
                        // Return the cached analysis
                        return streamCachedAnalysis(cachedAnalysis.analysis);
                    }
                }
                
                console.log('❌ No valid cached analysis found for fallback');
            } catch (fallbackError) {
                console.error('Failed to retrieve cached analysis as fallback:', fallbackError);
            }
        }
        
        // No cache available, return error
        return json({
            error: 'Failed to generate AI analysis',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    // Convert analysis object to JSON string
    const jsonString = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
    
    const stream = new ReadableStream({
        start(controller) {
            // Stream cached content in chunks to simulate real streaming
            const chunkSize = 50;
            let position = 0;

            const interval = setInterval(() => {
                if (position >= jsonString.length) {
                    clearInterval(interval);
                    controller.close();
                    return;
                }

                const chunk = jsonString.slice(position, position + chunkSize);
                controller.enqueue(new TextEncoder().encode(chunk));
                position += chunkSize;
            }, 15); // Small delay between chunks for smooth streaming effect
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
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

Analyze the grade data above and provide a supportive, empowering academic performance report.

Return a JSON object with this EXACT structure:

{
  "overallInsight": "A 2-3 sentence warm, personalized opening that recognizes the student's overall performance and effort",
  "performanceLevel": "excellent|good|satisfactory|needs-improvement",
  "strengths": [
    {
      "subject": "Subject name",
      "score": 95.5,
      "reason": "Specific reason why this is a strength (mention specific assessment types and scores)"
    }
  ],
  "areasForGrowth": [
    {
      "subject": "Subject name", 
      "score": 75.0,
      "currentGap": "Brief description of the gap",
      "potential": "Encouraging note about potential for improvement"
    }
  ],
  "assessmentInsights": {
    "writtenWork": {
      "average": 85.5,
      "performance": "excellent|good|satisfactory|needs-improvement",
      "insight": "Brief encouraging insight about written work performance"
    },
    "performanceTasks": {
      "average": 82.3,
      "performance": "excellent|good|satisfactory|needs-improvement", 
      "insight": "Brief encouraging insight about performance tasks"
    },
    "quarterlyAssessment": {
      "average": 88.0,
      "performance": "excellent|good|satisfactory|needs-improvement",
      "insight": "Brief encouraging insight about quarterly assessments"
    }
  },
  "actionPlan": [
    {
      "priority": "high|medium|low",
      "title": "Short action title",
      "description": "Specific, encouraging action step",
      "expectedImpact": "What improvement this could bring"
    }
  ],
  "studyRecommendations": {
    "timeManagement": "Specific time management tip",
    "focusAreas": ["Subject 1", "Subject 2"],
    "strengthsToLeverage": "How to use their strengths to improve weaker areas"
  },
  "motivationalMessage": "A warm, personalized closing message that instills confidence and acknowledges their potential"
}

REQUIREMENTS:
- Use warm, second-person perspective in all text fields ("you", "your")
- Round all numeric scores to one decimal place
- Include 3-5 items in strengths array (top performing subjects)
- Include 2-4 items in areasForGrowth array (subjects needing attention)
- Include 5-7 items in actionPlan array, ordered by priority (high/medium/low)
- Be genuinely encouraging while staying honest
- Use growth mindset language - frame weaknesses as opportunities
- Avoid judgmental words like "poor", "bad", "failing" - use "developing", "emerging", "growing"
- Make all recommendations feel achievable and supportive
- Provide specific, actionable advice
`;
    
    return prompt;
}
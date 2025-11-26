import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Constants
const GEMINI_MODEL = "gemini-2.5-flash";

// Extend timeout for AI generation (120 seconds)
export const config = {
    runtime: 'nodejs18',
    maxDuration: 360
};

export async function POST({ request }) {
    console.log('=== AI Grade Analysis Request Started ===');

    // Declare variables at top scope for fallback access in catch block
    let db;
    let cacheKey;

    try {
        const { studentId, quarter, schoolYear, forceRefresh = false, previousQuarterInfo = null, cacheOnly = false } = await request.json();
        console.log('Request params:', { studentId, quarter, schoolYear, forceRefresh, cacheOnly, hasPreviousQuarter: !!previousQuarterInfo });

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

        // If cacheOnly is true, ONLY check cache and return 404 if not found
        if (cacheOnly) {
            const cachedAnalysis = await db.collection('ai_grade_analysis_cache').findOne(cacheKey);

            if (cachedAnalysis && cachedAnalysis.analysis) {
                const isValidJSON = typeof cachedAnalysis.analysis === 'object' && cachedAnalysis.analysis.overallInsight;

                if (isValidJSON) {
                    console.log('Cache-only mode: Serving cached AI analysis');
                    return streamCachedAnalysis(cachedAnalysis.analysis);
                }
            }

            // No cache found in cache-only mode - return 404
            console.log('Cache-only mode: No cached analysis found');
            return json({ error: 'No cached analysis available' }, { status: 404 });
        }

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

        // Fetch previous quarter grades if info provided
        let previousQuarterGrades = null;
        if (previousQuarterInfo && previousQuarterInfo.quarter && previousQuarterInfo.schoolYear) {
            console.log(`Fetching previous quarter ${previousQuarterInfo.quarter} (${previousQuarterInfo.schoolYear}) for comparison...`);
            previousQuarterGrades = await db.collection('grades').find({
                student_id: new ObjectId(studentId),
                quarter: previousQuarterInfo.quarter,
                school_year: previousQuarterInfo.schoolYear,
                verified: true
            }).toArray();
            console.log(`Found ${previousQuarterGrades.length} verified grades for previous quarter`);
        }

        // Fetch grade configurations and subject/teacher details
        const gradeAnalysisData = await prepareGradeDataFromDB(db, student, studentGrades, previousQuarterGrades, previousQuarterInfo);

        // Create the prompt for AI analysis
        const prompt = createAnalysisPrompt(gradeAnalysisData);

        // Initialize Google Gemini AI
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Use Gemini 2.5 Flash for fast, efficient JSON responses
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 5000,
                responseMimeType: "application/json", // Force JSON response
            }
        });

        console.log('Using Google Gemini model:', GEMINI_MODEL);

        // Retry logic for AI generation and parsing
        let parsedAnalysis;
        let attempt = 0;
        const maxAttempts = 2;
        let lastError;

        while (attempt < maxAttempts) {
            attempt++;
            console.log(`Making request to Gemini API (Attempt ${attempt}/${maxAttempts})...`);

            try {
                // Generate content using the official SDK
                const result = await model.generateContent(prompt);
                console.log('Gemini API response received');
                const response = result.response;
                const fullAnalysis = response.text();
                console.log('Response text extracted, length:', fullAnalysis.length);

                // Clean and parse the JSON
                parsedAnalysis = parseAiResponse(fullAnalysis);

                // If we got here, parsing was successful
                break;
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error.message);
                lastError = error;
                if (attempt < maxAttempts) {
                    console.log('Retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                }
            }
        }

        if (!parsedAnalysis) {
            throw lastError || new Error('Failed to generate valid analysis after multiple attempts');
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

// Helper function to parse and validate AI response
function parseAiResponse(fullAnalysis) {
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

        // Remove trailing commas (common LLM error)
        // Regex looks for a comma followed by whitespace and then a closing brace or bracket
        cleanedAnalysis = cleanedAnalysis.replace(/,(\s*[}\]])/g, '$1');

        // Parse the JSON
        const parsedAnalysis = JSON.parse(cleanedAnalysis);

        // Validate the structure
        if (!parsedAnalysis.overallInsight || !parsedAnalysis.performanceLevel) {
            throw new Error('Invalid JSON structure - missing required fields');
        }

        return parsedAnalysis;

    } catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        console.error('Raw response (first 500 chars):', fullAnalysis.substring(0, 500));
        throw new Error('Gemini returned invalid JSON format');
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

async function prepareGradeDataFromDB(db, student, studentGrades, previousQuarterGrades = null, previousQuarterInfo = null) {
    // 1. Extract all IDs to fetch in bulk
    const sectionId = student.section_id ? new ObjectId(student.section_id) : null;
    const subjectIds = [...new Set(studentGrades.map(g => g.subject_id.toString()))].map(id => new ObjectId(id));
    const teacherIds = [...new Set(studentGrades.map(g => g.teacher_id.toString()))].map(id => new ObjectId(id));

    // 2. Fire ALL independent queries IN PARALLEL
    const [section, subjects, teachers, sectionStudents, gradeConfigs] = await Promise.all([
        sectionId ? db.collection('sections').findOne({ _id: sectionId }) : null,
        db.collection('subjects').find({ _id: { $in: subjectIds } }).toArray(),
        db.collection('users').find({ _id: { $in: teacherIds } }).toArray(),
        sectionId ? db.collection('section_students').find({ section_id: sectionId }).toArray() : [],
        db.collection('grade_configurations').find({
            section_id: sectionId,
            subject_id: { $in: subjectIds },
            grading_period_id: studentGrades[0]?.quarter
        }).toArray()
    ]);

    // 3. Create lookup maps for O(1) access
    const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));
    const teacherMap = new Map(teachers.map(t => [t._id.toString(), t]));
    const gradeConfigMap = new Map(gradeConfigs.map(gc => [gc.subject_id.toString(), gc]));

    // Calculate overall average
    const totalGrades = studentGrades.reduce((sum, grade) => sum + (grade.averages?.final_grade || 0), 0);
    const overallAverage = studentGrades.length > 0 ? totalGrades / studentGrades.length : 0;

    // Process previous quarter data if available
    let previousQuarterAnalysis = null;
    if (previousQuarterGrades && previousQuarterGrades.length > 0 && previousQuarterInfo) {
        const prevTotalGrades = previousQuarterGrades.reduce((sum, grade) => sum + (grade.averages?.final_grade || 0), 0);
        const prevOverallAverage = previousQuarterGrades.length > 0 ? prevTotalGrades / previousQuarterGrades.length : 0;

        console.log(`Previous quarter average calculated: ${prevOverallAverage} (from ${previousQuarterGrades.length} grades)`);

        // Create subject-by-subject comparison (no DB calls - using cached subjectMap)
        const subjectComparisons = studentGrades.map(currentGrade => {
            const prevGrade = previousQuarterGrades.find(pg =>
                pg.subject_id.toString() === currentGrade.subject_id.toString()
            );

            if (!prevGrade) return null;

            const subject = subjectMap.get(currentGrade.subject_id.toString());
            const currentFinal = currentGrade.averages?.final_grade || 0;
            const prevFinal = prevGrade.averages?.final_grade || 0;
            const change = currentFinal - prevFinal;

            return {
                subjectName: subject?.name || 'Unknown',
                currentGrade: currentFinal,
                previousGrade: prevFinal,
                change: Math.round(change * 100) / 100,
                trend: change > 0 ? 'improved' : change < 0 ? 'declined' : 'stable',
                writtenWork: {
                    current: currentGrade.averages?.written_work || 0,
                    previous: prevGrade.averages?.written_work || 0,
                    change: (currentGrade.averages?.written_work || 0) - (prevGrade.averages?.written_work || 0)
                },
                performanceTasks: {
                    current: currentGrade.averages?.performance_tasks || 0,
                    previous: prevGrade.averages?.performance_tasks || 0,
                    change: (currentGrade.averages?.performance_tasks || 0) - (prevGrade.averages?.performance_tasks || 0)
                },
                quarterlyAssessment: {
                    current: currentGrade.averages?.quarterly_assessment || 0,
                    previous: prevGrade.averages?.quarterly_assessment || 0,
                    change: (currentGrade.averages?.quarterly_assessment || 0) - (prevGrade.averages?.quarterly_assessment || 0)
                }
            };
        }).filter(comp => comp !== null);

        previousQuarterAnalysis = {
            quarter: previousQuarterInfo.quarter,
            schoolYear: previousQuarterInfo.schoolYear,
            overallAverage: Math.round(prevOverallAverage * 100) / 100,
            overallChange: Math.round((overallAverage - prevOverallAverage) * 100) / 100,
            subjectComparisons
        };

        console.log(`Previous quarter analysis prepared:`, {
            quarter: previousQuarterAnalysis.quarter,
            schoolYear: previousQuarterAnalysis.schoolYear,
            overallAverage: previousQuarterAnalysis.overallAverage,
            overallChange: previousQuarterAnalysis.overallChange,
            comparisons: subjectComparisons.length
        });
    }

    // Prepare subject breakdown with detailed score analysis (no DB calls - using cached maps)
    const subjectBreakdown = studentGrades.map(grade => {
        const subject = subjectMap.get(grade.subject_id.toString());
        const teacher = teacherMap.get(grade.teacher_id.toString());
        const gradeConfig = gradeConfigMap.get(grade.subject_id.toString());

        // Build detailed score breakdown
        const writtenWorkDetails = buildScoreDetails(
            grade.scores?.written_work || [],
            gradeConfig?.grade_items?.written_work || [],
            'Written Work'
        );

        const performanceTasksDetails = buildScoreDetails(
            grade.scores?.performance_tasks || [],
            gradeConfig?.grade_items?.performance_tasks || [],
            'Performance Tasks'
        );

        const quarterlyAssessmentDetails = buildScoreDetails(
            grade.scores?.quarterly_assessment || [],
            gradeConfig?.grade_items?.quarterly_assessment || [],
            'Quarterly Assessment'
        );

        return {
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
        };
    });

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
        subjects: subjectBreakdown,
        previousQuarter: previousQuarterAnalysis
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
    const { studentInfo, academicPerformance, subjects, previousQuarter } = gradeData;

    let prompt = `As an educational AI assistant, analyze the academic performance of ${studentInfo.name} (Student ID: ${studentInfo.studentId}), a Grade ${studentInfo.gradeLevel}.

ACADEMIC OVERVIEW:
- Overall Average: ${academicPerformance.overallAverage}
- Total Subjects: ${academicPerformance.totalSubjects}
- Section Size: ${academicPerformance.totalStudentsInSection} students
`;

    // Add previous quarter comparison if available
    if (previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0) {
        const trend = previousQuarter.overallChange > 0 ? '📈 IMPROVED' :
            previousQuarter.overallChange < 0 ? '📉 DECLINED' :
                '➡️ STABLE';

        prompt += `
PREVIOUS QUARTER COMPARISON:
- Previous Quarter: Quarter ${previousQuarter.quarter} (${previousQuarter.schoolYear})
- Previous Overall Average: ${previousQuarter.overallAverage}
- Change: ${previousQuarter.overallChange > 0 ? '+' : ''}${previousQuarter.overallChange} ${trend}

SUBJECT-BY-SUBJECT COMPARISON:
`;

        previousQuarter.subjectComparisons.forEach(comparison => {
            const trendEmoji = comparison.trend === 'improved' ? '📈' :
                comparison.trend === 'declined' ? '📉' : '➡️';

            prompt += `
  ${trendEmoji} ${comparison.subjectName}:
     Current: ${comparison.currentGrade} | Previous: ${comparison.previousGrade} | Change: ${comparison.change > 0 ? '+' : ''}${comparison.change}
     - Written Work: ${comparison.writtenWork.current}% (was ${comparison.writtenWork.previous}%, change: ${comparison.writtenWork.change > 0 ? '+' : ''}${Math.round(comparison.writtenWork.change * 100) / 100})
     - Performance Tasks: ${comparison.performanceTasks.current}% (was ${comparison.performanceTasks.previous}%, change: ${comparison.performanceTasks.change > 0 ? '+' : ''}${Math.round(comparison.performanceTasks.change * 100) / 100})
     - Quarterly Assessment: ${comparison.quarterlyAssessment.current}% (was ${comparison.quarterlyAssessment.previous}%, change: ${comparison.quarterlyAssessment.change > 0 ? '+' : ''}${Math.round(comparison.quarterlyAssessment.change * 100) / 100})
`;
        });
    } else {
        console.log('No previous quarter data available for comparison');
    }

    prompt += `
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
${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? '\n⚠️ IMPORTANT: Include analysis of the previous quarter comparison data. Recognize improvements, acknowledge declines with encouragement, and identify patterns across quarters.\n' : ''}
Return a JSON object with this EXACT structure:

{
  "overallInsight": "A 2-3 sentence warm, personalized opening that recognizes the student's overall performance and effort${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? '. MUST mention their progress compared to the previous quarter (improved/declined/stable) with specific numbers' : ''}",
  "performanceLevel": "excellent|good|satisfactory|needs-improvement",
  ${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? `"quarterComparison": {
    "overallTrend": "improved|declined|stable",
    "changeAmount": ${previousQuarter.overallChange},
    "insight": "2-3 sentences analyzing the trend. If improved, celebrate it! If declined, offer encouragement and identify possible causes. If stable, discuss consistency.",
    "notableChanges": [
      {
        "subject": "Subject name with biggest change",
        "change": 5.5,
        "observation": "What this change might indicate"
      }
    ]
  },
  ` : ''}"strengths": [
    {
      "subject": "Subject name",
      "score": 95.5,
      "reason": "Specific reason why this is a strength (mention specific assessment types and scores${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? ', and note if this improved from last quarter' : ''})"
    }
  ],
  "areasForGrowth": [
    {
      "subject": "Subject name", 
      "score": 75.0,
      "currentGap": "Brief description of the gap${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? ' and how it changed from last quarter' : ''}",
      "potential": "Encouraging note about potential for improvement"
    }
  ],
  "assessmentInsights": {
    "writtenWork": {
      "average": 85.5,
      "performance": "excellent|good|satisfactory|needs-improvement",
      "insight": "Brief encouraging insight about written work performance${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? ' (mention if improved from last quarter)' : ''}"
    },
    "performanceTasks": {
      "average": 82.3,
      "performance": "excellent|good|satisfactory|needs-improvement", 
      "insight": "Brief encouraging insight about performance tasks${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? ' (mention if improved from last quarter)' : ''}"
    },
    "quarterlyAssessment": {
      "average": 88.0,
      "performance": "excellent|good|satisfactory|needs-improvement",
      "insight": "Brief encouraging insight about quarterly assessments${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? ' (mention if improved from last quarter)' : ''}"
    }
  },
  "actionPlan": [
    {
      "priority": "high|medium|low",
      "title": "Short action title",
      "description": "Specific, encouraging action step${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? '. For subjects that declined, suggest specific strategies to recover. For improved subjects, suggest maintaining momentum' : ''}",
      "expectedImpact": "What improvement this could bring"
    }
  ],
  "studyRecommendations": {
    "timeManagement": "Specific time management tip",
    "focusAreas": ["Subject 1", "Subject 2"],
    "strengthsToLeverage": "How to use their strengths to improve weaker areas${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? '. Mention patterns observed across quarters' : ''}"
  }
}

REQUIREMENTS:
- Use warm, second-person perspective in all text fields ("you", "your")
- Round all numeric scores to one decimal place
- Include MAXIMUM 3 items in strengths array (top performing subjects)
- Include 2-3 items in areasForGrowth array (subjects needing attention) - MINIMUM 2, MAXIMUM 3
- Include MAXIMUM 5 items in actionPlan array, ordered by priority (high/medium/low)
- ${previousQuarter && previousQuarter.subjectComparisons && previousQuarter.subjectComparisons.length > 0 ? '- CRITICAL: Thoroughly analyze the quarter-over-quarter comparison. This is valuable data!\n- Celebrate improvements enthusiastically. For declines, be supportive and solution-focused\n- Identify subjects that consistently perform well or poorly across quarters\n- ' : ''}- Be genuinely encouraging while staying honest
- Use growth mindset language - frame weaknesses as opportunities
- Avoid judgmental words like "poor", "bad", "failing" - use "developing", "emerging", "growing"
- Make all recommendations feel achievable and supportive
- Provide specific, actionable advice

CRITICAL JSON FORMATTING RULES:
1. Output MUST be valid, parseable JSON.
2. Do NOT include markdown formatting (like \`\`\`json).
3. Strictly escape all double quotes within strings (e.g., use \\" instead of ").
4. Do NOT include trailing commas in arrays or objects.
5. Ensure all property names are enclosed in double quotes.
`;

    return prompt;
}
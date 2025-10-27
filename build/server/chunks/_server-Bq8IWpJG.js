import { j as json } from './index-CccDCyu_.js';
import dotenv from 'dotenv';
import { a as connectToDatabase } from './db-C-gxO138.js';
import { ObjectId } from 'mongodb';

dotenv.config();
async function POST({ request }) {
  try {
    const { studentId, quarter, schoolYear } = await request.json();
    if (!studentId) {
      return json({ error: "Missing student ID" }, { status: 400 });
    }
    const db = await connectToDatabase();
    const student = await db.collection("users").findOne({ _id: new ObjectId(studentId) });
    if (!student) {
      return json({ error: "Student not found" }, { status: 404 });
    }
    const gradesQuery = {
      student_id: new ObjectId(studentId),
      verified: true
      // Only fetch verified grades
    };
    if (quarter) gradesQuery.quarter = quarter;
    if (schoolYear) gradesQuery.school_year = schoolYear;
    const studentGrades = await db.collection("grades").find(gradesQuery).toArray();
    if (studentGrades.length === 0) {
      return json({ error: "No grades found for this student" }, { status: 404 });
    }
    const gradeAnalysisData = await prepareGradeDataFromDB(db, student, studentGrades);
    const prompt = createAnalysisPrompt(gradeAnalysisData);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_AI_KEY}`,
        "HTTP-Referer": "",
        "X-Title": "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2e3,
        temperature: 0.7,
        stream: true
        // Enable streaming
      })
    });
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
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
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
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
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    console.error("AI Grade Analysis Error:", error);
    return json({
      error: "Failed to generate AI analysis",
      details: error.message
    }, { status: 500 });
  }
}
async function prepareGradeDataFromDB(db, student, studentGrades) {
  const section = student.section_id ? await db.collection("sections").findOne({ _id: new ObjectId(student.section_id) }) : null;
  const totalGrades = studentGrades.reduce((sum, grade) => sum + (grade.averages?.final_grade || 0), 0);
  const overallAverage = studentGrades.length > 0 ? totalGrades / studentGrades.length : 0;
  const sectionStudents = section ? await db.collection("section_students").find({ section_id: new ObjectId(student.section_id) }).toArray() : [];
  const subjectBreakdown = [];
  for (const grade of studentGrades) {
    const subject = await db.collection("subjects").findOne({ _id: new ObjectId(grade.subject_id) });
    const teacher = await db.collection("users").findOne({ _id: new ObjectId(grade.teacher_id) });
    const gradeConfig = await db.collection("grade_configurations").findOne({
      section_id: new ObjectId(grade.section_id),
      subject_id: new ObjectId(grade.subject_id),
      grading_period_id: grade.quarter
    });
    const writtenWorkDetails = buildScoreDetails(
      grade.written_work || [],
      gradeConfig?.grade_items?.writtenWork || [],
      "Written Work"
    );
    const performanceTasksDetails = buildScoreDetails(
      grade.performance_tasks || [],
      gradeConfig?.grade_items?.performanceTasks || [],
      "Performance Tasks"
    );
    const quarterlyAssessmentDetails = buildScoreDetails(
      grade.quarterly_assessment || [],
      gradeConfig?.grade_items?.quarterlyAssessment || [],
      "Quarterly Assessment"
    );
    subjectBreakdown.push({
      name: subject?.name || "Unknown Subject",
      teacher: teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown Teacher",
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
      gradeLevel: student.grade_level || "N/A",
      section: section?.name || "N/A",
      studentId: student.student_id || "N/A"
    },
    academicPerformance: {
      overallAverage: Math.round(overallAverage * 100) / 100,
      totalSubjects: studentGrades.length,
      totalStudentsInSection: sectionStudents.length || "N/A"
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
    const percentage = totalScore > 0 ? Math.round(score / totalScore * 100 * 100) / 100 : 0;
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
  subjects.forEach((subject) => {
    prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 ${subject.name} (Teacher: ${subject.teacher})
Quarter: ${subject.quarter} | School Year: ${subject.schoolYear}
Verified: ${subject.verified ? "Yes ✓" : "No ✗"}

Overall Grade: ${subject.overallGrade}

Component Averages:
- Written Work: ${subject.writtenWorkAverage}% (${subject.writtenWorkDetails.count} items)
- Performance Tasks: ${subject.performanceTasksAverage}% (${subject.performanceTasksDetails.count} items)  
- Quarterly Assessment: ${subject.quarterlyAssessmentAverage}% (${subject.quarterlyAssessmentDetails.count} items)
`;
    if (subject.writtenWorkDetails.items.length > 0) {
      prompt += `
📝 Written Work Details:
`;
      subject.writtenWorkDetails.items.forEach((item, idx) => {
        prompt += `   ${idx + 1}. ${item.name}: ${item.score}/${item.totalScore} (${item.percentage}%)
`;
      });
    }
    if (subject.performanceTasksDetails.items.length > 0) {
      prompt += `
🎯 Performance Tasks Details:
`;
      subject.performanceTasksDetails.items.forEach((item, idx) => {
        prompt += `   ${idx + 1}. ${item.name}: ${item.score}/${item.totalScore} (${item.percentage}%)
`;
      });
    }
    if (subject.quarterlyAssessmentDetails.items.length > 0) {
      prompt += `
📊 Quarterly Assessment Details:
`;
      subject.quarterlyAssessmentDetails.items.forEach((item, idx) => {
        prompt += `   ${idx + 1}. ${item.name}: ${item.score}/${item.totalScore} (${item.percentage}%)
`;
      });
    }
  });
  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on the comprehensive grade data above, provide a detailed analysis in the following format:

**STRENGTHS:**
- Identify the student's strongest subjects and specific assessment types
- Highlight exceptional individual scores and consistent high performance
- Point out subjects where all assessment types show excellence

**AREAS FOR IMPROVEMENT:**
- Identify subjects or specific assessment types that need attention
- Point out individual low scores and patterns of weakness
- Note any subjects with inconsistent performance across assessment types

**RECOMMENDATIONS:**
- Provide specific, actionable advice based on actual score patterns
- Suggest which specific assessment types (WW/PT/QA) to focus on per subject
- Recommend study strategies tailored to the identified weaknesses
- Prioritize subjects that need immediate attention

**PERFORMANCE PATTERNS:**
- Analyze consistency across different assessment types (Written Work vs Performance Tasks vs Quarterly Assessment)
- Identify if the student performs better in certain types of assessments
- Note any subjects showing improvement or decline trends
- Comment on overall score distribution and variability

**ACTIONABLE INSIGHTS:**
- Provide 3-5 concrete next steps the student should take
- Suggest specific areas to review or practice
- Recommend time allocation across subjects based on current performance

KEEP THIS IN MIND:
Keep the analysis professional, constructive, and data-driven. Focus on actionable insights based on the actual scores provided. Use a supportive tone while being honest about areas needing improvement. Reference specific scores and subjects when making observations.
Make the response first-person perspective don't use "This student", use "You"
Dont Use percentage when stating numbers as all data is a numeric value.
Also please remain the decimal to nearest tenth.
`;
  return prompt;
}

export { POST };
//# sourceMappingURL=_server-Bq8IWpJG.js.map

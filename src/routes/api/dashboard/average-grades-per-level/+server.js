import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';

/**
 * Determines the current quarter based on the system date and admin settings
 */
async function getCurrentQuarterAndSchoolYear(db) {
  const adminSettingsCollection = db.collection('admin_settings');
  
  const quarterSettings = await adminSettingsCollection.find({
    setting_key: { 
      $in: [
        'quarter_1_start_date', 'quarter_1_end_date',
        'quarter_2_start_date', 'quarter_2_end_date',
        'quarter_3_start_date', 'quarter_3_end_date',
        'quarter_4_start_date', 'quarter_4_end_date',
        'current_school_year'
      ]
    }
  }).toArray();

  const settings = {};
  quarterSettings.forEach(row => {
    settings[row.setting_key] = row.setting_value;
  });
  
  const currentSchoolYear = settings.current_school_year || '2025-2026';
  
  // Parse date in MM-DD-YYYY format
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [month, day, year] = parts.map(p => parseInt(p, 10));
    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const quarters = [
    { quarter: 1, startDate: parseDate(settings.quarter_1_start_date), endDate: parseDate(settings.quarter_1_end_date) },
    { quarter: 2, startDate: parseDate(settings.quarter_2_start_date), endDate: parseDate(settings.quarter_2_end_date) },
    { quarter: 3, startDate: parseDate(settings.quarter_3_start_date), endDate: parseDate(settings.quarter_3_end_date) },
    { quarter: 4, startDate: parseDate(settings.quarter_4_start_date), endDate: parseDate(settings.quarter_4_end_date) }
  ];

  let currentQuarter = 1; // Default to quarter 1
  
  for (const quarter of quarters) {
    if (quarter.startDate && quarter.endDate && today >= quarter.startDate && today <= quarter.endDate) {
      currentQuarter = quarter.quarter;
      break;
    }
  }

  return { currentQuarter, currentSchoolYear };
}

// GET /api/dashboard/average-grades-per-level - Fetch average grades per grade level for current quarter
export async function GET() {
  try {
    // Connect to MongoDB
    const db = await connectToDatabase();
    
    // Get current quarter and school year
    const { currentQuarter, currentSchoolYear } = await getCurrentQuarterAndSchoolYear(db);
    
    // Aggregate average grades by grade level for current quarter and school year
    const averageGrades = await db.collection('grades').aggregate([
      {
        $match: {
          'averages.final_grade': { $exists: true, $ne: null, $gt: 0 },
          quarter: currentQuarter,
          school_year: currentSchoolYear
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $match: {
          'student.account_type': 'student',
          'student.grade_level': { $exists: true },
          $or: [
            { 'student.status': { $exists: false } },
            { 'student.status': 'active' }
          ]
        }
      },
      {
        $group: {
          _id: '$student.grade_level',
          average_grade: { $avg: '$averages.final_grade' },
          total_grades: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          grade_level: '$_id',
          average_grade: { $round: ['$average_grade', 2] },
          total_grades: 1
        }
      },
      {
        $sort: { grade_level: 1 }
      }
    ]).toArray();
    
    return json({ 
      success: true, 
      data: averageGrades,
      metadata: {
        currentQuarter,
        currentSchoolYear
      }
    });
    
  } catch (error) {
    console.error('Error fetching average grades per level:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch average grades per level' 
    }, { status: 500 });
  }
}

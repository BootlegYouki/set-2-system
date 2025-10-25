import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';

export async function GET({ request, url }) {
    try {
        const db = await connectToDatabase();

        // Aggregate sections by grade level
        const sectionsData = await db.collection('sections').aggregate([
            {
                $match: {
                    status: 'active'
                }
            },
            {
                $group: {
                    _id: '$grade_level',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();

        // Transform data to match expected format
        const transformedData = sectionsData.map(item => ({
            grade_level: item._id.toString(),
            section_count: item.count
        }));

        return json({
            success: true,
            data: transformedData,
            metadata: {
                total_sections: sectionsData.reduce((sum, item) => sum + item.count, 0),
                grade_levels: sectionsData.length
            }
        });

    } catch (error) {
        console.error('Error fetching sections per grade:', error);
        return json({
            success: false,
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
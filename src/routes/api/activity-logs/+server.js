import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';

// POST - Log a new activity
export async function POST({ request, getClientAddress }) {
	try {
		const { activity_type, user_id, user_account_number, activity_data } = await request.json();

		// Validate required fields
		if (!activity_type) {
			return json({ error: 'Activity type is required' }, { status: 400 });
		}

		// Get client IP and user agent
		const ip_address = getClientAddress();
		const user_agent = request.headers.get('user-agent');

		// Log the activity using the database function
		const result = await query(
			'SELECT log_activity($1, $2, $3, $4, $5, $6) as log_id',
			[
				activity_type,
				user_id || null,
				user_account_number || null,
				JSON.stringify(activity_data || {}),
				ip_address,
				user_agent
			]
		);

		return json({
			success: true,
			log_id: result.rows[0].log_id,
			message: 'Activity logged successfully'
		});
	} catch (error) {
		console.error('Error logging activity:', error);
		return json({ error: 'Failed to log activity' }, { status: 500 });
	}
}

// GET - Fetch recent activities
export async function GET({ url }) {
	try {
		const limit = parseInt(url.searchParams.get('limit')) || 10;
		const offset = parseInt(url.searchParams.get('offset')) || 0;
		const activity_type = url.searchParams.get('type');

		let sqlQuery = `
			SELECT 
				al.id,
				al.activity_type,
				al.user_id,
				al.user_account_number,
				al.activity_data,
				al.ip_address,
				al.created_at,
				u.full_name as user_full_name,
				u.account_type as user_account_type
			FROM activity_logs al
			LEFT JOIN users u ON al.user_id = u.id
		`;
		
		const params = [];
		
		if (activity_type) {
			sqlQuery += ' WHERE al.activity_type = $1';
			params.push(activity_type);
		}
		
		sqlQuery += ' ORDER BY al.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
		params.push(limit, offset);

		const result = await query(sqlQuery, params);

		// Transform the data for frontend consumption
		const activities = result.rows.map(row => {
			const data = row.activity_data;
			let message = '';
			let icon = 'info';
			
			// Determine who performed the action
			const performedBy = row.user_full_name || 
			                   (row.user_account_number && row.user_account_number !== 'TEST-001' ? row.user_account_number : null) ||
			                   'System';

			// Generate human-readable messages based on activity type and data
			switch (row.activity_type) {
				case 'account_created':
					if (data.account_type === 'student') {
						message = `New student account created: ${data.full_name} (${row.user_account_number})`;
						icon = 'person_add';
					} else if (data.account_type === 'teacher') {
						message = `New teacher account created: ${data.full_name} (${row.user_account_number})`;
						icon = 'person_add';
					} else {
						message = `New ${data.account_type} account created: ${data.full_name} (${row.user_account_number})`;
						icon = 'person_add';
					}
					break;
				case 'schedule_assigned':
					message = `Schedule assigned to ${data.section} for ${data.room}`;
					icon = 'schedule';
					break;
				case 'room_created':
					message = `New room created: ${data.room_name} (${data.building}, Floor ${data.floor})`;
					icon = 'meeting_room';
					break;
				case 'section_created':
					message = `New section created: ${data.section_name}`;
					icon = 'class';
					break;
				case 'user_login':
					message = `User logged in: ${data.full_name || row.user_account_number}`;
					icon = 'login';
					break;
				case 'user_logout':
					message = `User logged out: ${data.full_name || row.user_account_number}`;
					icon = 'logout';
					break;
				case 'account_updated':
					message = `Account updated: ${data.full_name || row.user_account_number}`;
					icon = 'edit';
					break;
				case 'account_archived':
					message = `Account archived: ${data.full_name || row.user_account_number}`;
					icon = 'archive';
					break;
				case 'subject_created':
					message = `New subject created: ${data.name} (${data.code})`;
					icon = 'book';
					break;
				case 'subject_updated':
					message = `Subject updated: ${data.name} (${data.code})`;
					icon = 'edit';
					break;
				case 'account_deleted':
					message = `Account deleted: ${data.full_name || row.user_account_number}`;
					icon = 'delete';
					break;
				case 'account_restored':
					message = `Student restored: ${data.full_name || row.user_account_number}`;
					icon = 'restore';
					break;
				case 'subject_deleted':
					message = `Subject deleted: ${data.subject_name}`;
					icon = 'delete';
					break;
				default:
					message = `${row.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
					icon = 'info';
			}

			// Calculate relative time using UTC to avoid timezone issues
			const now = new Date();
			const activityTime = new Date(row.created_at);
			
			// Ensure both dates are in UTC for accurate comparison
			const nowUTC = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
			const activityTimeUTC = new Date(activityTime.getTime());
			
			const diffMs = nowUTC - activityTimeUTC;
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMins / 60);
			const diffDays = Math.floor(diffHours / 24);

			// Format timestamp as YYYY/MM/DD - HH:MM (24hr format) in local timezone
			// Use toLocaleString to get proper local time formatting and add 8 minutes offset
			const adjustedTime = new Date(activityTime.getTime() + (8 * 60 * 1000)); // Add 8 minutes
			const localTimeString = adjustedTime.toLocaleString('en-CA', {
				timeZone: 'Asia/Singapore',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});
			
			// Convert from YYYY-MM-DD, HH:MM to YYYY/MM/DD - HH:MM format
			const timestamp = localTimeString.replace(/(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2})/, '$1/$2/$3 - $4:$5');

			return {
				id: row.id,
				type: row.activity_type,
				message,
				timestamp,
				icon,
				created_at: row.created_at,
				data: row.activity_data,
				user_name: row.user_full_name,
				user_account_number: row.user_account_number,
				performed_by: performedBy
			};
		});

		return json({
			success: true,
			activities,
			total: result.rows.length,
			limit,
			offset
		});
	} catch (error) {
		console.error('Error fetching activities:', error);
		return json({ error: 'Failed to fetch activities' }, { status: 500 });
	}
}
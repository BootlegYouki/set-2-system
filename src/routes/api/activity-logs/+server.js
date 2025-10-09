import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';

// Helper function to format time from 24-hour to 12-hour AM/PM format
function formatTime(timeString) {
	if (!timeString) return timeString;
	
	// Handle both HH:MM:SS and HH:MM formats
	const timeParts = timeString.split(':');
	let hours = parseInt(timeParts[0]);
	const minutes = timeParts[1];
	
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // 0 should be 12
	
	return `${hours}:${minutes} ${ampm}`;
}

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

		// Connect to MongoDB
		const db = await connectToDatabase();
		const collection = db.collection('activity_logs');

		// Create activity log document
		const activityLog = {
			activity_type,
			user_id: user_id ? new ObjectId(user_id) : null,
			user_account_number: user_account_number || null,
			activity_data: activity_data || {},
			ip_address,
			user_agent,
			created_at: new Date()
		};

		// Insert the activity log
		const result = await collection.insertOne(activityLog);

		return json({
			success: true,
			log_id: result.insertedId.toString(),
			message: 'Activity logged successfully'
		});
	} catch (error) {
		console.error('Error logging activity:', error);
		return json({ error: 'Failed to log activity' }, { status: 500 });
	}
}

// GET - Fetch recent activities
export async function GET({ url }) {
	// Helper function to format time to AM/PM format (for GET function)
	function formatTimeInGet(timeString) {
		if (!timeString) return '';
		
		try {
			// Handle different time formats
			let time;
			if (timeString.includes(':')) {
				// Format: "HH:MM" or "HH:MM:SS"
				const [hours, minutes] = timeString.split(':');
				time = new Date();
				time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
			} else {
				// Assume it's already a Date object or timestamp
				time = new Date(timeString);
			}
			
			return time.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		} catch (error) {
			return timeString; // Return original if formatting fails
		}
	}

	try {
		const limit = parseInt(url.searchParams.get('limit')) || 10;
		const offset = parseInt(url.searchParams.get('offset')) || 0;
		const activity_type = url.searchParams.get('type');

		// Connect to MongoDB
		const db = await connectToDatabase();
		const activityLogsCollection = db.collection('activity_logs');

		// Build aggregation pipeline to join with users collection and filter for admin users only
		const pipeline = [
			{
				$lookup: {
					from: 'users',
					localField: 'user_id',
					foreignField: '_id',
					as: 'user'
				}
			},
			{
				$unwind: {
					path: '$user',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					$or: [
						{ 'user.account_type': 'admin' },
						{ user: { $exists: false } }
					]
				}
			}
		];

		// Add activity type filter if specified
		if (activity_type) {
			pipeline.push({
				$match: {
					$or: [
						{ activity_type: activity_type },
						{ action: activity_type }
					]
				}
			});
		}

		// Add sorting, skip, and limit
		pipeline.push(
			{ $sort: { created_at: -1, timestamp: -1 } },
			{ $skip: offset },
			{ $limit: limit }
		);

		const result = await activityLogsCollection.aggregate(pipeline).toArray();

		// Transform the data for frontend consumption
		const activities = result.map((row) => {
			let message = '';
			let icon = 'info';
			
			// Determine who performed the action - use full name from user lookup
			const performedBy = row.user?.full_name || 
			                   (row.user_account_number && row.user_account_number !== 'TEST-001' ? row.user_account_number : null) ||
			                   (row.account_number && row.account_number !== 'TEST-001' ? row.account_number : null) ||
			                   'System';

			// Handle both 'activity_type' and 'action' field names for backward compatibility
			const activityType = row.activity_type || row.action;

			// Handle both 'activity_data' and 'details' field names for backward compatibility
			const data = row.activity_data || row.details || {};

			// Generate human-readable messages based on activity type and data
			switch (activityType) {
				case 'account_created':
					if (data.account_type === 'student') {
						message = `New student account created: ${data.full_name} (${data.account_number || row.user_account_number || 'N/A'})`;
						icon = 'person_add';
					} else if (data.account_type === 'teacher') {
						message = `New teacher account created: ${data.full_name} (${data.account_number || row.user_account_number || 'N/A'})`;
						icon = 'person_add';
					} else {
						message = `New ${data.account_type} account created: ${data.full_name} (${data.account_number || row.user_account_number || 'N/A'})`;
						icon = 'person_add';
					}
					break;
				
				case 'schedule_assigned':
					message = `Schedule assigned to ${data.section} for ${data.room}`;
					icon = 'schedule';
					break;
				
				case 'schedule_created':
					// Format the times to AM/PM format
					const formattedStartTimeCreated = formatTimeInGet(data.start_time);
					const formattedEndTimeCreated = formatTimeInGet(data.end_time);
					
					// Capitalize the schedule type and day of week
					const scheduleTypeCreated = data.schedule_type ? data.schedule_type.charAt(0).toUpperCase() + data.schedule_type.slice(1) : 'Class';
					const dayOfWeekCreated = data.day_of_week ? data.day_of_week.charAt(0).toUpperCase() + data.day_of_week.slice(1) : '';
					
					let sectionInfoCreated = '';
					if (data.section_name) {
						sectionInfoCreated = ` for section ${data.section_name}`;
					}
					
					message = `Schedule created${sectionInfoCreated} - ${scheduleTypeCreated} on ${dayOfWeekCreated} (${formattedStartTimeCreated} - ${formattedEndTimeCreated})`;
					icon = 'add_circle';
					break;
				
				case 'schedule_deleted':
					// Format the times to AM/PM format
					const formattedStartTime = formatTimeInGet(data.start_time);
					const formattedEndTime = formatTimeInGet(data.end_time);
					
					// Capitalize the schedule type and day of week
					const scheduleType = data.schedule_type ? data.schedule_type.charAt(0).toUpperCase() + data.schedule_type.slice(1) : 'Class';
					const dayOfWeek = data.day_of_week ? data.day_of_week.charAt(0).toUpperCase() + data.day_of_week.slice(1) : '';
					
					let sectionInfo = '';
					if (data.section_name) {
						sectionInfo = ` for Section ${data.section_name}`;
					}
					
					message = `Schedule deleted${sectionInfo} - ${scheduleType} on ${dayOfWeek} (${formattedStartTime} - ${formattedEndTime})`;
					icon = 'delete';
					break;
				
				case 'room_created':
					message = `New room created: ${data.room_name} (${data.building}, Floor ${data.floor})`;
					icon = 'meeting_room';
					break;
				
				case 'section_created':
					message = `New section created: ${data.section_name}`;
					icon = 'class';
					break;
				
				case 'section_updated':
					message = `Section updated: ${data.section_name}`;
					icon = 'edit';
					break;
				
				case 'section_adviser_changed':
					const oldAdviser = data.old_adviser ? `${data.old_adviser.name} (${data.old_adviser.account_number})` : 'No adviser';
					const newAdviser = data.new_adviser ? `${data.new_adviser.name} (${data.new_adviser.account_number})` : 'No adviser';
					message = `Section adviser changed for ${data.section_name}: ${oldAdviser} → ${newAdviser}`;
					icon = 'swap_horiz';
					break;
				
				case 'section_student_added':
				case 'student_added_to_section':
				case 'student_added':
					message = `Student added to ${data.section_name}: ${data.student ? data.student.name || data.student.full_name : data.full_name || 'Unknown Student'} ${data.student ? `(${data.student.account_number})` : data.account_number ? `(${data.account_number})` : ''}`;
					icon = 'person_add';
					break;
				
				case 'section_student_removed':
				case 'student_removed_from_section':
				case 'student_removed':
					message = `Student removed from ${data.section_name}: ${data.student ? data.student.name || data.student.full_name : data.full_name || 'Unknown Student'} ${data.student ? `(${data.student.account_number})` : data.account_number ? `(${data.account_number})` : ''}`;
					icon = 'person_remove';
					break;
				
				case 'student_enrolled_to_section':
					message = `Student enrolled to ${data.section_name}: ${data.student ? data.student.name || data.student.full_name : data.full_name || 'Unknown Student'} ${data.student ? `(${data.student.account_number})` : data.account_number ? `(${data.account_number})` : ''}`;
					icon = 'person_add';
					break;
				
				case 'user_login':
				case 'login':
					message = `User logged in: ${data.full_name || performedBy}`;
					icon = 'login';
					break;
				
				case 'user_logout':
				case 'logout':
					message = `User logged out: ${data.full_name || performedBy}`;
					icon = 'logout';
					break;
				
				case 'account_updated':
					message = `Account updated: ${data.full_name || performedBy}`;
					icon = 'edit';
					break;
				
				case 'account_archived':
				case 'student_archived':
				case 'archive':
					message = `Account archived: ${data.full_name || performedBy}`;
					icon = 'archive';
					break;
				
				case 'account_deleted':
					message = `Account deleted: ${data.full_name || performedBy}`;
					icon = 'delete';
					break;
				
				case 'subject_created':
					message = `New subject created: ${data.name} (${data.code})`;
					icon = 'book';
					break;
				
				case 'subject_updated':
					message = `Subject updated: ${data.name} (${data.code})`;
					icon = 'edit';
					break;
				
				case 'account_restored':
				case 'restore':
					if (data.account_type === 'student') {
						message = `Student restored: ${data.full_name || performedBy}`;
					} else if (data.account_type === 'teacher') {
						message = `Teacher restored: ${data.full_name || performedBy}`;
					} else {
						message = `Account restored: ${data.full_name || performedBy}`;
					}
					icon = 'restore';
					break;
				
				case 'subject_deleted':
					message = `Subject deleted: ${data.subject_name} (${data.subject_code})`;
					icon = 'delete';
					break;
				
				case 'room_updated':
					message = `Updated room: ${data.room_name}`;
					icon = 'edit';
					break;
				
				case 'department_created':
					message = `Created department: ${data.department_name} (${data.department_code})`;
					icon = 'corporate_fare';
					break;
				
				case 'department_updated':
					message = `Updated department: ${data.department_name} (${data.department_code})`;
					icon = 'edit';
					break;
				
				case 'department_deleted':
					message = `Deleted department: ${data.department_name} (${data.department_code})`;
					icon = 'delete';
					break;
				
				case 'department_teacher_assigned':
				case 'teacher_assigned':
					const assignedTeachers = data.teachers && data.teachers.length > 0 ? 
						data.teachers.map(t => t.name || t.full_name).join(', ') : 
						data.teacher_names || data.full_name || 'teachers';
					message = `Assigned teachers to department "${data.department_name}": ${assignedTeachers}`;
					icon = 'person_add';
					break;
				
				case 'activity_type_created':
					message = `Activity type created: ${data.name} (${data.code})`;
					icon = 'add';
					break;
				
				case 'activity_type_updated':
					message = `Activity type updated: ${data.name} (${data.code})`;
					icon = 'edit';
					break;
				
				case 'activity_type_deleted':
					message = `Activity type deleted: ${data.name} (${data.code})`;
					icon = 'delete';
					break;
				
				case 'department_teacher_removed':
				case 'teacher_removed':
					const removedTeachers = data.teachers && data.teachers.length > 0 ? 
						data.teachers.map(t => t.name || t.full_name).join(', ') : 
						data.teacher_names || data.full_name || 'teachers';
					message = `Removed teachers from department "${data.department_name}": ${removedTeachers}`;
					icon = 'person_remove';
					break;
				
				case 'department_subject_assigned':
				case 'subject_assigned':
					const assignedSubjects = data.subjects && data.subjects.length > 0 ? 
						data.subjects.map(s => s.name).join(', ') : 
						data.subject_names || 'subjects';
					message = `Assigned subjects to department "${data.department_name}": ${assignedSubjects}`;
					icon = 'book';
					break;
				
				case 'department_subject_removed':
				case 'subject_removed':
					const removedSubjects = data.subjects && data.subjects.length > 0 ? 
						data.subjects.map(s => s.name).join(', ') : 
						data.subject_names || 'subjects';
					message = `Removed subjects from department "${data.department_name}": ${removedSubjects}`;
					icon = 'book';
					break;
				
				case 'room_deleted':
					message = `Room deleted: ${data.room_name} (${data.building}, Floor ${data.floor})`;
					icon = 'delete';
					break;
				
				case 'room_sections_assigned':
				case 'section_assigned':
				case 'assignment':
					const assignedSectionNames = data.section_names ? 
						(Array.isArray(data.section_names) ? data.section_names.join(', ') : data.section_names) : 
						data.sections || 'sections';
					message = `Sections assigned to room "${data.room_name}": ${assignedSectionNames}`;
					icon = 'assignment';
					break;
				
				case 'room_sections_unassigned':
				case 'section_unassigned':
				case 'assignment_return':
					const unassignedSectionNames = data.unassigned_sections ? 
						data.unassigned_sections.map(s => s.name).join(', ') : 
						data.section_names || data.sections || 'all sections';
					message = `Sections unassigned from room "${data.room_name}": ${unassignedSectionNames}`;
					icon = 'assignment_return';
					break;
				
				case 'section_deleted':
					message = `Section deleted: ${data.section_name} (Grade ${data.grade_level})`;
					icon = 'delete';
					break;
				
				case 'password_changed':
					message = `Password changed: ${data.full_name || performedBy}`;
					icon = 'key';
					break;
				
				case 'profile_updated':
					message = `Profile updated: ${data.full_name || performedBy}`;
					icon = 'edit';
					break;
				
				default:
					const actionText = typeof activityType === 'string' ? activityType : 'Unknown Action';
					message = `${actionText.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${data.full_name || performedBy || 'System'}`;
					icon = 'info';
			}
			
			// Get timestamp
			const activityTime = new Date(row.created_at || row.timestamp);
			const timestamp = activityTime.toLocaleString('en-US', {
				month: '2-digit',
				day: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			}).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2})/, '$1/$2/$3 - $4:$5');

			return {
				id: row._id.toString(),
				type: activityType,
				message,
				timestamp,
				icon,
				created_at: row.created_at || row.timestamp,
				data: data,
				user_name: row.user?.full_name,
				user_account_number: row.user_account_number || row.account_number,
				performed_by: performedBy
			};
		});

		return json({
			success: true,
			activities,
			total: result.length,
			limit,
			offset
		});
	} catch (error) {
		console.error('Error fetching activities:', error);
		return json({ error: 'Failed to fetch activities' }, { status: 500 });
	}
}
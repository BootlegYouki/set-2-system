import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';
import bcrypt from 'bcrypt';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, getClientAddress }) {
	try {
		// Verify authentication
		const authResult = await verifyAuth(request, ['admin', 'teacher', 'student']);
		if (!authResult.success) {
			return json({ error: authResult.error }, { status: authResult.status });
		}

		const body = await request.json();
		const { currentPassword, newPassword } = body;

		// Validate input
		if (!currentPassword || !newPassword) {
			return json(
				{ error: 'Current password and new password are required' },
				{ status: 400 }
			);
		}

		if (newPassword.length < 8) {
			return json(
				{ error: 'New password must be at least 8 characters long' },
				{ status: 400 }
			);
		}

		// Get current user's password hash
		const userResult = await query(
			'SELECT password_hash FROM users WHERE id = $1',
			[authResult.user.id]
		);

		if (userResult.rows.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword, 
			userResult.rows[0].password_hash
		);

		if (!isCurrentPasswordValid) {
			return json(
				{ error: 'Current password is incorrect' },
				{ status: 401 }
			);
		}

		// Hash new password
		const newPasswordHash = await bcrypt.hash(newPassword, 10);

		// Update password in database
		await query(
			'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
			[newPasswordHash, authResult.user.id]
		);

		// Get client IP and user agent
		const ip_address = getClientAddress();

		// Log the activity (without sensitive data)
		await query(
			`SELECT log_activity($1, $2, $3, $4, $5, $6)`,
			[
				'password_changed',
				authResult.user.id,
				authResult.user.account_number,
				JSON.stringify({ action: 'password_change_successful' }),
				ip_address,
				request.headers.get('user-agent')
			]
		);

		return json({
			success: true,
			message: 'Password changed successfully'
		});

	} catch (error) {
		console.error('Error changing password:', error);
		return json(
			{ error: 'Failed to change password' },
			{ status: 500 }
		);
	}
}
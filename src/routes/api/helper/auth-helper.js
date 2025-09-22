import { query } from '../../../database/db.js';

/**
 * Extract user information from request headers
 * This assumes the client sends user info in headers after authentication
 */
export async function getUserFromRequest(request) {
  try {
    // Check for user info in headers (sent by authenticated client)
    const userId = request.headers.get('x-user-id');
    const userAccountNumber = request.headers.get('x-user-account-number');
    const userName = request.headers.get('x-user-name');
    
    if (userId && userAccountNumber && userName) {
      return {
        id: parseInt(userId),
        account_number: userAccountNumber,
        full_name: decodeURIComponent(userName)
      };
    }
    
    // If no headers, try to get from session/cookie (fallback)
    // For now, return null to indicate no user info available
    return null;
    
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Log activity with proper user attribution
 */
export async function logActivityWithUser(activityType, user, data, ipAddress, userAgent) {
  try {
    await query(
      'SELECT log_activity($1, $2, $3, $4, $5, $6)',
      [
        activityType,
        user?.id || null,
        user?.account_number || null,
        JSON.stringify(data),
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    console.error(`Error logging ${activityType} activity:`, error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}
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

/**
 * Verify authentication and authorization for API endpoints
 * @param {Request} request - The incoming request
 * @param {string[]} allowedRoles - Array of allowed account types (e.g., ['admin', 'teacher'])
 * @returns {Promise<{success: boolean, user?: object, error?: string, status?: number}>}
 */
export async function verifyAuth(request, allowedRoles = []) {
  try {
    // Get user information from request headers
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401
      };
    }

    // If specific roles are required, check user's account type
    if (allowedRoles.length > 0) {
      // Get user's account type from database
      const result = await query(
        'SELECT account_type FROM users WHERE id = $1 AND status = $2',
        [user.id, 'active']
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found or inactive',
          status: 401
        };
      }

      const userAccountType = result.rows[0].account_type;
      
      if (!allowedRoles.includes(userAccountType)) {
        return {
          success: false,
          error: 'Insufficient permissions',
          status: 403
        };
      }

      // Add account type to user object
      user.account_type = userAccountType;
    }

    return {
      success: true,
      user: user
    };

  } catch (error) {
    console.error('Error verifying authentication:', error);
    return {
      success: false,
      error: 'Authentication verification failed',
      status: 500
    };
  }
}
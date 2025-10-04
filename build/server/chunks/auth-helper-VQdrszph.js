import { q as query } from './db--iX-5Jmg.js';

async function getUserFromRequest(request) {
  try {
    const userId = request.headers.get("x-user-id");
    const userAccountNumber = request.headers.get("x-user-account-number");
    const userName = request.headers.get("x-user-name");
    if (userId && userAccountNumber && userName) {
      return {
        id: parseInt(userId),
        account_number: userAccountNumber,
        full_name: decodeURIComponent(userName)
      };
    }
    return null;
  } catch (error) {
    console.error("Error extracting user from request:", error);
    return null;
  }
}
async function logActivityWithUser(activityType, user, data, ipAddress, userAgent) {
  try {
    await query(
      "SELECT log_activity($1, $2, $3, $4, $5, $6)",
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
  }
}
async function verifyAuth(request, allowedRoles = []) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        status: 401
      };
    }
    if (allowedRoles.length > 0) {
      const result = await query(
        "SELECT account_type FROM users WHERE id = $1 AND status = $2",
        [user.id, "active"]
      );
      if (result.rows.length === 0) {
        return {
          success: false,
          error: "User not found or inactive",
          status: 401
        };
      }
      const userAccountType = result.rows[0].account_type;
      if (!allowedRoles.includes(userAccountType)) {
        return {
          success: false,
          error: "Insufficient permissions",
          status: 403
        };
      }
      user.account_type = userAccountType;
    }
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return {
      success: false,
      error: "Authentication verification failed",
      status: 500
    };
  }
}

export { getUserFromRequest as g, logActivityWithUser as l, verifyAuth as v };
//# sourceMappingURL=auth-helper-VQdrszph.js.map

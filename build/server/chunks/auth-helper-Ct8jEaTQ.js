import { c as client } from './db-9uwR-1fD.js';
import { ObjectId } from 'mongodb';

function getUserFromRequest(request) {
  const userHeader = request.headers.get("x-user-info");
  if (!userHeader) {
    return null;
  }
  try {
    return JSON.parse(userHeader);
  } catch (error) {
    console.error("Error parsing user header:", error);
    return null;
  }
}
async function logActivityWithUser(action, details, user, ipAddress = null) {
  try {
    const db = client.db(process.env.MONGODB_DB_NAME);
    const activityLogsCollection = db.collection("activity_logs");
    const logEntry = {
      action,
      details,
      user_id: user?.id || null,
      user_name: user?.name || "Unknown",
      user_account_type: user?.account_type || "Unknown",
      ip_address: ipAddress,
      timestamp: /* @__PURE__ */ new Date()
    };
    await activityLogsCollection.insertOne(logEntry);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
async function verifyAuth(request, allowedRoles = []) {
  try {
    const user = getUserFromRequest(request);
    if (!user || !user.id) {
      return { success: false, error: "Authentication required" };
    }
    const db = client.db(process.env.MONGODB_DB_NAME);
    const usersCollection = db.collection("users");
    const userRecord = await usersCollection.findOne(
      { _id: new ObjectId(user.id) },
      { projection: { account_type: 1, status: 1 } }
    );
    if (!userRecord) {
      return { success: false, error: "User not found" };
    }
    if (userRecord.status === "archived") {
      return { success: false, error: "Account is archived" };
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRecord.account_type)) {
      return {
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(", ")}`
      };
    }
    const updatedUser = {
      ...user,
      account_type: userRecord.account_type
    };
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return { success: false, error: "Authentication verification failed" };
  }
}

export { getUserFromRequest as g, logActivityWithUser as l, verifyAuth as v };
//# sourceMappingURL=auth-helper-Ct8jEaTQ.js.map

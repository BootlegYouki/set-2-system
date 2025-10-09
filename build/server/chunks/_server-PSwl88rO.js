import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-9uwR-1fD.js';
import { v as verifyAuth, l as logActivityWithUser } from './auth-helper-Ct8jEaTQ.js';
import 'mongodb';
import 'dotenv';

async function GET({ url, request }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const user = authResult.user;
    const studentId = url.searchParams.get("student_id") || user.id;
    const type = url.searchParams.get("type");
    const isRead = url.searchParams.get("is_read");
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;
    const db = await connectToDatabase();
    const notificationsCollection = db.collection("notifications");
    const filter = { student_id: studentId };
    if (type) {
      filter.type = type;
    }
    if (isRead !== null && isRead !== void 0) {
      filter.is_read = isRead === "true";
    }
    const notifications = await notificationsCollection.find(filter).sort({ created_at: -1 }).skip(offset).limit(limit).toArray();
    const totalCount = await notificationsCollection.countDocuments(filter);
    const formattedNotifications = notifications.map((notification) => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      isRead: notification.is_read,
      relatedId: notification.related_id,
      timestamp: notification.created_at.toISOString(),
      updatedAt: notification.updated_at.toISOString()
    }));
    const unreadCount = await notificationsCollection.countDocuments({
      student_id: studentId,
      is_read: false
    });
    return json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return json({
      success: false,
      error: "Failed to fetch notifications"
    }, { status: 500 });
  }
}
async function PATCH({ request }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const user = authResult.user;
    const requestBody = await request.json();
    const { id, action, ids } = requestBody;
    const db = await connectToDatabase();
    const notificationsCollection = db.collection("notifications");
    if (action === "mark_read" && id) {
      const result = await notificationsCollection.findOneAndUpdate(
        { _id: new db.ObjectId(id), student_id: user.id },
        {
          $set: {
            is_read: true,
            updated_at: /* @__PURE__ */ new Date()
          }
        },
        { returnDocument: "after" }
      );
      if (!result.value) {
        return json({
          error: "Notification not found or access denied"
        }, { status: 404 });
      }
      const updatedNotification = result.value;
      await logActivityWithUser(
        "notification_read",
        user,
        { notification_id: id, title: updatedNotification.title },
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown"
      );
      return json({
        success: true,
        data: {
          id: updatedNotification._id.toString(),
          isRead: updatedNotification.is_read
        }
      });
    }
    if (action === "mark_unread" && id) {
      const result = await notificationsCollection.findOneAndUpdate(
        { _id: new db.ObjectId(id), student_id: user.id },
        {
          $set: {
            is_read: false,
            updated_at: /* @__PURE__ */ new Date()
          }
        },
        { returnDocument: "after" }
      );
      if (!result.value) {
        return json({
          error: "Notification not found or access denied"
        }, { status: 404 });
      }
      return json({
        success: true,
        data: {
          id: result.value._id.toString(),
          isRead: result.value.is_read
        }
      });
    }
    if (action === "mark_all_read") {
      const result = await notificationsCollection.updateMany(
        { student_id: user.id, is_read: false },
        {
          $set: {
            is_read: true,
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      await logActivityWithUser(
        "notifications_mark_all_read",
        user,
        { updated_count: result.modifiedCount },
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown"
      );
      return json({
        success: true,
        data: {
          updatedCount: result.modifiedCount
        }
      });
    }
    if (action === "bulk_mark_read" && ids && Array.isArray(ids)) {
      const objectIds = ids.map((id2) => new db.ObjectId(id2));
      const result = await notificationsCollection.updateMany(
        {
          student_id: user.id,
          _id: { $in: objectIds }
        },
        {
          $set: {
            is_read: true,
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      return json({
        success: true,
        data: {
          updatedIds: ids,
          updatedCount: result.modifiedCount
        }
      });
    }
    return json({
      error: "Invalid action or missing parameters"
    }, { status: 400 });
  } catch (error) {
    console.error("Error updating notification:", error);
    return json({
      success: false,
      error: "Failed to update notification"
    }, { status: 500 });
  }
}
async function DELETE({ request }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const user = authResult.user;
    const { id, ids, action } = await request.json();
    const db = await connectToDatabase();
    const notificationsCollection = db.collection("notifications");
    if (action === "delete_read") {
      const result = await notificationsCollection.deleteMany({
        student_id: user.id,
        is_read: true
      });
      await logActivityWithUser(
        "notifications_delete_read",
        user,
        { deleted_count: result.deletedCount },
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown"
      );
      return json({
        success: true,
        data: {
          deletedCount: result.deletedCount,
          message: "All read notifications deleted successfully"
        }
      });
    }
    if (id) {
      const result = await notificationsCollection.findOneAndDelete({
        _id: new db.ObjectId(id),
        student_id: user.id
      });
      if (!result.value) {
        return json({
          error: "Notification not found or access denied"
        }, { status: 404 });
      }
      await logActivityWithUser(
        "notification_delete",
        user,
        { notification_id: id, title: result.value.title },
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown"
      );
      return json({
        success: true,
        data: {
          message: "Notification deleted successfully"
        }
      });
    }
    if (ids && Array.isArray(ids)) {
      const objectIds = ids.map((id2) => new db.ObjectId(id2));
      const result = await notificationsCollection.deleteMany({
        student_id: user.id,
        _id: { $in: objectIds }
      });
      return json({
        success: true,
        data: {
          deletedIds: ids,
          deletedCount: result.deletedCount,
          message: "Notifications deleted successfully"
        }
      });
    }
    return json({
      error: "Notification ID or IDs required"
    }, { status: 400 });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return json({
      success: false,
      error: "Failed to delete notification"
    }, { status: 500 });
  }
}
async function POST({ request }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const user = authResult.user;
    const { title, message, type = "info", student_id, section_id, send_to_all = false } = await request.json();
    if (!title || !message) {
      return json({
        error: "Title and message are required"
      }, { status: 400 });
    }
    const db = await connectToDatabase();
    const notificationsCollection = db.collection("notifications");
    const studentsCollection = db.collection("students");
    let targetStudents = [];
    if (send_to_all) {
      const students = await studentsCollection.find({}, { projection: { _id: 1 } }).toArray();
      targetStudents = students.map((student) => student._id);
    } else if (section_id) {
      const students = await studentsCollection.find(
        { section_id },
        { projection: { _id: 1 } }
      ).toArray();
      targetStudents = students.map((student) => student._id);
    } else if (student_id) {
      targetStudents = [student_id];
    } else {
      return json({
        error: "Must specify student_id, section_id, or send_to_all"
      }, { status: 400 });
    }
    if (targetStudents.length === 0) {
      return json({
        error: "No target students found"
      }, { status: 400 });
    }
    const notifications = targetStudents.map((studentId) => ({
      student_id: studentId,
      title,
      message,
      type,
      is_read: false,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date(),
      created_by: user.id
    }));
    const result = await notificationsCollection.insertMany(notifications);
    await logActivityWithUser(
      "notification_create",
      user,
      {
        title,
        type,
        target_count: targetStudents.length,
        send_to_all,
        section_id,
        student_id
      },
      request.headers.get("x-forwarded-for") || "unknown",
      request.headers.get("user-agent") || "unknown"
    );
    return json({
      success: true,
      data: {
        message: "Notification created successfully",
        notification_count: result.insertedCount,
        target_students: targetStudents.length
      }
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return json({
      success: false,
      error: "Failed to create notification"
    }, { status: 500 });
  }
}

export { DELETE, GET, PATCH, POST };
//# sourceMappingURL=_server-PSwl88rO.js.map

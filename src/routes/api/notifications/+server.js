import { json } from '@sveltejs/kit';
import { query } from '../../database/db.js';
import { verifyAuth, logActivityWithUser, getUserFromRequest } from '../helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
    const studentId = url.searchParams.get('student_id') || user.id;
    const type = url.searchParams.get('type'); // Filter by notification type
    const isRead = url.searchParams.get('is_read'); // Filter by read status
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // Build query based on filters
    let whereConditions = ['student_id = $1'];
    let queryParams = [studentId];
    let paramIndex = 2;

    if (type) {
      whereConditions.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    if (isRead !== null && isRead !== undefined) {
      whereConditions.push(`is_read = $${paramIndex}`);
      queryParams.push(isRead === 'true');
      paramIndex++;
    }

    const notificationsQuery = `
      SELECT 
        id,
        student_id,
        type,
        title,
        message,
        priority,
        is_read,
        related_id,
        created_at,
        updated_at
      FROM notifications
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await query(notificationsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countParams = queryParams.slice(0, -2);
    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // Format notifications
    const formattedNotifications = result.rows.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      isRead: notification.is_read,
      relatedId: notification.related_id,
      timestamp: notification.created_at.toISOString(),
      updatedAt: notification.updated_at.toISOString()
    }));

    // Get unread count
    const unreadCountQuery = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE student_id = $1 AND is_read = FALSE
    `;
    const unreadResult = await query(unreadCountQuery, [studentId]);
    const unreadCount = parseInt(unreadResult.rows[0].unread_count);

    return json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          total: totalCount,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < totalCount
        },
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
    const requestBody = await request.json();
    const { id, action, ids } = requestBody;

    if (action === 'mark_read' && id) {
      // Mark single notification as read
      const updateQuery = `
        UPDATE notifications 
        SET is_read = TRUE, updated_at = NOW()
        WHERE id = $1 AND student_id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [id, user.id]);

      if (result.rows.length === 0) {
        return json({ 
          error: 'Notification not found or access denied' 
        }, { status: 404 });
      }

      const updatedNotification = result.rows[0];

      // Log activity
      await logActivityWithUser(
        'notification_read',
        user,
        { notification_id: id, title: updatedNotification.title },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      return json({
        success: true,
        data: {
          id: updatedNotification.id,
          isRead: updatedNotification.is_read
        }
      });
    }

    if (action === 'mark_unread' && id) {
      // Mark single notification as unread
      const updateQuery = `
        UPDATE notifications 
        SET is_read = FALSE, updated_at = NOW()
        WHERE id = $1 AND student_id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [id, user.id]);

      if (result.rows.length === 0) {
        return json({ 
          error: 'Notification not found or access denied' 
        }, { status: 404 });
      }

      return json({
        success: true,
        data: {
          id: result.rows[0].id,
          isRead: result.rows[0].is_read
        }
      });
    }

    if (action === 'mark_all_read') {
      // Mark all notifications as read for the user
      const updateQuery = `
        UPDATE notifications 
        SET is_read = TRUE, updated_at = NOW()
        WHERE student_id = $1 AND is_read = FALSE
      `;

      const result = await query(updateQuery, [user.id]);

      // Log activity
      await logActivityWithUser(
        'notifications_mark_all_read',
        user,
        { updated_count: result.rowCount },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      return json({
        success: true,
        data: {
          updatedCount: result.rowCount
        }
      });
    }

    if (action === 'bulk_mark_read' && ids && Array.isArray(ids)) {
      // Mark multiple notifications as read
      const placeholders = ids.map((_, index) => `$${index + 2}`).join(',');
      const updateQuery = `
        UPDATE notifications 
        SET is_read = TRUE, updated_at = NOW()
        WHERE student_id = $1 AND id IN (${placeholders})
        RETURNING id
      `;

      const result = await query(updateQuery, [user.id, ...ids]);

      return json({
        success: true,
        data: {
          updatedIds: result.rows.map(row => row.id),
          updatedCount: result.rows.length
        }
      });
    }

    return json({ 
      error: 'Invalid action or missing parameters' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating notification:', error);
    return json({ 
      success: false, 
      error: 'Failed to update notification' 
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
    const { id, ids, action } = await request.json();

    if (action === 'delete_read') {
      // Delete all read notifications for the user
      const deleteQuery = `
        DELETE FROM notifications 
        WHERE student_id = $1 AND is_read = TRUE
        RETURNING id
      `;

      const result = await query(deleteQuery, [user.id]);

      // Log activity
      await logActivityWithUser(
        'notifications_delete_read',
        user,
        { deleted_count: result.rows.length },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      return json({
        success: true,
        data: {
          deletedCount: result.rows.length,
          message: 'All read notifications deleted successfully'
        }
      });
    }

    if (id) {
      // Delete single notification
      const deleteQuery = `
        DELETE FROM notifications 
        WHERE id = $1 AND student_id = $2
        RETURNING id, title
      `;

      const result = await query(deleteQuery, [id, user.id]);

      if (result.rows.length === 0) {
        return json({ 
          error: 'Notification not found or access denied' 
        }, { status: 404 });
      }

      // Log activity
      await logActivityWithUser(
        'notification_delete',
        user,
        { notification_id: id, title: result.rows[0].title },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      return json({
        success: true,
        data: {
          message: 'Notification deleted successfully'
        }
      });
    }

    if (ids && Array.isArray(ids)) {
      // Delete multiple notifications
      const placeholders = ids.map((_, index) => `$${index + 2}`).join(',');
      const deleteQuery = `
        DELETE FROM notifications 
        WHERE student_id = $1 AND id IN (${placeholders})
        RETURNING id
      `;

      const result = await query(deleteQuery, [user.id, ...ids]);

      return json({
        success: true,
        data: {
          deletedIds: result.rows.map(row => row.id),
          deletedCount: result.rows.length,
          message: 'Notifications deleted successfully'
        }
      });
    }

    return json({ 
      error: 'Notification ID or IDs required' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return json({ 
      success: false, 
      error: 'Failed to delete notification' 
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Verify authentication - only allow admin/teacher to create notifications manually
    const authResult = await verifyAuth(request, ['admin', 'teacher']);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
    const { student_id, type, title, message, priority = 'medium', related_id } = await request.json();

    if (!student_id || !type || !title || !message) {
      return json({ 
        error: 'Student ID, type, title, and message are required' 
      }, { status: 400 });
    }

    // Validate type
    const validTypes = ['todo', 'grade', 'document'];
    if (!validTypes.includes(type)) {
      return json({ 
        error: 'Invalid notification type. Must be one of: ' + validTypes.join(', ') 
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return json({ 
        error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ') 
      }, { status: 400 });
    }

    // Insert new notification
    const insertQuery = `
      INSERT INTO notifications (
        student_id, 
        type, 
        title, 
        message, 
        priority,
        related_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [
      student_id,
      type,
      title,
      message,
      priority,
      related_id
    ]);

    const newNotification = result.rows[0];

    // Log activity
    await logActivityWithUser(
      'notification_create',
      user,
      { 
        notification_id: newNotification.id, 
        student_id: student_id,
        type: type,
        title: title 
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    // Format the response
    const formattedNotification = {
      id: newNotification.id,
      type: newNotification.type,
      title: newNotification.title,
      message: newNotification.message,
      priority: newNotification.priority,
      isRead: newNotification.is_read,
      relatedId: newNotification.related_id,
      timestamp: newNotification.created_at.toISOString(),
      updatedAt: newNotification.updated_at.toISOString()
    };

    return json({
      success: true,
      data: formattedNotification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return json({ 
      success: false, 
      error: 'Failed to create notification' 
    }, { status: 500 });
  }
}
import webpush from 'web-push';

/**
 * Push Notification Server-Side Helper
 * Provides utility functions for sending push notifications from the server
 */

// Configure web-push with VAPID details
let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return true;
  
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@set2system.com';
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push Helper] VAPID keys not configured. Push notifications will not work.');
    return false;
  }
  
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  isConfigured = true;
  return true;
}

/**
 * Send a push notification to a specific user
 * @param {Object} db - MongoDB database instance
 * @param {string} userId - Target user's ID
 * @param {Object} notification - Notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {string} [notification.icon] - Notification icon URL
 * @param {string} [notification.tag] - Notification tag for grouping
 * @param {Object} [notification.data] - Additional data (e.g., URL to open)
 * @param {boolean} [notification.requireInteraction] - Whether to require user interaction
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendPushToUser(db, userId, notification) {
  if (!ensureConfigured()) {
    console.warn('[Push Helper] Cannot send push - VAPID not configured');
    return { sent: 0, failed: 0 };
  }
  
  try {
    const subscriptionsCollection = db.collection('push_subscriptions');
    
    // Get all active subscriptions for the user
    const subscriptions = await subscriptionsCollection.find({
      userId: userId,
      isActive: true
    }).toArray();
    
    if (subscriptions.length === 0) {
      console.log(`[Push Helper] No subscriptions found for user: ${userId}`);
      return { sent: 0, failed: 0 };
    }
    
    // Prepare payload - always include timestamp in tag to ensure notifications show
    const payload = JSON.stringify({
      title: notification.title || 'SET-2 System',
      body: notification.body || 'You have a new notification',
      icon: notification.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `${notification.tag || 'notification'}-${Date.now()}`,
      renotify: true, // Always show notification even if same tag exists
      data: notification.data || { url: '/' },
      requireInteraction: notification.requireInteraction || false,
      vibrate: [200, 100, 200]
    });
    
    let sent = 0;
    let failed = 0;
    const invalidEndpoints = [];
    
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        
        // Update last used
        await subscriptionsCollection.updateOne(
          { endpoint: sub.endpoint },
          { $set: { lastUsed: new Date() } }
        );
        
      } catch (error) {
        failed++;
        
        // Mark invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          invalidEndpoints.push(sub.endpoint);
        }
        
        console.error(`[Push Helper] Failed to send to user ${userId}:`, error.message);
      }
    }
    
    // Cleanup invalid subscriptions
    if (invalidEndpoints.length > 0) {
      await subscriptionsCollection.updateMany(
        { endpoint: { $in: invalidEndpoints } },
        { $set: { isActive: false, deactivatedAt: new Date() } }
      );
    }
    
    return { sent, failed };
    
  } catch (error) {
    console.error('[Push Helper] Error sending push notification:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send a push notification to multiple users
 * @param {Object} db - MongoDB database instance
 * @param {string[]} userIds - Array of user IDs
 * @param {Object} notification - Notification payload
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendPushToUsers(db, userIds, notification) {
  if (!ensureConfigured()) {
    return { sent: 0, failed: 0 };
  }
  
  let totalSent = 0;
  let totalFailed = 0;
  
  // Send to each user
  for (const userId of userIds) {
    const result = await sendPushToUser(db, userId, notification);
    totalSent += result.sent;
    totalFailed += result.failed;
  }
  
  return { sent: totalSent, failed: totalFailed };
}

/**
 * Send a document request notification with push
 * @param {Object} db - MongoDB database instance
 * @param {string} studentId - Student's user ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} requestId - Document request ID
 * @param {string} status - Document request status
 */
export async function sendDocumentRequestPush(db, studentId, title, message, requestId, status) {
  // Determine notification priority based on status
  const requireInteraction = ['for_pickup', 'rejected', 'for_compliance'].includes(status);
  
  // Create unique tag for each notification (timestamp ensures it always shows)
  const tag = `doc-request-${requestId}-${Date.now()}`;
  
  await sendPushToUser(db, studentId, {
    title,
    body: message,
    tag,
    requireInteraction,
    data: {
      url: '/?section=documents',
      type: 'document_request',
      section: 'documents',
      requestId,
      status
    }
  });
}

/**
 * Send a grade release notification with push
 * @param {Object} db - MongoDB database instance
 * @param {string} studentId - Student's user ID
 * @param {string} teacherName - Teacher's formatted name
 * @param {string} subjectName - Subject name
 */
export async function sendGradeReleasePush(db, studentId, teacherName, subjectName) {
  const title = `Grade Released: ${subjectName}`;
  const body = `Your grade in ${subjectName} has been released by ${teacherName}. Check your grade report.`;
  
  // Timestamp added automatically by sendPushToUser for uniqueness
  await sendPushToUser(db, studentId, {
    title,
    body,
    tag: `grade-${subjectName}`,
    data: {
      url: '/?section=grades',
      type: 'grade_release',
      section: 'grades',
      subject: subjectName
    }
  });
}

/**
 * Send a bulk grade release notification
 * @param {Object} db - MongoDB database instance
 * @param {string[]} studentIds - Array of student IDs
 * @param {string} teacherName - Teacher's name
 * @param {string} subjectName - Subject name
 */
export async function sendBulkGradeReleasePush(db, studentIds, teacherName, subjectName) {
  const notification = {
    title: `Grade Released: ${subjectName}`,
    body: `Your grade in ${subjectName} has been released by ${teacherName}. Check your grade report.`,
    tag: `grade-${subjectName}`, // Timestamp added automatically by sendPushToUser
    data: {
      url: '/?section=grades',
      type: 'grade_release',
      section: 'grades',
      subject: subjectName
    }
  };
  
  return await sendPushToUsers(db, studentIds, notification);
}

/**
 * Send a general notification with push
 * @param {Object} db - MongoDB database instance
 * @param {string} studentId - Student's user ID
 * @param {Object} notification - Notification details
 */
export async function sendGeneralPush(db, studentId, notification) {
  await sendPushToUser(db, studentId, {
    title: notification.title,
    body: notification.message,
    tag: notification.tag || `general-${Date.now()}`,
    data: {
      url: notification.url || '/?section=notifications',
      type: notification.type || 'general',
      section: notification.section || 'notifications'
    }
  });
}

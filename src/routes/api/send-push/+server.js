import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';
import webpush from 'web-push';

/**
 * POST /api/send-push - Send a push notification to one or more users
 * This endpoint is used by the server to send push notifications
 */

// Configure web-push with VAPID details
function configureWebPush() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@set2system.com';
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('[Send Push] VAPID keys not configured');
    return false;
  }
  
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  return true;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Verify authentication - only admins and teachers can send push notifications directly
    const authResult = await verifyAuth(request, ['admin', 'teacher']);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    
    // Configure web-push
    if (!configureWebPush()) {
      return json({
        success: false,
        error: 'Push notifications not configured. VAPID keys not found.'
      }, { status: 500 });
    }
    
    const body = await request.json();
    const { 
      userId,      // Single user ID
      userIds,     // Array of user IDs
      title,
      body: notificationBody,
      icon,
      badge,
      tag,
      data,
      requireInteraction,
      actions
    } = body;
    
    if (!title || !notificationBody) {
      return json({
        success: false,
        error: 'Title and body are required'
      }, { status: 400 });
    }
    
    if (!userId && !userIds) {
      return json({
        success: false,
        error: 'userId or userIds is required'
      }, { status: 400 });
    }
    
    // Connect to database
    const db = await connectToDatabase();
    const subscriptionsCollection = db.collection('push_subscriptions');
    
    // Build query for subscriptions
    const targetUserIds = userIds || [userId];
    const subscriptions = await subscriptionsCollection.find({
      userId: { $in: targetUserIds },
      isActive: true
    }).toArray();
    
    if (subscriptions.length === 0) {
      return json({
        success: true,
        message: 'No active subscriptions found for target users',
        sent: 0,
        failed: 0
      });
    }
    
    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: notificationBody,
      icon: icon || '/pwa-192x192.png',
      badge: badge || '/pwa-192x192.png',
      tag: tag || `notification-${Date.now()}`,
      data: data || {},
      requireInteraction: requireInteraction || false,
      actions: actions || []
    });
    
    // Send notifications to all subscriptions
    let sent = 0;
    let failed = 0;
    const errors = [];
    const invalidEndpoints = [];
    
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        
        // Update last used timestamp
        await subscriptionsCollection.updateOne(
          { endpoint: sub.endpoint },
          { $set: { lastUsed: new Date() } }
        );
        
      } catch (error) {
        failed++;
        errors.push({
          userId: sub.userId,
          error: error.message
        });
        
        // Handle expired/invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          invalidEndpoints.push(sub.endpoint);
          console.log(`[Send Push] Marking subscription as inactive: ${sub.endpoint}`);
        }
      }
    }
    
    // Mark invalid subscriptions as inactive
    if (invalidEndpoints.length > 0) {
      await subscriptionsCollection.updateMany(
        { endpoint: { $in: invalidEndpoints } },
        { $set: { isActive: false, deactivatedAt: new Date() } }
      );
    }
    
    console.log(`[Send Push] Notifications sent: ${sent}, failed: ${failed}`);
    
    return json({
      success: true,
      message: `Push notifications sent`,
      sent,
      failed,
      total: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('[Send Push] Error sending push notifications:', error);
    return json({
      success: false,
      error: 'Failed to send push notifications'
    }, { status: 500 });
  }
}

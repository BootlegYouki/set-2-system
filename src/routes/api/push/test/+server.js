import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';
import webpush from 'web-push';

/**
 * GET /api/push/test?userId=xxx - Test push notification (for debugging iOS)
 * This endpoint sends a minimal test notification
 */

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const userId = url.searchParams.get('userId');
  
  if (!userId) {
    return json({ error: 'userId parameter required' }, { status: 400 });
  }
  
  try {
    // Configure VAPID
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@set2system.com';
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      return json({ 
        error: 'VAPID not configured',
        publicKey: !!vapidPublicKey,
        privateKey: !!vapidPrivateKey
      }, { status: 500 });
    }
    
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    
    // Get subscriptions
    const db = await connectToDatabase();
    const subscriptions = await db.collection('push_subscriptions').find({
      userId: userId,
      isActive: true
    }).toArray();
    
    if (subscriptions.length === 0) {
      return json({ 
        error: 'No subscriptions found',
        userId,
        subscriptionCount: 0
      }, { status: 404 });
    }
    
    // Very minimal payload for iOS compatibility
    const payload = JSON.stringify({
      title: 'Test Notification',
      body: `Test at ${new Date().toLocaleTimeString()}`
    });
    
    const results = [];
    
    for (const sub of subscriptions) {
      const result = {
        endpoint: sub.endpoint.substring(0, 50) + '...',
        isApple: sub.endpoint.includes('apple'),
        status: 'pending'
      };
      
      try {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        
        // Send with detailed response
        const response = await webpush.sendNotification(pushSub, payload);
        result.status = 'sent';
        result.statusCode = response?.statusCode || 201;
        result.headers = response?.headers || {};
        
      } catch (error) {
        result.status = 'failed';
        result.error = error.message;
        result.statusCode = error.statusCode;
        result.body = error.body;
        
        // If 410 Gone, the subscription is invalid
        if (error.statusCode === 410 || error.statusCode === 404) {
          result.subscriptionInvalid = true;
        }
      }
      
      results.push(result);
    }
    
    return json({
      success: true,
      userId,
      subscriptionCount: subscriptions.length,
      payloadSize: payload.length,
      payload: JSON.parse(payload),
      results
    });
    
  } catch (error) {
    return json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

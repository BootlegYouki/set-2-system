import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';

/**
 * POST /api/push/subscribe - Save a push subscription to the database
 * DELETE /api/push/subscribe - Remove a push subscription from the database
 */

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { subscription, userId, resubscribe } = body;
    
    if (!subscription || !subscription.endpoint) {
      return json({
        success: false,
        error: 'Invalid subscription data'
      }, { status: 400 });
    }
    
    // Connect to database
    const db = await connectToDatabase();
    const subscriptionsCollection = db.collection('push_subscriptions');
    
    // Create subscription document for update (without createdAt)
    const updateDoc = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null
      },
      userId: userId || null,
      userAgent: request.headers.get('user-agent') || null,
      updatedAt: new Date(),
      lastUsed: null,
      isActive: true
    };
    
    // Upsert subscription (update if exists, insert if not)
    // Only set createdAt on insert, not on update
    const result = await subscriptionsCollection.updateOne(
      { endpoint: subscription.endpoint },
      { 
        $set: updateDoc,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    
    console.log(`[Push Subscribe] Subscription ${result.upsertedCount ? 'created' : 'updated'} for user: ${userId || 'anonymous'}`);
    
    return json({
      success: true,
      message: resubscribe ? 'Subscription renewed' : 'Subscription saved',
      isNew: result.upsertedCount > 0
    });
    
  } catch (error) {
    console.error('[Push Subscribe] Error saving subscription:', error);
    return json({
      success: false,
      error: 'Failed to save subscription'
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
  try {
    const body = await request.json();
    const { endpoint, userId } = body;
    
    if (!endpoint) {
      return json({
        success: false,
        error: 'Endpoint required'
      }, { status: 400 });
    }
    
    // Connect to database
    const db = await connectToDatabase();
    const subscriptionsCollection = db.collection('push_subscriptions');
    
    // Delete subscription
    const result = await subscriptionsCollection.deleteOne({ endpoint });
    
    console.log(`[Push Subscribe] Subscription deleted for user: ${userId || 'anonymous'}, deleted: ${result.deletedCount}`);
    
    return json({
      success: true,
      message: 'Subscription removed',
      deleted: result.deletedCount > 0
    });
    
  } catch (error) {
    console.error('[Push Subscribe] Error deleting subscription:', error);
    return json({
      success: false,
      error: 'Failed to delete subscription'
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const userId = url.searchParams.get('userId');
    
    // Connect to database
    const db = await connectToDatabase();
    const subscriptionsCollection = db.collection('push_subscriptions');
    
    // Build query
    const query = userId ? { userId, isActive: true } : { isActive: true };
    
    // Get subscription count
    const count = await subscriptionsCollection.countDocuments(query);
    
    return json({
      success: true,
      count,
      hasSubscription: count > 0
    });
    
  } catch (error) {
    console.error('[Push Subscribe] Error checking subscriptions:', error);
    return json({
      success: false,
      error: 'Failed to check subscriptions'
    }, { status: 500 });
  }
}

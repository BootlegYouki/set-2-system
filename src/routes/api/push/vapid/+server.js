import { json } from '@sveltejs/kit';

/**
 * GET /api/push/vapid - Get the VAPID public key for push notifications
 * This endpoint returns the public VAPID key that clients use to subscribe to push notifications
 */

// VAPID keys should be generated once and stored securely
// Generate new keys using: npx web-push generate-vapid-keys
// Store the private key in environment variables (VAPID_PRIVATE_KEY)
// The public key can be exposed to clients

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    // Get VAPID public key from environment variables
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.error('[VAPID] VAPID_PUBLIC_KEY environment variable not set');
      return json({
        success: false,
        error: 'Push notifications not configured. VAPID keys not found.'
      }, { status: 500 });
    }
    
    return json({
      success: true,
      publicKey: vapidPublicKey
    });
    
  } catch (error) {
    console.error('[VAPID] Error getting VAPID public key:', error);
    return json({
      success: false,
      error: 'Failed to get VAPID public key'
    }, { status: 500 });
  }
}

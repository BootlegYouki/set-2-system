import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';
import { ObjectId } from 'mongodb';

/**
 * POST /api/auth/heartbeat
 * Expects x-user-info header (JSON) and optional body { timestamp }
 * Updates users.last_active_at with provided timestamp (or now)
 */
export async function POST({ request }) {
  try {
    const userHeader = request.headers.get('x-user-info');
    if (!userHeader) {
      return json({ success: false, error: 'Missing user header' }, { status: 400 });
    }

    let user;
    try {
      user = JSON.parse(userHeader);
    } catch (err) {
      return json({ success: false, error: 'Invalid user header' }, { status: 400 });
    }

    if (!user || !user.id) {
      return json({ success: false, error: 'Invalid user' }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));
    const ts = payload && payload.timestamp ? new Date(payload.timestamp) : new Date();

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    try {
      await usersCollection.updateOne(
        { _id: new ObjectId(user.id) },
        { $set: { last_active_at: ts } }
      );
    } catch (err) {
      console.error('Failed to update last_active_at:', err);
      // don't fail hard; return success:false so client may retry
      return json({ success: false, error: 'DB update failed' }, { status: 500 });
    }

    return json({ success: true, updated_at: ts.toISOString() });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

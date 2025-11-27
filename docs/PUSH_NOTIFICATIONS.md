# Push Notifications Setup Guide

This guide explains how to set up push notifications for the SET-2 System PWA.

## Overview

Push notifications allow the system to send real-time alerts to students for:
- **Grade Releases**: When a teacher verifies and releases grades
- **Document Request Updates**: Status changes (approved, rejected, ready for pickup, etc.)

## Setup Instructions

### 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for push notifications.

Run this command to generate new keys:
```bash
npx web-push generate-vapid-keys
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:admin@yourschool.com
```

⚠️ **IMPORTANT**: Never commit your private key to version control!

### 3. Database Collection

The system will automatically create a `push_subscriptions` collection in MongoDB with this structure:

```javascript
{
  endpoint: String,       // Push service endpoint URL
  keys: {
    p256dh: String,       // Client public key
    auth: String          // Auth secret
  },
  userId: String,         // Associated user ID
  userAgent: String,      // Browser/device info
  createdAt: Date,
  updatedAt: Date,
  lastUsed: Date,
  isActive: Boolean
}
```

## How It Works

### Client-Side (Browser)

1. **Service Worker Registration**: The `sw.js` file handles push events
2. **Permission Request**: Users are prompted to allow notifications
3. **Subscription**: The browser creates a push subscription with VAPID credentials
4. **Storage**: Subscription is saved to the server and linked to the user

### Server-Side (Node.js)

1. **Subscription Storage**: Push subscriptions are stored in MongoDB
2. **Sending Notifications**: When events occur (grade release, doc request update), the server:
   - Retrieves the user's push subscriptions
   - Sends the notification payload via `web-push` library
   - Handles errors and cleans up invalid subscriptions

## Files Structure

```
src/
├── lib/push/
│   └── pushNotifications.js    # Client-side push utilities
├── routes/api/
│   ├── push/
│   │   ├── subscribe/+server.js # Subscription management
│   │   └── vapid/+server.js     # VAPID public key endpoint
│   ├── send-push/+server.js     # Send push endpoint
│   └── helper/
│       └── push-helper.js       # Server-side push utilities
├── components/common/
│   └── PushNotificationToggle.svelte # UI toggle component
static/
└── sw.js                        # Service Worker
```

## User Experience

1. **First Visit**: Users see a toggle to enable push notifications
2. **Permission Request**: Browser shows permission dialog
3. **Enabled State**: Toggle shows "Enabled" with green indicator
4. **Receiving Notifications**:
   - Notification appears even if the app is closed
   - Clicking opens the app to the relevant section
   - Badge shows on app icon (if supported)

## Notification Types

### Grade Release
```javascript
{
  title: "Grade Released: Mathematics",
  body: "Your grade in Mathematics has been released by Mr. Smith.",
  data: {
    url: "/student/grades",
    type: "grade_release"
  }
}
```

### Document Request Update
```javascript
{
  title: "Document Ready for Pickup",
  body: "Your Transcript of Records is ready for pickup!",
  data: {
    url: "/student/documents",
    type: "document_request",
    requestId: "REQ-2025-0001"
  }
}
```

## Troubleshooting

### Notifications Not Working

1. **Check browser support**: Not all browsers support push notifications
2. **Check permission**: User may have blocked notifications
3. **Check VAPID keys**: Ensure keys are correctly configured
4. **Check HTTPS**: Push notifications require HTTPS (except localhost)

### Testing

1. Enable push notifications in the notification settings
2. Click "Send Test Notification" button
3. A test notification should appear

### Browser Compatibility

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅      | ✅ (Android) |
| Firefox | ✅      | ✅ (Android) |
| Safari  | ✅ (macOS 13+) | ✅ (iOS 16.4+) |
| Edge    | ✅      | ✅     |

## Security Considerations

1. **VAPID Private Key**: Keep it secret, never expose to clients
2. **User Consent**: Always ask permission before subscribing
3. **Subscription Cleanup**: Remove invalid subscriptions automatically
4. **Rate Limiting**: Consider implementing rate limits for push sends

/**
 * VAPID Key Generator for Push Notifications
 * 
 * Run this script once to generate your VAPID keys:
 *   node scripts/generate-vapid-keys.js
 * 
 * Then add the keys to your .env file:
 *   VAPID_PUBLIC_KEY=<your-public-key>
 *   VAPID_PRIVATE_KEY=<your-private-key>
 *   VAPID_EMAIL=mailto:your-email@example.com
 */

import webpush from 'web-push';

console.log('Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_EMAIL=mailto:admin@set2system.com');
console.log('\n');
console.log('⚠️  IMPORTANT: Keep your private key secret!');
console.log('Never commit the private key to version control.');

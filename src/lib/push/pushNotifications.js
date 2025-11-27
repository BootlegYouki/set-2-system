/**
 * Push Notifications Client-Side Utilities
 * Handles service worker registration, subscription management, and push notification permissions
 */

import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';

// Store for push notification state
export const pushNotificationStore = writable({
  isSupported: false,
  isSubscribed: false,
  permission: 'default', // 'default', 'granted', 'denied'
  subscription: null,
  serviceWorkerReady: false,
  error: null
});

// VAPID public key - will be fetched from server
let vapidPublicKey = null;

/**
 * Check if push notifications are supported by the browser
 */
export function isPushSupported() {
  if (!browser) return false;
  
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const hasNotification = 'Notification' in window;
  
  console.log('[Push] Support check:', {
    serviceWorker: hasServiceWorker,
    PushManager: hasPushManager,
    Notification: hasNotification,
    userAgent: navigator.userAgent
  });
  
  return hasServiceWorker && hasPushManager && hasNotification;
}

/**
 * Convert a base64 string to a Uint8Array for the applicationServerKey
 * @param {string} base64String - The base64 encoded VAPID public key
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Get the VAPID public key from the server
 * @returns {Promise<string>}
 */
async function getVapidPublicKey() {
  if (vapidPublicKey) return vapidPublicKey;
  
  try {
    const response = await fetch('/api/push/vapid');
    const data = await response.json();
    
    if (data.success && data.publicKey) {
      vapidPublicKey = data.publicKey;
      return vapidPublicKey;
    }
    throw new Error('Failed to get VAPID public key');
  } catch (error) {
    console.error('Error fetching VAPID public key:', error);
    throw error;
  }
}

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export async function registerServiceWorker() {
  if (!browser || !('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }
  
  try {
    // Check if there's already a registered service worker (from vite-plugin-pwa)
    let registration = await navigator.serviceWorker.getRegistration('/');
    
    if (!registration) {
      // If no registration exists, register manually
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[Push] Service Worker registered manually:', registration.scope);
    } else {
      console.log('[Push] Using existing Service Worker:', registration.scope);
    }
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    pushNotificationStore.update(state => ({
      ...state,
      serviceWorkerReady: true
    }));
    
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    pushNotificationStore.update(state => ({
      ...state,
      error: error.message
    }));
    throw error;
  }
}

/**
 * Request notification permission from the user
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!browser) return 'denied';
  
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    pushNotificationStore.update(state => ({
      ...state,
      permission
    }));
    
    console.log('[Push] Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Get the current notification permission status
 * @returns {NotificationPermission}
 */
export function getNotificationPermission() {
  if (!browser || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Subscribe to push notifications
 * @param {string} userId - The user's ID to associate with the subscription
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(userId) {
  if (!browser) return null;
  
  try {
    // Check if push is supported
    if (!isPushSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }
    
    // Request permission if not already granted
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
    
    // Get the VAPID public key
    const publicKey = await getVapidPublicKey();
    console.log('[Push] Got VAPID public key');
    
    // Get the service worker registration - make sure it's ready
    let registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready');
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    console.log('[Push] Existing subscription:', !!subscription);
    
    // Always create a new subscription if none exists
    if (!subscription) {
      console.log('[Push] Creating new subscription...');
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        console.log('[Push] New subscription created successfully');
      } catch (subscribeError) {
        console.error('[Push] Failed to create subscription:', subscribeError);
        // If it's an AbortError, try re-registering the service worker
        if (subscribeError.name === 'AbortError') {
          console.log('[Push] AbortError - trying to re-register service worker...');
          // Unregister and re-register service worker
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          await navigator.serviceWorker.ready;
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          });
          console.log('[Push] Subscription created after re-registering SW');
        } else {
          throw subscribeError;
        }
      }
    } else {
      console.log('[Push] Using existing subscription');
    }
    
    if (!subscription) {
      throw new Error('Failed to create push subscription');
    }
    
    // Send subscription to server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId
      })
    });
    
    const result = await response.json();
    console.log('[Push] Server response:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save subscription');
    }
    
    // Update store
    pushNotificationStore.update(state => ({
      ...state,
      isSubscribed: true,
      subscription: subscription,
      permission: 'granted',
      error: null
    }));
    
    console.log('[Push] Subscription saved to server');
    return subscription;
    
  } catch (error) {
    console.error('[Push] Subscription error:', error);
    pushNotificationStore.update(state => ({
      ...state,
      isSubscribed: false,
      subscription: null,
      error: error.message
    }));
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush(userId) {
  if (!browser) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const endpoint = subscription.endpoint;
      
      // Unsubscribe from push manager (browser side)
      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed) {
        // Remove subscription from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: endpoint,
            userId: userId
          })
        });
        
        console.log('[Push] Unsubscribed successfully');
      }
    } else {
      console.log('[Push] No subscription to unsubscribe');
    }
    
    // Update store
    pushNotificationStore.update(state => ({
      ...state,
      isSubscribed: false,
      subscription: null,
      error: null
    }));
    
    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    // Still update the store even on error
    pushNotificationStore.update(state => ({
      ...state,
      isSubscribed: false,
      subscription: null,
      error: error.message
    }));
    return false;
  }
}

/**
 * Check the current subscription status
 * @returns {Promise<boolean>}
 */
export async function checkSubscriptionStatus() {
  if (!browser || !isPushSupported()) {
    pushNotificationStore.update(state => ({
      ...state,
      isSupported: false,
      isSubscribed: false
    }));
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    const isSubscribed = !!subscription;
    const permission = getNotificationPermission();
    
    pushNotificationStore.update(state => ({
      ...state,
      isSupported: true,
      isSubscribed,
      subscription,
      permission,
      serviceWorkerReady: true
    }));
    
    return isSubscribed;
  } catch (error) {
    console.error('[Push] Error checking subscription:', error);
    return false;
  }
}

/**
 * Initialize push notifications
 * Call this when the app starts
 * @returns {Promise<void>}
 */
export async function initPushNotifications() {
  if (!browser) return;
  
  const isSupported = isPushSupported();
  const permission = getNotificationPermission();
  
  pushNotificationStore.update(state => ({
    ...state,
    isSupported,
    permission
  }));
  
  if (!isSupported) {
    console.log('[Push] Push notifications not supported');
    return;
  }
  
  try {
    // Register service worker
    await registerServiceWorker();
    
    // Check subscription status
    await checkSubscriptionStatus();
    
    console.log('[Push] Push notifications initialized');
  } catch (error) {
    console.error('[Push] Initialization error:', error);
  }
}

/**
 * Send a test notification (for debugging)
 * @param {string} title 
 * @param {string} body 
 */
export async function sendTestNotification(title = 'Test Notification', body = 'This is a test notification from SET-2 System') {
  if (!browser) return;
  
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('[Push] Cannot send notification - permission not granted');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    // Use unique tag with timestamp to ensure notification always shows
    const uniqueTag = `test-notification-${Date.now()}`;
    await registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: uniqueTag,
      renotify: true, // Always show even if same tag exists
      vibrate: [200, 100, 200]
    });
    console.log('[Push] Test notification sent with tag:', uniqueTag);
  } catch (error) {
    console.error('[Push] Error sending test notification:', error);
  }
}

/**
 * Show a local notification (not from push, but directly)
 * @param {Object} options - Notification options
 */
export async function showLocalNotification(options) {
  if (!browser) return;
  
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('[Push] Cannot show notification - permission not granted');
    return;
  }
  
  const {
    title = 'SET-2 System',
    body = 'You have a new notification',
    icon = '/pwa-192x192.png',
    badge = '/pwa-192x192.png',
    tag = 'local-notification',
    data = {},
    requireInteraction = false,
    actions = []
  } = options;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data,
      requireInteraction,
      actions,
      vibrate: [200, 100, 200]
    });
  } catch (error) {
    console.error('[Push] Error showing local notification:', error);
  }
}
